import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Product = {
  id: string;
  name: string;
  price: number;
  image: number | string; // Can be require() for physical products or URI for photos
  description: string;
  type: 'product' | 'photo';
  photoId?: string; // For photos
  photoUri?: string; // For photos
  selectedPhotoId?: string; // For physical products - ID of selected photo from gallery
  selectedPhotoUri?: string; // For physical products - URI of selected photo from gallery
};

export type CartItem = Product & {
  quantity: number;
};

interface CartContextType {
  cartItems: CartItem[];
  orderNumber: string;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateProductPhoto: (productId: string, photoId: string, photoUri: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: string) => boolean;
  getCartSummary: () => { products: number; photos: number; totalPrice: number };
  generateOrderNumber: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = '@cart_items';
const ORDER_NUMBER_KEY = '@order_number';

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');

  // Load cart from storage on app start
  useEffect(() => {
    loadCartFromStorage();
    loadOrderNumberFromStorage();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCartToStorage();
  }, [cartItems]);

  // Save order number to storage whenever it changes
  useEffect(() => {
    saveOrderNumberToStorage();
  }, [orderNumber]);

  const loadCartFromStorage = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  };

  const loadOrderNumberFromStorage = async () => {
    try {
      const storedOrderNumber = await AsyncStorage.getItem(ORDER_NUMBER_KEY);
      if (storedOrderNumber) {
        setOrderNumber(storedOrderNumber);
      }
    } catch (error) {
      console.error('Error loading order number from storage:', error);
    }
  };

  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const saveOrderNumberToStorage = async () => {
    try {
      await AsyncStorage.setItem(ORDER_NUMBER_KEY, orderNumber);
    } catch (error) {
      console.error('Error saving order number to storage:', error);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const newOrderNumber = `RK-${timestamp}-${random}`;
    setOrderNumber(newOrderNumber);
    return newOrderNumber;
  };

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    console.log('removeFromCart called with productId:', productId);
    console.log('Current cartItems before removal:', cartItems);
    
    setCartItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId);
      console.log('New cartItems after removal:', newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateProductPhoto = (productId: string, photoId: string, photoUri: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, selectedPhotoId: photoId, selectedPhotoUri: photoUri } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.id === productId);
  };

  const getCartSummary = () => {
    const products = cartItems.filter(item => item.type === 'product').reduce((total, item) => total + item.quantity, 0);
    const photos = cartItems.filter(item => item.type === 'photo').reduce((total, item) => total + item.quantity, 0);
    const totalPrice = getTotalPrice();
    
    return { products, photos, totalPrice };
  };

  const value: CartContextType = {
    cartItems,
    orderNumber,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateProductPhoto,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
    getCartSummary,
    generateOrderNumber,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
