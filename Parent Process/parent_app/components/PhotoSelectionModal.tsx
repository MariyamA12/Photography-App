import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PeachyColors } from '../constants/Colors';

type PhotoType = "individual" | "with_sibling" | "with_friend" | "group";

type ApiPhoto = {
  id: number;
  file_name: string;
  file_url: string;
  photo_type: PhotoType;
  added_at: string;
  student_names: string[];
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
};

interface PhotoSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoSelect: (photoId: string, photoUri: string) => void;
  productName: string;
}

const PAGE_SIZE = 20;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:5000";

export default function PhotoSelectionModal({
  visible,
  onClose,
  onPhotoSelect,
  productName,
}: PhotoSelectionModalProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | PhotoType>("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);

  const PHOTO_TYPES: Array<"All" | PhotoType> = ["All", "individual", "with_sibling", "with_friend", "group"];

  const loadToken = useCallback(async () => {
    const t = await AsyncStorage.getItem("accessToken");
    setToken(t);
    return t;
  }, []);

  const buildQuery = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(PAGE_SIZE));
      if (searchText.trim()) {
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
    }));

  const fetchPage = useCallback(
    async (nextPage: number, mode: "refresh" | "append" | "replace" = "replace") => {
      if (!token) return;

      try {
        if (mode === "append") setFetchingMore(true);
        if (mode === "refresh" || mode === "replace") setLoading(true);

        const res = await fetch(buildQuery(nextPage), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
        console.error('Error fetching photos:', e);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [buildQuery, token]
  );

  useEffect(() => {
    if (visible) {
      (async () => {
        const t = await loadToken();
        if (t) {
          await fetchPage(1, "replace");
        }
      })();
    }
  }, [visible, loadToken, fetchPage]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const id = setTimeout(() => fetchPage(1, "replace"), 350);
    return () => clearTimeout(id);
  }, [searchText, typeFilter, token, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || fetchingMore || photos.length >= total) return;
    await fetchPage(page + 1, "append");
  }, [fetchPage, page, total, loading, fetchingMore, photos.length]);

  const handlePhotoSelect = (photo: Photo) => {
    onPhotoSelect(photo.id, photo.uri);
    onClose();
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => handlePhotoSelect(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoDate}>{item.date}</Text>
        <Text style={styles.photoType}>{item.type.replace("_", " ")}</Text>
        <Text style={styles.photoStudents}>{item.students.join(", ")}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Photo for {productName}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search by event or student name..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchBar}
          placeholderTextColor="#888"
        />

        {/* Filter */}
        <View style={styles.filterContainer}>
          <Pressable
            onPress={() => setDropdownOpen(!dropdownOpen)}
            style={styles.filterButton}
          >
            <Text style={styles.filterButtonText}>
              {typeFilter === "All" ? "All photo types" : typeFilter.replace("_", " ")}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </Pressable>

          {dropdownOpen && (
            <View style={styles.dropdownOptions}>
              {PHOTO_TYPES.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setTypeFilter(opt);
                    setDropdownOpen(false);
                  }}
                  style={styles.dropdownOption}
                >
                  <Text style={styles.dropdownOptionText}>
                    {opt === "All" ? "All photo types" : opt.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Photos List */}
        {loading && photos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PeachyColors.primary} />
            <Text style={styles.loadingText}>Loading photos...</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.photoRow}
            contentContainerStyle={styles.photoList}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              fetchingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator color={PeachyColors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  searchBar: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#eee",
  },
  filterButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownOptions: {
    backgroundColor: "#fff",
    marginTop: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },
  photoList: {
    padding: 20,
  },
  photoRow: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  photoCard: {
    width: (Dimensions.get('window').width - 60) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  photoInfo: {
    alignItems: "center",
  },
  photoDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  photoType: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  photoStudents: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
