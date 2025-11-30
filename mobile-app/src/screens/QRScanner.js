// src/screens/QRScanner.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loadQRCodes, saveQRCodes } from "../utils/offlineStorage";
import Colors from "../utils/colors";
import { textStyles } from "../utils/typography";
import { spacing, borderRadius, shadows } from "../utils/spacing";

export default function QRScanner() {
  const { params } = useRoute();
  const { eventId, eventName } = params;
  const navigation = useNavigation();

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [qrList, setQrList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanAnimation] = useState(new Animated.Value(0));

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
    (async () => {
      setQrList(await loadQRCodes(eventId));
    })();

    // Start scanning animation
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [eventId, permission, scanAnimation]);

  const markScanned = async (qrId) => {
    const updated = qrList.map((q) =>
      q.id === qrId ? { ...q, is_scanned: true } : q
    );
    await saveQRCodes(eventId, updated);
    setQrList(updated);
  };
  const onBarCodeScanned = ({ data }) => {
    if (scanned) return;

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      Alert.alert(
        "Invalid QR Code",
        "The scanned QR code is not in the correct format."
      );
      return;
    }

    const qr = qrList.find((q) => q.code === parsed.code);

    if (!qr) {
      Alert.alert(
        "QR Code Not Found",
        "This QR code is not associated with this event."
      );
      return;
    }
    setScanned(true);
    markScanned(qr.id);
    navigation.navigate("StudentInfo", { eventId, qrId: qr.id });
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) {
      Alert.alert("Invalid Code", "Please enter a valid QR code.");
      return;
    }

    const qr = qrList.find((q) => q.code === code);
    if (!qr) {
      Alert.alert(
        "Code Not Found",
        "No matching QR code found for this event."
      );
      setManualCode("");
      return;
    }

    setModalVisible(false);
    setScanned(true);
    markScanned(qr.id);
    navigation.navigate("StudentInfo", { eventId, qrId: qr.id });
    setManualCode("");
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <View style={styles.permissionContainer}>
          <LinearGradient
            colors={Colors.gradientCyan}
            style={styles.permissionIconContainer}
          >
            <Ionicons name="camera-outline" size={64} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.permissionTitle}>Requesting Camera Access</Text>
          <Text style={styles.permissionSubtitle}>
            Please wait while we request camera permissions...
          </Text>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <View style={styles.permissionContainer}>
          <LinearGradient
            colors={Colors.gradientSunset}
            style={styles.permissionIconContainer}
          >
            <Ionicons
              name="camera-off-outline"
              size={64}
              color={Colors.white}
            />
          </LinearGradient>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            This app needs camera access to scan QR codes. Please enable camera
            permissions in your device settings.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradientViolet}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionButtonGradient}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={Colors.white}
              />
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.shadow} />

      {/* Enhanced Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <Text style={styles.headerSubtitle}>{eventName}</Text>
        </View>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
            style={styles.manualButtonGradient}
          >
            <Ionicons name="keyboard-outline" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Camera View */}
      {!scanned && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={onBarCodeScanned}
          />

          {/* Enhanced Scanner Overlay */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              {/* Corner Indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Scanning Line Animation */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 200],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            <View style={styles.scannerTextContainer}>
              <Text style={styles.scannerText}>
                Position QR code within frame
              </Text>
              <Text style={styles.scannerSubtext}>
                Hold steady for automatic scanning
              </Text>
            </View>

            {/* Manual Entry Hint */}
            <TouchableOpacity
              style={styles.manualHint}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={Colors.gradientAmber}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.manualHintGradient}
              >
                <Ionicons
                  name="keyboard-outline"
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.manualHintText}>Manual Entry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Enhanced Success State */}
      {scanned && (
        <View style={styles.successContainer}>
          <LinearGradient
            colors={Colors.gradientGreen}
            style={styles.successIconContainer}
          >
            <Ionicons name="checkmark-circle" size={80} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.successTitle}>QR Code Scanned!</Text>
          <Text style={styles.successSubtitle}>
            Processing student information...
          </Text>

          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Colors.gradientViolet}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanAgainButtonGradient}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.scanAgainButtonText}>Scan Another</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Enhanced Manual Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[Colors.white, Colors.background]}
              style={styles.modalCard}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Manual QR Code Entry</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <LinearGradient
                    colors={Colors.gradientCyan}
                    style={styles.inputIconGradient}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={20}
                      color={Colors.white}
                    />
                  </LinearGradient>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter QR code"
                  placeholderTextColor={Colors.textTertiary}
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleManualSubmit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradientSunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.submitButtonText}>Submit Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    paddingTop: 44,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
    overflow: "hidden",
    ...shadows.md,
  },
  backButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerTitle: {
    ...textStyles.heading2,
    color: Colors.white,
    marginBottom: spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    ...textStyles.bodyMedium,
    color: Colors.white,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  manualButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.md,
  },
  manualButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: Colors.white,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scannerTextContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  scannerText: {
    ...textStyles.heading4,
    color: Colors.white,
    textAlign: "center",
    marginBottom: spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scannerSubtext: {
    ...textStyles.bodySmall,
    color: Colors.white,
    textAlign: "center",
    opacity: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  manualHint: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.md,
  },
  manualHintGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  manualHintText: {
    ...textStyles.caption,
    color: Colors.white,
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: Colors.background,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.xl,
  },
  successTitle: {
    ...textStyles.heading1,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  successSubtitle: {
    ...textStyles.bodyLarge,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  successActions: {
    width: "100%",
  },
  scanAgainButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  scanAgainButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  scanAgainButtonText: {
    ...textStyles.buttonLarge,
    color: Colors.white,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.xl,
  },
  permissionTitle: {
    ...textStyles.heading2,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  permissionSubtitle: {
    ...textStyles.bodyMedium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  permissionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  permissionButtonText: {
    ...textStyles.buttonMedium,
    color: Colors.white,
    fontWeight: "600",
  },
  loadingDots: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.primary,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
  },
  modalCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...textStyles.heading2,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  inputIconContainer: {
    marginRight: spacing.sm,
  },
  inputIconGradient: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  modalInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  submitButtonText: {
    ...textStyles.buttonLarge,
    color: Colors.white,
    fontWeight: "600",
  },
});
