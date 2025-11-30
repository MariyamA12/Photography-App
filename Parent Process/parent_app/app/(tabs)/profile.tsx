import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { PeachyColors } from "../../constants/Colors";
import { useLocalSearchParams } from "expo-router";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

interface Parent {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Child {
  id: number;
  name: string;
  class_name: string;
  school_name: string;
  relationship_type: string;
}



interface OrderItem {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  item_image?: string;
}

interface Order {
  order_id: string;
  date: string;
  total: number;
  items?: OrderItem[];
}

interface ProfileData {
  parent: Parent;
  children: Child[];
}


export default function Profile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showPastOrdersModal, setShowPastOrdersModal] = useState(false);
  const [showDownloadPhotosModal, setShowDownloadPhotosModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { refresh } = useLocalSearchParams();

  // Profile edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showToast = (
    type: "success" | "error" | "info",
    title: string,
    message: string
  ) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  useEffect(() => {
    fetchProfileData();
    fetchPastOrders();
  }, [refresh]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        setError("Authentication required. Please login first.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/parent/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditForm({
          name: data.parent.name,
          email: data.parent.email,
        });
      } else {
        if (response.status === 401) {
          setError("Authentication required. Please login again.");
          // Clear stored tokens on auth error
          await AsyncStorage.removeItem("accessToken");
          await AsyncStorage.removeItem("refreshToken");
          await AsyncStorage.removeItem("userData");
        } else {
          setError("Failed to load profile data");
        }
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPastOrders = async () => {
    setLoading(true);
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (!userDataString) {
        Alert.alert("Error", "User not logged in.");
        return;
      }

      const userData = JSON.parse(userDataString);
      const userId = Number(userData.id);

      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/parent/${userId}`);
      const data = await response.json();

      setPastOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching past orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all purchased photos from past orders
  const getPurchasedPhotos = () => {
    const purchasedPhotos: Array<{
      id: string;
      name: string;
      image: string;
      orderId: string;
      orderDate: string;
      price: number;
    }> = [];

    pastOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          // Only include items that have an image AND cost exactly £5 (digital photos)
          // Digital photos from gallery cost £5 each, physical items have different prices
          if (item.item_image && item.price === 5) {
            purchasedPhotos.push({
              id: item.item_id,
              name: item.item_name,
              image: item.item_image,
              orderId: order.order_id,
              orderDate: order.date,
              price: item.price
            });
          }
        });
      }
    });

    return purchasedPhotos;
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
        
        showToast('success', 'Download Started', 'Photo download has been initiated.');
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
            
            showToast('success', 'Photo Downloaded!', 'Photo has been saved to your device gallery.');
            
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
      showToast('error', 'Download Failed', 'Unable to download the photo. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true);
      const accessToken = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/parent/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", "Profile updated successfully");
        setIsEditing(false);
        fetchProfileData(); // Refresh data
      } else {
        showToast("error", "Error", data.error || "Failed to update profile");
      }
    } catch (error) {
      showToast("error", "Error", "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsSubmitting(true);
      const accessToken = await AsyncStorage.getItem("accessToken");

      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/parent/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordForm),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Close modal first, then show toast
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Show success toast
        showToast(
          "success",
          "Password Changed Successfully",
          "Your password has been updated. You can now use your new password to log in."
        );
      } else {
        showToast(
          "error",
          "Password Change Failed",
          data.error || "Failed to change password. Please try again."
        );
      }
    } catch (error) {
      showToast(
        "error",
        "Network Error",
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      await fetch(`http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      // Logout error handled silently
    } finally {
      // Clear stored data
      await AsyncStorage.multiRemove([
        "accessToken",
        "refreshToken",
        "userData",
      ]);
      setShowLogoutModal(false);
      router.replace("/login");
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(passwordForm.newPassword);


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PeachyColors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="account-remove"
          size={48}
          color="#e74c3c"
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="account-outline" size={64} color="#bbb" />
        <Text style={styles.emptyText}>No profile data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f9f9", paddingTop: 40 }}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoMain}>Roz and Kirsty</Text>
        <Text style={styles.logoSub}>Photography</Text>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.header}>Profile Settings</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setIsEditing(!isEditing)}
      >
        <Ionicons
          name={isEditing ? "close" : "create-outline"}
          size={24}
          color={PeachyColors.primary}
        />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>User Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, name: text })
                }
                placeholder="Enter your full name"
              />
            ) : (
              <Text style={styles.value}>{profileData.parent.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, email: text })
                }
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{profileData.parent.email}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Account Created</Text>
            <Text style={styles.value}>
              {new Date(profileData.parent.created_at).toLocaleDateString()}
            </Text>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: profileData.parent.name,
                    email: profileData.parent.email,
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleUpdateProfile}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Children Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Children</Text>
          {profileData.children.length > 0 ? (
            profileData.children.map((child, index) => (
              <View key={child.id} style={styles.childCard}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childDetails}>
                  Class: {child.class_name} • School: {child.school_name}
                </Text>
                <Text style={styles.relationshipType}>
                  {child.relationship_type.charAt(0).toUpperCase() +
                    child.relationship_type.slice(1)}{" "}
                  Parent
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noChildrenText}>
              No children linked to this account
            </Text>
          )}
        </View>
      </View>

      {/* Past Orders Section */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Orders</Text>
          
          <TouchableOpacity
            style={styles.pastOrdersButton}
            onPress={() => setShowPastOrdersModal(true)}
          >
            <View style={styles.pastOrdersButtonContent}>
              <Ionicons name="receipt-outline" size={24} color={PeachyColors.primary} />
              <Text style={styles.pastOrdersButtonText}>View Past Orders</Text>
              <Text style={styles.pastOrdersCount}>({pastOrders.length} orders)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PeachyColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Download Section */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          
          <TouchableOpacity 
            style={styles.downloadPhotosButton}
            onPress={() => setShowDownloadPhotosModal(true)}
          >
            <View style={styles.downloadPhotosButtonContent}>
              <Ionicons name="cloud-download-outline" size={24} color={PeachyColors.primary} />
              <Text style={styles.downloadPhotosButtonText}>Download Purchased Photos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PeachyColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Security Section */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Security</Text>

          <TouchableOpacity
            style={styles.securityButton}
            onPress={() => setIsChangingPassword(true)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={PeachyColors.primary} />
            <Text style={styles.securityButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={PeachyColors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.securityButton, styles.logoutButton]}
            onPress={() => setShowLogoutModal(true)}
          >
            <Ionicons name="log-out-outline" size={20} color={PeachyColors.primary} />
            <Text style={styles.logoutButtonText}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color={PeachyColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Change Modal */}
      <Modal
        visible={isChangingPassword}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <Ionicons name="close" size={24} color={PeachyColors.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, currentPassword: text })
              }
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, newPassword: text })
              }
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, confirmPassword: text })
              }
              secureTextEntry
            />

            {/* Password Strength Indicator */}
            {passwordForm.newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text style={styles.passwordStrengthTitle}>
                  Password Requirements:
                </Text>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={
                      passwordValidation.minLength
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={passwordValidation.minLength ? "#4CAF50" : "#F44336"}
                  />
                  <Text style={styles.requirementText}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={
                      passwordValidation.hasUpperCase
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={
                      passwordValidation.hasUpperCase ? "#4CAF50" : "#F44336"
                    }
                  />
                  <Text style={styles.requirementText}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={
                      passwordValidation.hasLowerCase
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={
                      passwordValidation.hasLowerCase ? "#4CAF50" : "#F44336"
                    }
                  />
                  <Text style={styles.requirementText}>
                    One lowercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={
                      passwordValidation.hasNumbers
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={
                      passwordValidation.hasNumbers ? "#4CAF50" : "#F44336"
                    }
                  />
                  <Text style={styles.requirementText}>One number</Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={
                      passwordValidation.hasSpecialChar
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={
                      passwordValidation.hasSpecialChar ? "#4CAF50" : "#F44336"
                    }
                  />
                  <Text style={styles.requirementText}>
                    One special character
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  (!passwordValidation.isValid ||
                    passwordForm.newPassword !==
                      passwordForm.confirmPassword) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={
                  !passwordValidation.isValid ||
                  passwordForm.newPassword !== passwordForm.confirmPassword ||
                  isSubmitting
                }
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Changing..." : "Change Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>Confirm Logout</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to logout? You will need to login again to
              access your account.
            </Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.logoutConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Past Orders Modal */}
      <Modal
        visible={showPastOrdersModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Past Orders</Text>
              <TouchableOpacity
                onPress={() => setShowPastOrdersModal(false)}
              >
                <Ionicons name="close" size={24} color={PeachyColors.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={PeachyColors.primary} />
            ) : (
              <ScrollView style={styles.ordersList}>
                {pastOrders.length === 0 ? (
                  <Text style={{ textAlign: "center", marginTop: 20 }}>No past orders found.</Text>
                ) : (
                  pastOrders.map((order, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.orderCard}
                      onPress={() => {
                        setSelectedOrder(order);
                        setShowOrdersModal(true);
                        setShowPastOrdersModal(false);
                      }}
                    >
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderNumber}>{order.order_id}</Text>
                        <Text style={styles.orderDate}>
                          {new Date(order.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderTotal}>${Number(order.total).toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Past Orders List Modal */}
      <Modal
        visible={showOrdersModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity
                onPress={() => setShowOrdersModal(false)}
              >
                <Ionicons name="close" size={24} color={PeachyColors.primary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={{ marginTop: 10 }}>
                {(selectedOrder.items ?? []).length > 0 ? (
                  (selectedOrder.items ?? []).map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.item_name} x {item.quantity}</Text>
                        <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                      </View>
                      {/* Show download button for photos */}
                      {item.item_image && (
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => item.item_image && handleDownloadPhoto(item.item_image, item.item_name)}
                        >
                          <Ionicons name="cloud-download" size={20} color="white" />
                          <Text style={styles.downloadButtonText}>Download</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <Text>No items found for this order.</Text>
                )}
            </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast Component */}
      {toast.visible && (
        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor:
                toast.type === "success"
                  ? "#E8F5E8"
                  : toast.type === "error"
                  ? "#FFEBEE"
                  : "#E3F2FD",
              borderColor:
                toast.type === "success"
                  ? "#4CAF50"
                  : toast.type === "error"
                  ? "#F44336"
                  : "#2196F3",
            },
          ]}
        >
          <View style={styles.toastContent}>
            <Ionicons
              name={
                toast.type === "success"
                  ? "checkmark-circle"
                  : toast.type === "error"
                  ? "close-circle"
                  : "information-circle"
              }
              size={24}
              color={
                toast.type === "success"
                  ? "#4CAF50"
                  : toast.type === "error"
                  ? "#F44336"
                  : "#2196F3"
              }
            />
            <View style={styles.toastTextContainer}>
              <Text
                style={[
                  styles.toastTitle,
                  {
                    color:
                      toast.type === "success"
                        ? "#4CAF50"
                        : toast.type === "error"
                        ? "#F44336"
                        : "#2196F3",
                  },
                ]}
              >
                {toast.title}
              </Text>
              <Text style={styles.toastMessage}>{toast.message}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Download Purchased Photos Modal */}
      <Modal
        visible={showDownloadPhotosModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download Purchased Photos</Text>
              <TouchableOpacity
                onPress={() => setShowDownloadPhotosModal(false)}
              >
                <Ionicons name="close" size={24} color={PeachyColors.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={PeachyColors.primary} />
            ) : (
              <ScrollView style={styles.ordersList}>
                {(() => {
                  const purchasedPhotos = getPurchasedPhotos();
                  if (purchasedPhotos.length === 0) {
                    return (
                      <View style={styles.emptyPhotosContainer}>
                        <Ionicons name="images-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyPhotosText}>No purchased photos found</Text>
                        <Text style={styles.emptyPhotosSubtext}>
                          Photos will appear here after you complete a purchase
                        </Text>
                      </View>
                    );
                  }
                  return purchasedPhotos.map((photo, index) => (
                    <View key={index} style={styles.downloadPhotoCard}>
                      <Image 
                        source={{ uri: photo.image }} 
                        style={styles.downloadPhotoThumbnail} 
                      />
                      <View style={styles.downloadPhotoInfo}>
                        <Text style={styles.downloadPhotoName}>{photo.name}</Text>
                        <Text style={styles.downloadPhotoDetails}>
                          Order: {photo.orderId} • {new Date(photo.orderDate).toLocaleDateString()}
                        </Text>
                        <Text style={styles.downloadPhotoPrice}>£{photo.price.toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.downloadPhotoButton}
                        onPress={() => handleDownloadPhoto(photo.image, photo.name)}
                      >
                        <Ionicons name="cloud-download" size={20} color="white" />
                        <Text style={styles.downloadPhotoButtonText}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  ));
                })()}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PeachyColors.primary,
  },
  errorText: {
    marginTop: 10,
    color: "#e74c3c",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    marginTop: 10,
    color: "#888",
    fontSize: 18,
    alignSelf: "center",
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
    marginBottom: 16,
    textAlign: "center",
  },
  editButton: {
    position: "absolute",
    top: 80,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: PeachyColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: PeachyColors.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#11181C",
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: PeachyColors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    color: "#11181C",
    fontSize: 16,
    fontFamily: "Poppins",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  saveButton: {
    backgroundColor: PeachyColors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "#687076",
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    textAlign: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    textAlign: "center",
  },
  childCard: {
    backgroundColor: "#F8F9FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8F0FF",
  },
  childName: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 5,
  },
  childDetails: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    marginBottom: 5,
  },
  relationshipType: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: PeachyColors.primary,
    fontWeight: "500",
  },
  noChildrenText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    fontStyle: "italic",
  },
  orderCard: {
    backgroundColor: "#F8F9FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8F0FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F0FF",
  },
  orderNumber: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "700",
    color: "#11181C",
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 13,
    fontFamily: "Poppins",
    color: "#687076",
    fontWeight: "500",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  orderTotal: {
    fontSize: 18,
    fontFamily: "Poppins",
    fontWeight: "700",
    color: PeachyColors.primary,
    letterSpacing: 0.5,
  },
  orderStatus: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  statusCompleted: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  statusProcessing: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  statusCancelled: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
  },
  noOrdersText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    fontStyle: "italic",
    textAlign: "center",
  },
  orderDetailsModalContent: {
    padding: 20,
  },
  orderItemsList: {
    marginTop: 15,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8F0FF",
  },
  orderItemName: {
    fontSize: 15,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  orderItemPrice: {
    fontSize: 15,
    fontFamily: "Poppins",
    color: PeachyColors.primary,
    fontWeight: "700",
    marginRight: 8,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 30,
    textAlign: "center",
  },
  expandOrdersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PeachyColors.primary,
    borderStyle: "dashed",
    shadowColor: PeachyColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expandOrdersText: {
    fontSize: 15,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: PeachyColors.primary,
    marginRight: 8,
    letterSpacing: 0.3,
  },
  expandArrow: {
  },
  expandArrowRotated: {
    transform: [{ rotate: "180deg" }],
  },
  securityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PeachyColors.light,
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  securityButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginLeft: 12,
    textAlign: "left",
    lineHeight: 20,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#000000",
    fontWeight: "600",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: PeachyColors.primary,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    color: "#11181C",
    fontSize: 16,
    fontFamily: "Poppins",
    marginBottom: 15,
  },
  passwordStrength: {
    marginBottom: 20,
  },
  passwordStrengthTitle: {
    fontSize: 14,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 10,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#687076",
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  confirmModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  confirmModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 15,
  },
  confirmModalText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  logoutConfirmButton: {
    backgroundColor: PeachyColors.primary,
  },
  logoutConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    textAlign: "center",
  },
  pastOrdersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PeachyColors.light,
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pastOrdersButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pastOrdersButtonText: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginLeft: 12,
    textAlign: "left",
    flex: 1,
    lineHeight: 20,
  },
  pastOrdersCount: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    marginLeft: 5,
  },
  sortControls: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  sortLabel: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: "row",
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    padding: 3,
    marginLeft: 10,
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  sortButtonActive: {
    backgroundColor: PeachyColors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#11181C",
    fontWeight: "600",
  },
  sortButtonTextActive: {
    color: "#FFFFFF",
  },
  sortOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: "#F0F4FF",
  },
  sortOrderText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#11181C",
    fontWeight: "600",
  },
  ordersList: {
    maxHeight: "90%",
  },
  orderItemText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#11181C",
    marginBottom: 5,
  },
  orderItems: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0FF',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 6,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "700",
    color: PeachyColors.primary,
    lineHeight: 20,
  },


  toastContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    marginBottom: 4,
  },
  toastMessage: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#333",
    lineHeight: 20,
  },
  downloadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F0FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  downloadImageContainer: {
    marginRight: 16,
  },
  downloadImagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8F0FF",
  },
  downloadImageText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: PeachyColors.primary,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "500",
  },
  downloadInfo: {
    flex: 1,
    marginRight: 20,
  },
  downloadTitle: {
    fontSize: 18,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
  },
  downloadDescription: {
    fontSize: 15,
    fontFamily: "Poppins",
    color: "#687076",
    marginBottom: 8,
    lineHeight: 20,
  },
  downloadDate: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#888",
    fontStyle: "italic",
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PeachyColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 120,
    justifyContent: 'center',
    borderWidth: 0,
  },
  downloadButtonText: {
    fontSize: 15,
    fontFamily: "Poppins",
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  downloadPhotosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PeachyColors.light,
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  downloadPhotosButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  downloadPhotosButtonText: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginLeft: 12,
    textAlign: "left",
    flex: 1,
    lineHeight: 20,
  },
  downloadPhotoCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadPhotoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
    alignSelf: "center",
  },
  downloadPhotoInfo: {
    flex: 1,
    width: "100%",
    marginBottom: 12,
  },
  downloadPhotoName: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
    lineHeight: 20,
    textAlign: "center",
    width: "100%",
  },
  downloadPhotoDetails: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#687076",
    marginBottom: 8,
    lineHeight: 18,
    textAlign: "center",
    width: "100%",
  },
  downloadPhotoPrice: {
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "700",
    color: PeachyColors.primary,
    marginBottom: 12,
    textAlign: "center",
    width: "100%",
  },
  emptyPhotosContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyPhotosText: {
    fontSize: 20,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  emptyPhotosSubtext: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#687076",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  downloadPhotoButton: {
    backgroundColor: PeachyColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    minWidth: 120,
  },
  downloadPhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins",
    fontWeight: "600",
    marginLeft: 6,
  },
});
