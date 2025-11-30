import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
  Linking,
} from "react-native";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PeachyColors } from "../../constants/Colors";
import { useCart } from "../../contexts/CartContext";

type PhotoType = "individual" | "with_sibling" | "with_friend" | "group";

type ApiPhoto = {
  id: number;
  file_name: string;
  file_url: string;
  photo_type: PhotoType;
  added_at: string;        // ISO
  student_names: string[]; // ["Alice", "Bob"]
};

type ApiResponse = {
  data: ApiPhoto[];
  total: number;
  page: number;
  limit: number;
};

type Photo = {
  id: string;
  uri: string;
  date: string;
  type: PhotoType;
  students: string[];
  price: number; // Added price field
};

const PHOTO_TYPES: Array<"All" | PhotoType> = ["All", "individual", "with_sibling", "with_friend", "group"];
const PAGE_SIZE = 20;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:5000";
const PHOTO_PRICE = 5.00; // £5 price for each photo

export default function Gallery() {
  const router = useRouter();
  const { addToCart, isInCart, getTotalItems } = useCart();
  
  // State for purchased photos
  const [purchasedPhotos, setPurchasedPhotos] = useState<Set<string>>(new Set());

  // UI state
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | PhotoType>("All");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // data state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // control state
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);       // initial fetch
  const [fetchingMore, setFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasMore = photos.length < total;

  const loadToken = useCallback(async () => {
    const t = await AsyncStorage.getItem("accessToken");
    setToken(t);
    return t;
  }, []);

  // Check if photo is purchased
  const checkIfPhotoPurchased = useCallback(async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (!userDataString) return;
      
      const userData = JSON.parse(userDataString);
      const userId = Number(userData.id);
      
      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/parent/${userId}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const purchasedPhotoIds = new Set<string>();
        data.forEach(order => {
          if (order.items) {
            order.items.forEach((item: any) => {
              if (item.item_image) {
                // Extract photo ID from item_id (format: "photo_123")
                if (item.item_id && item.item_id.startsWith('photo_')) {
                  const photoId = item.item_id.replace('photo_', '');
                  purchasedPhotoIds.add(photoId);
                }
              }
            });
          }
        });
        console.log('Purchased photo IDs:', Array.from(purchasedPhotoIds));
        console.log('Current photos in gallery:', photos.map(p => ({ id: p.id, name: p.type })));
        setPurchasedPhotos(purchasedPhotoIds);
      }
    } catch (error) {
      console.error('Error checking purchased photos:', error);
    }
  }, []);

  const buildQuery = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(PAGE_SIZE));
      if (searchText.trim()) {
        // backend supports event_name and student_name
        params.set("event_name", searchText.trim());
        params.set("student_name", searchText.trim());
      }
      if (typeFilter !== "All") params.set("photo_type", typeFilter);
      return `${API_BASE}/api/parent/photos?${params.toString()}`;
    },
    [searchText, typeFilter]
  );

  const mapApi = (items: ApiPhoto[]): Photo[] =>
    (items ?? []).map((p) => ({
      id: String(p.id),
      uri: p.file_url,
      date: new Date(p.added_at).toLocaleDateString(),
      type: p.photo_type,
      students: p.student_names ?? [],
      price: PHOTO_PRICE, // Add price to each photo
    }));

  const fetchPage = useCallback(
    async (nextPage: number, mode: "refresh" | "append" | "replace" = "replace") => {
      if (!token) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (mode === "append") setFetchingMore(true);
        if (mode === "refresh" || mode === "replace") setError(null);

        const res = await fetch(buildQuery(nextPage), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch photos (${res.status})`);
        }

        const json: ApiResponse = await res.json();
        const mapped = mapApi(json.data ?? []);

        setTotal(json.total ?? 0);
        setPage(json.page ?? nextPage);

        if (mode === "append") {
          setPhotos((prev) => [...prev, ...mapped]);
        } else {
          setPhotos(mapped);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Unable to load photos.");
      } finally {
        setLoading(false);
        setFetchingMore(false);
        setRefreshing(false);
      }
    },
    [buildQuery, token]
  );

  // initial load
  useEffect(() => {
    (async () => {
      const t = await loadToken();
      if (!t) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }
      await fetchPage(1, "replace");
      // Check purchased photos on load
      checkIfPhotoPurchased();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search/filter
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const id = setTimeout(() => fetchPage(1, "replace"), 350);
    return () => clearTimeout(id);
  }, [searchText, typeFilter, token, fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSelected([]);
    await fetchPage(1, "refresh");
    // Refresh purchased photos status
    checkIfPhotoPurchased();
  }, [fetchPage, checkIfPhotoPurchased]);

  const loadMore = useCallback(async () => {
    if (loading || fetchingMore || !hasMore) return;
    await fetchPage(page + 1, "append");
  }, [fetchPage, page, hasMore, loading, fetchingMore]);

  const toggleSelect = useCallback((id: string) => {
    // Don't allow selection of purchased photos
    if (purchasedPhotos.has(id)) {
      Alert.alert(
        "Photo Already Purchased",
        "This photo has already been purchased and cannot be selected again.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, [purchasedPhotos]);

  const addSelectedToCart = useCallback(() => {
    if (selected.length === 0) return;
    
    // Filter out already purchased photos
    const availablePhotos = photos.filter(photo => 
      selected.includes(photo.id) && !purchasedPhotos.has(photo.id)
    );
    
    if (availablePhotos.length === 0) {
      Alert.alert(
        "No Photos Available",
        "All selected photos have already been purchased.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    
    availablePhotos.forEach(photo => {
      // Create a cart item from the photo
      const cartItem = {
        id: `photo_${photo.id}`,
        name: `${photo.type.replace("_", " ")} Photo`,
        price: photo.price,
        image: photo.uri,
        description: `${photo.type.replace("_", " ")} photo from ${photo.date} featuring ${photo.students.join(", ")}`,
        type: 'photo' as const,
        photoId: photo.id,
        photoUri: photo.uri,
      };
      
      addToCart(cartItem);
    });
    
    const purchasedCount = selected.length - availablePhotos.length;
    let message = `${availablePhotos.length} photo(s) have been added to your cart.`;
    
    if (purchasedCount > 0) {
      message += `\n\n${purchasedCount} photo(s) were already purchased and cannot be added again.`;
    }
    
    Alert.alert(
      "Photos Added to Cart",
      message,
      [
        { text: "Continue Shopping", style: "cancel" },
        { 
          text: "View Cart", 
          onPress: () => router.push("/cart")
        }
      ]
    );
    
    setSelected([]);
  }, [selected, photos, addToCart, router, purchasedPhotos]);

  const goCheckout = useCallback(() => {
    if (selected.length === 0) return;
    router.push({
      pathname: "/checkout",
      params: { selectedImages: JSON.stringify(selected) },
    });
  }, [router, selected]);

  const handleDownloadPhoto = useCallback(async (imageUrl: string, fileName: string) => {
    try {
      if (Platform.OS === 'web') {
        // For web, create a download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${fileName}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Download Started', 'Photo download has been initiated.');
      } else {
        // For mobile, automatically download to device
        try {
          // Request permission to access media library
          const { status } = await MediaLibrary.requestPermissionsAsync();
          
          if (status !== 'granted') {
            Alert.alert(
              'Permission Required',
              'Please grant permission to save photos to your device.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: () => Linking.openURL('app-settings:') }
              ]
            );
            return;
          }

                     // Download the image to device storage
           const downloadResumable = FileSystem.createDownloadResumable(
             imageUrl,
             FileSystem.documentDirectory + `photo_${Date.now()}.jpg`,
             {},
             (downloadProgress) => {
               const progressPercent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
               console.log(`Download progress: ${progressPercent}%`);
             }
           );

          const result = await downloadResumable.downloadAsync();
          
          if (result && result.uri) {
            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(result.uri);
            await MediaLibrary.createAlbumAsync('Roz and Kirsty Photos', asset, false);
            
            Alert.alert('Photo Downloaded!', 'Photo has been saved to your device gallery.');
            
            // Clean up temporary file
            await FileSystem.deleteAsync(result.uri);
          }
        } catch (downloadError) {
          console.error('Download error:', downloadError);
          // Fallback to browser if download fails
          Alert.alert(
            'Download Failed',
            'Unable to download directly. Opening in browser instead.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open in Browser', 
                onPress: () => Linking.openURL(imageUrl)
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download the photo. Please try again.');
    }
  }, []);

  const header = useMemo(
    () => (
      <>
        {/* Branding */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoMain}>Roz and Kirsty</Text>
          <Text style={styles.logoSub}>Photography</Text>
        </View>

        {/* Titles */}
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Gallery</Text>
          <Text style={styles.description}>
            Browse and purchase your favourite memories from past school events.
          </Text>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search by event or student name…"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchBar}
          placeholderTextColor="#888"
          returnKeyType="search"
        />

        {/* Photo type filter buttons */}
        <View style={styles.filterButtonsContainer}>
          {PHOTO_TYPES.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setTypeFilter(opt)}
              style={[
                styles.filterButton,
                typeFilter === opt && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                typeFilter === opt && styles.filterButtonTextActive
              ]}>
                {opt === "All" ? "All" : opt.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add to Cart / Checkout */}
        <View style={styles.singleButtonRow}>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              selected.length > 0 ? styles.downloadButtonEnabled : styles.downloadButtonDisabled,
            ]}
            disabled={selected.length === 0}
            onPress={addSelectedToCart}
          >
            <Text style={styles.downloadButtonText}>Add to Cart (£{PHOTO_PRICE.toFixed(2)} each)</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Button */}
        <View style={styles.cartButtonContainer}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/cart")}
          >
            <Ionicons name="cart" size={24} color={PeachyColors.primary} />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Error / Empty states above the list */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </>
    ),
         [ error, addSelectedToCart, searchText, selected.length, typeFilter, getTotalItems]
  );

  const renderItem = useCallback(
    ({ item }: { item: Photo }) => {
      const isSelected = selected.includes(item.id);
      const isInCartItem = isInCart(`photo_${item.id}`);
      const isPurchased = purchasedPhotos.has(item.id);
      
      // Debug log
      if (isPurchased) {
        console.log(`Photo ${item.id} is purchased`);
      }
      
      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewUri(item.uri)}>
          <View style={[styles.imageCard, isSelected && styles.imageCardSelected]}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            
            {/* Checkbox - only show if not purchased */}
            {!isPurchased && (
              <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelect(item.id)}>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isSelected ? PeachyColors.primary : "#888"}
                />
              </TouchableOpacity>
            )}
            
            {/* Price badge or Purchased indicator */}
            {isPurchased ? (
              <View style={styles.purchasedIndicator}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.purchasedText}>Purchased</Text>
              </View>
            ) : (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>£{item.price.toFixed(2)}</Text>
              </View>
            )}
            
            {/* Cart indicator - only show if in cart but not purchased */}
            {isInCartItem && !isPurchased && (
              <View style={styles.cartIndicator}>
                <Ionicons name="checkmark-circle" size={16} color={PeachyColors.primary} />
                <TouchableOpacity
                  style={styles.downloadIcon}
                  onPress={() => handleDownloadPhoto(item.uri, `${item.type}_${item.date}`)}
                >
                  <Ionicons name="cloud-download" size={16} color={PeachyColors.primary} />
                </TouchableOpacity>
              </View>
            )}
            
                         <Text style={styles.infoText}>{item.date}</Text>
             <Text style={styles.infoTextSmall}>
               {item.type.replace("_", " ")} • {item.students.join(", ")}
             </Text>
             
                           {/* Download button for purchased photos */}
              {isPurchased && (
                <TouchableOpacity
                  style={styles.photoDownloadButton}
                  onPress={() => handleDownloadPhoto(item.uri, `${item.type}_${item.date}`)}
                >
                  <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
                  <Text style={styles.photoDownloadButtonText}>Download</Text>
                </TouchableOpacity>
              )}
          </View>
        </TouchableOpacity>
      );
    },
    [selected, toggleSelect, isInCart, purchasedPhotos]
  );

  const listEmpty = useMemo(
    () =>
      !loading && !error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No photos yet.</Text>
        </View>
      ) : null,
    [loading, error]
  );

  return (
    <View style={[styles.container, { paddingTop: 40 }]}>
      {loading && photos.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PeachyColors.primary} />
          <Text style={{ marginTop: 8 }}>Loading photos…</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={listEmpty}
          columnWrapperStyle={{ justifyContent: "space-between", gap: 20, paddingHorizontal: 16 }}
          contentContainerStyle={styles.galleryContainer}
          onEndReachedThreshold={0.2}
          onEndReached={loadMore}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            fetchingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={PeachyColors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* Modal Preview */}
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} /> : null}
            <TouchableOpacity onPress={() => setPreviewUri(null)} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f9f9f9" 
  },

  logoContainer: { 
    position: "absolute", 
    top: 18, 
    left: 18, 
    zIndex: 999 
  },

  logoMain: {
    fontSize: 28,
    fontFamily: "SixCaps-Regular",
    letterSpacing: 1.5,
    color: "#222",
    textTransform: "uppercase",
  },

  logoSub: {
    fontSize: 10,
    fontFamily: "Sansation-Light",
    fontWeight: "300",
    color: "#888",
    letterSpacing: 0.8,
    marginTop: -6,
    textTransform: "uppercase",
    textAlign: "right",
  },

  headerContainer: {
    justifyContent: "flex-start",
    paddingTop: 60,
    marginTop: 20,
    alignItems: "center",
    paddingHorizontal: 16,
  },

  heading: { 
    fontSize: 26, 
    fontFamily: "Poppins",
    fontWeight: "600", 
    color: "#11181C", 
    marginBottom: 8, 
    textAlign: "center" 
  },

  description: { 
    color: "#555", 
    fontSize: 14, 
    textAlign: "center", 
    marginBottom: 8 
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },

  formSection: {
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 999999,
    backgroundColor: "#f9f9f9",
  },

  searchBar: {
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: "100%",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  filterButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  filterButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  filterButtonActive: {
    backgroundColor: PeachyColors.primary,
    borderColor: PeachyColors.primary,
  },

  filterButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
    textAlign: "center",
  },

  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },



  singleButtonRow: { 
    marginTop: 8, 
    marginBottom: 16, 
  },

  downloadButton: {
    padding: 16,
    borderRadius: 10,
    minHeight: 50,
    marginHorizontal: 16,
  },

  downloadButtonEnabled: {
    backgroundColor: PeachyColors.primary,
  },

  downloadButtonDisabled: {
    backgroundColor: "#ccc",
  },

  downloadButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },

  galleryContainer: {
    paddingBottom: 24,
    zIndex: 0,
  },

  imageCard: {
    width: (screenWidth - 32 - 20) / 2,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    height: 220, // Fixed height for all cards
  },

  imageCardSelected: { 
    borderWidth: 2, 
    borderColor: PeachyColors.primary, 
  },

  image: { 
    width: "100%", 
    height: 120, 
    borderRadius: 8, 
    marginBottom: 8, 
    resizeMode: "cover", 
    backgroundColor: "#eee",
    flex: 0, // Don't grow
  },

  checkbox: { 
    position: "absolute", 
    top: 10, 
    right: 10, 
    zIndex: 3 
  },

  infoText: { 
    fontSize: 13, 
    color: "#444", 
    textAlign: "center",
    flex: 1, // Take available space
  },

  infoTextSmall: { 
    fontSize: 11, 
    color: "#666", 
    textAlign: "center", 
    marginTop: 2,
    flex: 1, // Take available space
  },

  loadingWrap: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },

  emptyWrap: { 
    paddingVertical: 40, 
    alignItems: "center" 
  },

  emptyText: { 
    color: "#666", 
  },

  errorText: { 
    color: "red", 
    textAlign: "center", 
    marginHorizontal: 16, 
    marginBottom: 6 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.7)", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },

  modalContent: { 
    position: "relative", 
    backgroundColor: "#eee", 
    borderRadius: 8, 
    padding: 12, 
    alignItems: "center" 
  },

  previewImage: { 
    width: 320, 
    height: 440, 
    borderRadius: 8, 
    resizeMode: "contain", 
    backgroundColor: "#fff" 
  },

  closeButton: { 
    position: "absolute", 
    top: 8, 
    right: 8, 
    backgroundColor: PeachyColors.primary, 
    borderRadius: 20, 
    padding: 4 
  },

  priceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: PeachyColors.primary,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  priceText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  cartIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 4,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  purchasedIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E8F5E8",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  purchasedText: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },

  photoDownloadButton: {
    backgroundColor: PeachyColors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'center',
    flex: 0, // Don't grow
  },

  photoDownloadButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },


  downloadIcon: {
    backgroundColor: PeachyColors.light,
    borderRadius: 8,
    padding: 2,
  },

  cartButtonContainer: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
  },

  cartButton: {
    position: "relative",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  cartBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: PeachyColors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
