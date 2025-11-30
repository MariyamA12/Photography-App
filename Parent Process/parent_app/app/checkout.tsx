import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Linking, ActivityIndicator, Platform } from "react-native";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PeachyColors } from "../constants/Colors";
import { useCart, CartItem } from "../contexts/CartContext";
import { useStripe } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 

const API_URL = `http://${process.env.EXPO_PUBLIC_IPCONFIG}`;

// Dummy data for saved addresses
const savedAddresses = [
  { id: 1, name: "Home", address: "123 Main St, Cardiff, CF10 1AA" },
  { id: 2, name: "Work", address: "456 Business Ave, Cardiff, CF10 2BB" },
];

export default function Checkout() {
  const router = useRouter();
  const { cartItems, getTotalPrice, clearCart, getCartSummary} = useCart();
  const [selectedAddress, setSelectedAddress] = useState(savedAddresses[0]);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [photosToDownload, setPhotosToDownload] = useState<CartItem[]>([]);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();


  const fetchPaymentSheetParams = async (amount: number) => {
    try {
      // Get user info stored in AsyncStorage
      const userDataString = await AsyncStorage.getItem("userData");
      if (!userDataString) {
        Alert.alert("Error", "User not logged in.");
        return null;
      }

      const userData = JSON.parse(userDataString);
      const userId = userData.id;
      const userName = userData.name;
      const userEmail = userData.email;

      const res = await fetch(`${API_URL}/api/parent/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ 
          amount,         
          userId, 
          userName, 
          userEmail,
          orderNumber,
          purchasedItems: cartItems.map(item => ({ 
            id: item.id, 
            name: item.name,     
            image: item.image,
            type: item.type, 
            quantity: item.quantity || 1,
            price: item.price 
        }))
        }),
      });

      if (!res.ok) throw new Error("Failed to create payment intent");

      const data = await res.json();
      setOrderNumber(data.orderId); //set the order number for the front end
      return {
        paymentIntent: data.paymentIntent,
        ephemeralKey: data.ephemeralKey,
        customer: data.customer,
      };
    } catch (err) {
      console.error("Error fetching payment params:", err);
      Alert.alert("Error", "Unable to start payment.");
      return null;
    }
  };

  const handlePayment = async() => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before proceeding to checkout.");
      return;
    }

    // covert the price
    const totalAmountInCents = Math.round(getTotalPrice() * 1.2 * 100);
    setLoading(true);

    const params = await fetchPaymentSheetParams(totalAmountInCents);
    if (!params) {
      setLoading(false);
      return;
    }

    const { paymentIntent, ephemeralKey, customer } = params;

    const { error: initError } = await initPaymentSheet({
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      merchantDisplayName: "Roz and Kirsty",
      allowsDelayedPaymentMethods: true,
      googlePay: {
        merchantCountryCode: "GB",
        testEnv: true,
      },
      applePay: {
        merchantCountryCode: "GB",
      },
      style: "automatic",
    });

    if (initError) {
      Alert.alert("Error", initError.message);
      setLoading(false);
      return;
    }

    const { error: paymentError } = await presentPaymentSheet();

    if (paymentError) {
      Alert.alert(`Payment Failed`, paymentError.message);
    } else {
      // Save photos to download before clearing cart
      const photos = cartItems.filter(item => item.type === 'photo');
      setPhotosToDownload(photos);
      setPaymentSuccess(true);
      setTotalPaid(getTotalPrice() * 1.2);
      clearCart();
    }

    setLoading(false);
  };

  const handleContinueToGallery = () => {
    router.push("/(tabs)/gallery");
  };

  const handleDownloadPhoto = async (imageUrl: string, fileName: string) => {
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
            FileSystem.documentDirectory + `${fileName}_${Date.now()}.jpg`,
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
  };

  const cartSummary = getCartSummary();

  // Show success screen after payment
  if (paymentSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Thank you for your order</Text>
          
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderNumberLabel}>Order Number:</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderTotalLabel}>Total Paid:</Text>
              <Text style={styles.orderTotal}>£{totalPaid.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.successMessage}>
            <Ionicons name="information-circle" size={20} color={PeachyColors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.successMessageText}>
              Your digital photos are now available for download in the gallery.
              {cartSummary.products > 0 && ` Physical items will be shipped to your selected address.`}
            </Text>
          </View>

          {/* Download Photos Section */}
          {photosToDownload.length > 0 && (
            <View style={styles.downloadSection}>
              <Text style={styles.downloadSectionTitle}>Download Your Photos</Text>
              <Text style={styles.downloadSectionSubtitle}>
                Tap the download button next to each photo to save it to your device
              </Text>
              {photosToDownload.map((photo, index) => (
                <View key={index} style={styles.downloadPhotoItem}>
                  <Image 
                    source={{ uri: photo.image as string }} 
                    style={styles.downloadPhotoThumbnail} 
                  />
                  <View style={styles.downloadPhotoInfo}>
                    <Text style={styles.downloadPhotoName}>{photo.name}</Text>
                    <Text style={styles.downloadPhotoDescription}>{photo.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadPhotoButton}
                    onPress={() => handleDownloadPhoto(photo.image as string, photo.name)}
                  >
                    <Ionicons name="cloud-download" size={20} color="white" />
                    <Text style={styles.downloadPhotoButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinueToGallery}
          >
            <Text style={styles.continueButtonText}>Continue to Gallery</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoMain}>Roz and Kirsty</Text>
        <Text style={styles.logoSub}>Photography</Text>
      </View>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={PeachyColors.primary} />
      </TouchableOpacity>
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >


        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {/* Cart Summary Banner */}
          <View style={styles.cartSummaryBanner}>
            <Text style={styles.summaryText}>
              {cartSummary.products > 0 && `${cartSummary.products} physical item(s)`}
              {cartSummary.products > 0 && cartSummary.photos > 0 && ' • '}
              {cartSummary.photos > 0 && `${cartSummary.photos} digital photo(s)`}
            </Text>
          </View>
          
          {cartItems.map((item) => {
            const isPhoto = item.type === 'photo';
            return (
              <View key={item.id} style={styles.orderItem}>
                <Image 
                  source={isPhoto ? { uri: item.image as string } : item.image as any} 
                  style={styles.orderItemImage} 
                />
                <View style={styles.orderItemDetails}>
                  <View style={styles.orderItemHeader}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    {isPhoto && (
                      <View style={styles.photoTypeBadge}>
                        <Text style={styles.photoTypeText}>Digital</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.orderItemDescription}>{item.description}</Text>
                  {!isPhoto && <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>}
                  <Text style={styles.orderItemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              </View>
            );
          })}
          
          <View style={styles.orderTotal}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalAmount}>£{getTotalPrice().toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (20%):</Text>
              <Text style={styles.totalAmount}>£{(getTotalPrice() * 0.2).toFixed(2)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>£{(getTotalPrice() * 1.2).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address Section - Only show for physical items */}
        {cartSummary.products > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {savedAddresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.card,
                  selectedAddress.id === addr.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedAddress(addr)}
              >
                <Text style={styles.cardTitle}>{addr.name}</Text>
                <Text>{addr.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Digital Delivery Notice for Photos */}
        {cartSummary.photos > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Digital Delivery</Text>
            <View style={styles.digitalDeliveryCard}>
              <Ionicons name="cloud-download" size={24} color={PeachyColors.primary} />
              <Text style={styles.digitalDeliveryText}>
                Digital photos will be available for download immediately after payment confirmation.
              </Text>
            </View>
          </View>
        )}

        {/* Payment Button */}
        <TouchableOpacity 
          style={[styles.paymentButton, loading && styles.paymentButtonDisabled]} 
          onPress={handlePayment} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.paymentButtonText}>Pay Now</Text>
              <Ionicons name="card-outline" size={20} color="white" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  logoContainer: {
    position: "absolute",
    top: 58,
    left: 32,
    zIndex: 999,
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
  backButton: {
    position: "absolute",
    top: 130,
    left: 20,
    zIndex: 20,
    padding: 8,
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 110,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#11181C",
  },
  card: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectedCard: {
    borderColor: PeachyColors.primary,
    backgroundColor: PeachyColors.light,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#11181C",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
    flex: 1,
    color: "#11181C",
  },
  photoTypeBadge: {
    backgroundColor: PeachyColors.light,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  photoTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: PeachyColors.primary,
  },
  orderItemDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: PeachyColors.primary,
  },
  orderTotal: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
  },
  totalDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 12,
  },
  cartSummaryBanner: {
    backgroundColor: PeachyColors.light,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
  },
  digitalDeliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: PeachyColors.light,
    borderRadius: 8,
    marginTop: 10,
  },
  digitalDeliveryText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  paymentButton: {
    backgroundColor: PeachyColors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  paymentButtonDisabled: {
    opacity: 0.7,
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  successIconContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: 40,
    padding: 15,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 5,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  orderInfoCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 5,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: "#666",
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  orderTotalLabel: {
    fontSize: 14,
    color: "#666",
  },
  orderTotalText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  successMessage: {
    backgroundColor: PeachyColors.light,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
  },
  successMessageText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: PeachyColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  orderNumberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderNumberIconContainer: {
    backgroundColor: PeachyColors.light,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  orderNumberInfo: {
    marginLeft: 10,
  },
  downloadSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
    textAlign: "center",
  },
  downloadSectionSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  downloadPhotoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 12,
  },
  downloadPhotoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  downloadPhotoInfo: {
    flex: 1,
    marginRight: 12,
  },
  downloadPhotoName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 4,
  },
  downloadPhotoDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  downloadPhotoButton: {
    backgroundColor: PeachyColors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadPhotoButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});
