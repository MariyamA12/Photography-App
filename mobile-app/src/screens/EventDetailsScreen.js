// src/screens/EventDetailsScreen.js

import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import useEventDetails from "../hooks/useEventDetails";
import useSyncEvent from "../hooks/useSyncEvent";
import useOfflineStatus from "../hooks/useOfflineStatus";
import useSyncUpload from "../hooks/useSyncUpload";
import Button from "../components/ui/Button";
import Colors from "../utils/colors";

export default function EventDetailsScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { eventId } = params;

  const { event, loading, error, refetch } = useEventDetails(eventId);
  const { sync, syncing, lastSync } = useSyncEvent(eventId);
  const isSynced = useOfflineStatus(eventId, syncing);
  const { upload, uploading, lastUpload } = useSyncUpload(eventId);

  // Combined action: first sync, then upload
  const syncAndUpload = async () => {
    if (syncing || uploading) return;
    await sync();
    await upload();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Failed to load event details.</Text>
        <Text style={styles.link} onPress={refetch}>
          Tap to retry
        </Text>
      </View>
    );
  }
  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Event not found.</Text>
      </View>
    );
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const fmtDateTime = (d) =>
    new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading || syncing}
          onRefresh={refetch}
          colors={[Colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventDate}>{fmtDate(event.event_date)}</Text>
      </View>

      {/* Description Section */}
      {event.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>
      )}

      {/* Info Cards Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Event Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>{event.school?.name || "–"}</Text>
          </View>
        </View>
      </View>

      {/* Sync Status Section */}
      <View style={styles.syncSection}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.syncGrid}>
          <View style={styles.syncCard}>
            <View style={styles.syncHeader}>
              <View
                style={[
                  styles.syncIndicator,
                  isSynced ? styles.synced : styles.notSynced,
                ]}
              />
              <Text style={styles.syncLabel}>Status</Text>
            </View>
            <Text
              style={[
                styles.syncValue,
                isSynced ? styles.syncedText : styles.notSyncedText,
              ]}
            >
              {isSynced ? "Synced" : "Not Synced"}
            </Text>
          </View>

          {lastSync && (
            <View style={styles.syncCard}>
              <Text style={styles.syncLabel}>Last Synced</Text>
              <Text style={styles.syncValue}>{fmtDateTime(lastSync)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title="Sync & Upload"
          onPress={syncAndUpload}
          variant="primary"
          size="large"
          icon="cloud-upload"
          iconPosition="left"
          loading={syncing || uploading}
          disabled={syncing || uploading}
          fullWidth
          style={styles.mainButton}
        />

        <Button
          title="Complete Event"
          onPress={() => navigation.navigate("FinalReview", { eventId })}
          variant="primary"
          size="large"
          icon="checkmark-done"
          iconPosition="left"
          fullWidth
          style={{ marginBottom: 12 }}
        />

        {isSynced && (
          <>
            <Text style={styles.actionsLabel}>Quick Actions</Text>
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonsGrid}>
                <View style={styles.actionItem}>
                  <Button
                    title=""
                    onPress={() =>
                      navigation.navigate("Participants", { eventId })
                    }
                    variant="secondary"
                    size="small"
                    compact
                    icon="people"
                    iconPosition="center"
                    style={styles.gridButton}
                  />
                  <Text style={styles.actionLabel}>Participants</Text>
                </View>

                <View style={styles.actionItem}>
                  <Button
                    title=""
                    onPress={() =>
                      navigation.navigate("Attendance", { eventId })
                    }
                    variant="success"
                    size="small"
                    compact
                    icon="checkmark-circle"
                    iconPosition="center"
                    style={styles.gridButton}
                  />
                  <Text style={styles.actionLabel}>Attendance</Text>
                </View>

                <View style={styles.actionItem}>
                  <Button
                    title=""
                    onPress={() => navigation.navigate("QRScanner", { eventId })}
                    variant="warning"
                    size="small"
                    compact
                    icon="qr-code"
                    iconPosition="center"
                    style={styles.gridButton}
                  />
                  <Text style={styles.actionLabel}>Scan QR</Text>
                </View>

                                <View style={styles.actionItem}>
                  <Button
                    title=""
                    onPress={() =>
                      navigation.navigate("ManualCapture", { eventId })
                    }
                    variant="info"
                    size="small"
                    compact
                    icon="camera"
                    iconPosition="center"
                    style={styles.gridButton}
                  />
                  <Text style={styles.actionLabel}>Manual Capture</Text>
                </View>               
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },

  // Header Section
  headerSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  eventName: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 34,
  },
  eventDate: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
    lineHeight: 22,
  },

  // Description Section
  descriptionSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textTertiary,
    lineHeight: 24,
  },

  // Info Section
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoCard: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // Sync Section
  syncSection: {
    marginBottom: 32,
  },
  syncGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  syncCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  syncIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  synced: {
    backgroundColor: Colors.success,
  },
  notSynced: {
    backgroundColor: Colors.warning,
  },
  syncLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  syncValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  syncedText: {
    color: Colors.success,
  },
  notSyncedText: {
    color: Colors.warning,
  },

  // Buttons
  buttonsContainer: {
    width: "100%",
  },
  mainButton: {
    marginBottom: 20,
  },
  actionsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionButtonsContainer: {
    marginTop: 12,
  },
  actionButtonsGrid: {
    flexDirection: "row",
    flexWrap: "nowrap", // Keep in single line
    gap: 12, // Reduce gap to prevent overlap
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  gridButton: {
    width: 70, // Slightly smaller to fit in line
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
    actionItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actionLabel: {
    marginTop: 6,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Utility styles
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  link: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
});
