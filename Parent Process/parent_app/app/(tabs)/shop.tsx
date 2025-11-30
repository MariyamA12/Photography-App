import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PeachyColors } from "../../constants/Colors";
import { useCart, Product } from "../../contexts/CartContext";
import PhotoSelectionModal from "../../components/PhotoSelectionModal";

const productImages = {
  keychain: require("../../assets/images/shop/keychains.jpg"),
  frame: require("../../assets/images/shop/photoframe.jpg"),
  pillow: require("../../assets/images/shop/pillow.webp"),
  blanket: require("../../assets/images/shop/blanket.webp"),
  canvas: require("../../assets/images/shop/canvas.webp"),
  memoryBook: require("../../assets/images/shop/memory_book.jpg"),
};

const products = [
  {
    id: "1",
    name: "Custom Photo Keychain",
    price: 9.99,
    image: productImages.keychain,
    description: "Personalized keychain with your favorite photo",
    type: 'product' as const,
  },
  {
    id: "2",
    name: "Family Photo Frame",
    price: 19.99,
    image: productImages.frame,
    description: "Beautiful wooden frame for your precious memories",
    type: 'product' as const,
  },
  {
    id: "3",
    name: "Custom Photo Pillow",
    price: 24.99,
    image: productImages.pillow,
    description: "Soft pillow with your cherished photos printed",
    type: 'product' as const,
  },
  {
    id: "4",
    name: "Personalized Blanket",
    price: 34.99,
    image: productImages.blanket,
    description: "Cozy fleece blanket with custom photo design",
    type: 'product' as const,
  },
  {
    id: "5",
    name: "Photo Canvas",
    price: 39.99,
    image: productImages.canvas,
    description: "High-quality canvas print of your memories",
    type: 'product' as const,
  },
  {
    id: "6",
    name: "Memory Book",
    price: 29.99,
    image: productImages.memoryBook,
    description: "Custom photo album with your special moments",
    type: 'product' as const,
  },
];

export default function Shop() {
  const router = useRouter();
  const { cartItems, addToCart, getTotalItems } = useCart();
  const [isPhotoSelectionModalVisible, setIsPhotoSelectionModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddToCart = (product: Product) => {
    if (product.type === 'product') {
      // For physical items, show photo selection modal
      setSelectedProduct(product);
      setIsPhotoSelectionModalVisible(true);
    } else {
      // For photos, add directly to cart
      addToCart(product);
      Alert.alert("Success", "Item added to cart!");
    }
  };

  const handlePhotoSelect = (photoId: string, photoUri: string) => {
    if (selectedProduct) {
      // Add the physical item with the selected photo
      const productWithPhoto = {
        ...selectedProduct,
        selectedPhotoId: photoId,
        selectedPhotoUri: photoUri,
      };
      addToCart(productWithPhoto);
      Alert.alert("Success", `${selectedProduct.name} with selected photo added to cart!`);
      setSelectedProduct(null);
    }
  };

  const handleClosePhotoModal = () => {
    setIsPhotoSelectionModalVisible(false);
    setSelectedProduct(null);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image 
        source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <View style={styles.productTextGroup}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription}>{item.description}</Text>
        </View>
        <View style={styles.productBottomSection}>
          <Text style={styles.productPrice}>£{item.price.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const header = useMemo(() => (
    <>
      <View style={styles.logoContainer}>
        <Text style={styles.logoMain}>Roz and Kirsty</Text>
        <Text style={styles.logoSub}>Photography</Text>
      </View>
      <View style={styles.cartButtonContainer}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <Ionicons name="cart" size={24} color={PeachyColors.primary} />
          {getTotalItems() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getTotalItems()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Memory Shop</Text>
        <Text style={styles.headerSubtext}>Physical items and digital photos</Text>
      </View>
    </>
  ), [getTotalItems, router]);

  return (
    <View style={[styles.container, { paddingTop: 40 }]}> 
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={header}
        contentContainerStyle={{ ...styles.productList, paddingBottom: 24, zIndex: 1 }}
      />
      <PhotoSelectionModal
        visible={isPhotoSelectionModalVisible}
        onClose={handleClosePhotoModal}
        onPhotoSelect={handlePhotoSelect}
        productName={selectedProduct?.name || ""}
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
    top: 12,
    left: 12,
    zIndex: 999,
  },
  cartButtonContainer: {
    position: "absolute",
    top: 12,
    right: 12,
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
  headerText: {
    fontSize: 26,
    fontFamily: "Poppins",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#11181C",
  },
  headerSubtext: {
    fontSize: 14,
    fontFamily: "Sansation-Light",
    color: "#666",
    textAlign: "center",
    marginTop: -5,
  },
  productList: {
    padding: 5,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 5,
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 280,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 10,
    flex: 1,
    justifyContent: "space-between",
  },
  productTextGroup: {
    flex: 1,
  },
  productBottomSection: {
    marginTop: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: PeachyColors.primary,
    marginBottom: 8,
    textAlign: "left",
  },
  addToCartButton: {
    backgroundColor: PeachyColors.primary,
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  addToCartText: {
    color: "white",
    fontWeight: "bold",
  },
  formSection: {
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    justifyContent: "flex-start",
    paddingTop: 60,
    marginTop: 20,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  badge: {
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
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
