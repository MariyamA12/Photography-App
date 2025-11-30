// src/screens/NotificationsScreen.js

import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import useNotifications from "../hooks/useNotifications";
import NotificationItem from "../components/NotificationItem";
import BottomNavigation from "../components/BottomNavigation";
import Colors from "../utils/colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function NotificationsScreen({ navigation }) {
  const { notifications, loading, error, refresh, loadMore } =
    useNotifications();

  // ---- filter state ----
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [picker, setPicker] = useState({ which: null, visible: false });
  const [activeTab, setActiveTab] = useState("notifications");

  // ---- read‐more modal ----
  const [modalVisible, setModalVisible] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);

  const handleReadMore = (notif) => {
    setActiveNotification(notif);
    setModalVisible(true);
  };

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === "events") {
      navigation.navigate("Home");
    } else if (tabKey === "profile") {
      navigation.navigate("Profile");
    }
  };

  // ---- date‐picker handlers ----
  const openPicker = (which) => setPicker({ which, visible: true });
  const closePicker = () => setPicker({ which: null, visible: false });
  const onConfirmDate = (date) => {
    picker.which === "from" ? setFromDate(date) : setToDate(date);
    closePicker();
  };

  const clearFilters = () => {
    setSearch("");
    setFromDate(null);
    setToDate(null);
  };

  // ---- filtered list ----
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      // Handle different notification structures
      const title = n.subject || n.title || "";
      const message = n.message || "";
      const text = (title + " " + message).toLowerCase();

      if (search && !text.includes(search.toLowerCase())) return false;

      // Handle different date field names
      const dateField = n.sentAt || n.created_at || n.timestamp;
      if (!dateField) return false;

      try {
        const sent = new Date(dateField);
        if (isNaN(sent.getTime())) return false;

        if (fromDate && sent < fromDate) return false;
        if (toDate && sent > toDate) return false;
        return true;
      } catch (error) {
        return false;
      }
    });
  }, [notifications, search, fromDate, toDate]);

  // ---- empty / loading / error states ----
  if (loading && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (error && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Failed to load notifications.</Text>
        <Text style={styles.link} onPress={refresh}>
          Tap to retry
        </Text>
      </View>
    );
  }
  if (!loading && filtered.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Notifications</Text>
        <View style={styles.center}>
          <Text style={styles.message}>No notifications.</Text>
          <Text style={styles.link} onPress={clearFilters}>
            Clear filters
          </Text>
        </View>
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  // ---- item renderer ----
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <NotificationItem
        notification={item}
        onPress={() => handleReadMore(item)}
        onMarkAsRead={() => {
          // TODO: Implement mark as read functionality
        }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <Text style={styles.header}>Notifications</Text>

      {/* filter bar */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          placeholderTextColor="#000000"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.dateRow}>
          <Pressable
            style={styles.dateButton}
            onPress={() => openPicker("from")}
          >
            <Text style={styles.dateText}>
              {fromDate ? fromDate.toLocaleDateString("en-GB") : "From"}
            </Text>
          </Pressable>
          <Text style={styles.dateSeparator}>–</Text>
          <Pressable style={styles.dateButton} onPress={() => openPicker("to")}>
            <Text style={styles.dateText}>
              {toDate ? toDate.toLocaleDateString("en-GB") : "To"}
            </Text>
          </Pressable>
        </View>
        <Pressable style={styles.clearBtn} onPress={clearFilters}>
          <Ionicons name="close-circle" size={20} color="#000000" />
        </Pressable>
      </View>

      {/* date picker */}
      <DateTimePickerModal
        isVisible={picker.visible}
        mode="date"
        onConfirm={onConfirmDate}
        onCancel={closePicker}
      />

      {/* list */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={[Colors.primary]}
          />
        }
      />

      {/* read‐more modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            {activeNotification && (
              <ScrollView>
                <Text style={styles.modalSubject}>
                  {activeNotification.subject ||
                    activeNotification.title ||
                    "Notification"}
                </Text>
                <Text style={styles.modalDate}>
                  {(() => {
                    const dateField =
                      activeNotification.sentAt ||
                      activeNotification.created_at ||
                      activeNotification.timestamp;
                    if (!dateField) return "No date available";

                    try {
                      const date = new Date(dateField);
                      if (isNaN(date.getTime())) return "Invalid date";

                      return date.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch (error) {
                      return "Date error";
                    }
                  })()}
                </Text>
                <Text style={styles.modalMessage}>
                  {activeNotification.message || "No message content"}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    // on Android, add the status‐bar height:
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 0,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.secondary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },

  // center / messages
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  message: {
    fontSize: 16,
    color: Colors.secondary,
  },
  link: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 8,
  },

  // filter bar
  filterBar: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 12,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#000000",
    color: "#000000",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#000000",
    alignItems: "center",
  },
  dateText: {
    color: "#000000",
  },
  dateSeparator: {
    marginHorizontal: 8,
    color: "#000000",
    fontSize: 18,
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: 16,
    zIndex: 1,
    padding: 4,
  },

  // notification card wrapper
  card: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "80%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  modalSubject: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
});
