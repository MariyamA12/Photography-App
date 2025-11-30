import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PeachyColors } from "../constants/Colors";
import { useCart } from "../contexts/CartContext";
import PhotoSelectionModal from "../components/PhotoSelectionModal";

export default function Cart() {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getCartSummary, updateProductPhoto, orderNumber, generateOrderNumber } = useCart();
  const [isPhotoSelectionModalVisible, setIsPhotoSelectionModalVisible] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);

  // Generate order number when component mounts if not exists
  useEffect(() => {
    if (!orderNumber) {
      generateOrderNumber();
    }
  }, [orderNumber, generateOrderNumber]);

  const handleRemoveItem = (productId: string) => {
    console.log('handleRemoveItem called with productId:', productId);
    
    // Temporary: direct removal without Alert for testing
    console.log('Directly calling removeFromCart...');
    removeFromCart(productId);
    
    // Commented out Alert for now
    /*
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
            console.log('Remove button pressed, calling removeFromCart with productId:', productId);
            removeFromCart(productId);
          }
        },
      ]
    );
    */
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleChangePhoto = (item: any) => {
    setSelectedCartItem(item);
    setIsPhotoSelectionModalVisible(true);
  };

  const handlePhotoSelect = (photoId: string, photoUri: string) => {
    if (selectedCartItem) {
      updateProductPhoto(selectedCartItem.id, photoId, photoUri);
      setIsPhotoSelectionModalVisible(false);
      setSelectedCartItem(null);
    }
  };

  const handleClosePhotoModal = () => {
    setIsPhotoSelectionModalVisible(false);
    setSelectedCartItem(null);
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const isPhoto = item.type === 'photo';
    const hasSelectedPhoto = item.selectedPhotoUri;
    
    return (
      <View style={styles.cartItem}>
        <Image 
          source={isPhoto ? { uri: item.image } : (hasSelectedPhoto ? { uri: item.selectedPhotoUri } : item.image)} 
          style={styles.itemImage} 
        />
        
        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            {isPhoto && (
              <View style={styles.photoTypeBadge}>
                <Text style={styles.photoTypeText}>Digital Photo</Text>
              </View>
            )}
            {!isPhoto && hasSelectedPhoto && (
              <View style={styles.photoTypeBadge}>
                <Text style={styles.photoTypeText}>Custom Photo</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.itemDescription} numberOfLines={3}>{item.description}</Text>
          
          {/* Show selected photo info for physical items */}
          {!isPhoto && hasSelectedPhoto && (
            <View style={styles.selectedPhotoInfo}>
              <View style={styles.photoStatusContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.selectedPhotoText}>Photo selected</Text>
              </View>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => handleChangePhoto(item)}
              >
                <Text style={styles.changePhotoButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Show change photo button for physical items without photo */}
          {!isPhoto && !hasSelectedPhoto && (
            <View style={styles.selectedPhotoInfo}>
              <View style={styles.photoStatusContainer}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Text style={styles.noPhotoText}>No photo selected</Text>
              </View>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => handleChangePhoto(item)}
              >
                <Text style={styles.changePhotoButtonText}>Select Photo</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.priceAndActionsRow}>
            <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
            
            <View style={styles.itemActions}>
              {!isPhoto && (
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={PeachyColors.primary} />
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={PeachyColors.primary} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalText}>
            £{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Ionicons name="cart-outline" size={80} color={PeachyColors.primary} />
      <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
      <Text style={styles.emptyCartSubtitle}>
        Add some beautiful memories to your cart from our shop or gallery
      </Text>
      <View style={styles.emptyCartButtons}>
        <TouchableOpacity
          style={styles.shopNowButton}
          onPress={() => router.push("/(tabs)/shop")}
        >
          <Text style={styles.shopNowButtonText}>Shop Physical Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shopNowButton, styles.galleryButton]}
          onPress={() => router.push("/(tabs)/gallery")}
        >
          <Text style={styles.shopNowButtonText}>Browse Digital Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
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
              <Text style={styles.header}>Shopping Cart</Text>
            </View>
            {renderEmptyCart()}
          </>
        }
        contentContainerStyle={{ paddingTop: 40, flexGrow: 1 }}
        style={{ flex: 1, backgroundColor: "#f9f9f9" }}
      />
    );
  }

  const cartSummary = getCartSummary();

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, backgroundColor: "#f9f9f9" }}
        contentContainerStyle={{ paddingTop: 40, paddingHorizontal: 16, paddingBottom: 20 }}
        ListHeaderComponent={
          <>
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
              <Text style={styles.header}>Shopping Cart</Text>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.totalContainer}>
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
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.checkoutInfo}>
              <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
              <Text style={styles.checkoutInfoText}>Secure checkout with Stripe</Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      
      <PhotoSelectionModal
        visible={isPhotoSelectionModalVisible}
        onClose={handleClosePhotoModal}
        onPhotoSelect={handlePhotoSelect}
        productName={selectedCartItem?.name || ""}
      />
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
    top: 18,
    left: 18,
    zIndex: 10,
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
    top: 80,
    left: 20,
    zIndex: 20,
    padding: 8,
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
    marginTop: 20,
    marginBottom: 24,
  },
  header: {
    fontSize: 26,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    textAlign: "center",
    flex: 1,
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cartItem: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'flex-start',
    minHeight: 90,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    flex: 1,
  },
  photoTypeBadge: {
    backgroundColor: PeachyColors.light,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  photoTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: PeachyColors.primary,
  },
  itemDescription: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
    lineHeight: 18,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: PeachyColors.primary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 10,
    minWidth: 18,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemTotal: {
    alignItems: "flex-end",
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 160,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#11181C",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyCartButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginTop: 20,
  },
  shopNowButton: {
    backgroundColor: PeachyColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 160,
    alignItems: 'center',
    marginBottom: 12,
  },
  shopNowButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  galleryButton: {
    backgroundColor: PeachyColors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 0,
  },
  cartSummaryBanner: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  totalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
  },
  totalDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 16,
  },
  checkoutButton: {
    backgroundColor: PeachyColors.primary,
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  priceAndActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  selectedPhotoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  selectedPhotoText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 4,
  },
  changePhotoButton: {
    backgroundColor: PeachyColors.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  changePhotoButtonText: {
    fontSize: 12,
    color: PeachyColors.primary,
    fontWeight: "600",
  },
  noPhotoText: {
    fontSize: 13,
    color: "#FF9800",
    fontWeight: "600",
    marginLeft: 4,
  },
  checkoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: PeachyColors.light,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkoutInfoText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 8,
  },
});
