import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PeachyColors } from "../../constants/Colors";

const API_URL = `http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/parent/events`;

type Event = {
  id: number;
  name: string;
  description: string;
  event_date: string;
};

type Section = {
  title: string; // e.g. 'August 2025'
  data: Event[];
};

function groupEventsByMonth(events: Event[]): Section[] {
  // Sort events by date ascending
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  const groups: { [key: string]: Event[] } = {};
  sorted.forEach((event) => {
    const date = new Date(event.event_date);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

function getNearestFutureEvent(events: Event[]): Event | null {
  const now = new Date();
  const futureEvents = events.filter((e) => new Date(e.event_date) > now);
  if (!futureEvents.length) return null;
  return futureEvents.sort(
    (a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )[0];
}

function getCountdownString(targetDate: Date): string {
  const now = new Date();
  let diff = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function filterUpcomingEvents(events: Event[]): Event[] {
  const now = new Date();
  return events.filter((event) => new Date(event.event_date) >= now);
}

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Get stored tokens
        const accessToken = await AsyncStorage.getItem("accessToken");

        if (!accessToken) {
          setError("Authentication required. Please login first.");
          setLoading(false);
          return;
        }

        const res = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Authentication required. Please login again.");
            // Clear stored tokens on auth error
            await AsyncStorage.removeItem("accessToken");
            await AsyncStorage.removeItem("refreshToken");
            await AsyncStorage.removeItem("userData");
          } else {
            throw new Error("Failed to fetch events");
          }
          return;
        }

        const data = await res.json();
        // Filter out past events - only show upcoming and current events
        const upcomingEvents = filterUpcomingEvents(data);
        setEvents(upcomingEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Countdown logic
  useEffect(() => {
    const nearest = getNearestFutureEvent(events);
    if (!nearest) {
      setCountdown("");
      return;
    }
    const targetDate = new Date(nearest.event_date);
    const updateCountdown = () => {
      setCountdown(getCountdownString(targetDate));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const nearestEvent = getNearestFutureEvent(events);
  const sections = groupEventsByMonth(events);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PeachyColors.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="calendar-remove"
          size={48}
          color="#e74c3c"
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!events.length) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="calendar-blank-outline"
          size={64}
          color="#bbb"
        />
        <Text style={styles.emptyText}>No events to display.</Text>
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

      {/* Header and description */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Upcoming Events & Products</Text>
        <Text style={styles.descText}>
          Discover personalized gifts and products from upcoming events.
        </Text>
      </View>
      {/* Countdown */}
      {nearestEvent && countdown && (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownLabel}>The nearest event starts:</Text>
          <Text style={styles.countdownValue}>{countdown}</Text>
          <Text style={styles.countdownEventName}>{nearestEvent.name}</Text>
        </View>
      )}
      {/* Events list */}
      <View style={{ paddingBottom: 24, paddingHorizontal: 8 }}>
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map((event) => (
              <View key={event.id} style={styles.eventBox}>
                <View style={styles.dateBar}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.eventDate}>
                    {new Date(event.event_date).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={styles.eventTitle}>{event.name}</Text>
                <Text style={styles.eventDesc}>{event.description}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  countdownBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PeachyColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: PeachyColors.light,
  },
  countdownLabel: {
    color: PeachyColors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.5,
    fontFamily: "System",
  },
  countdownValue: {
    color: "#222",
    fontSize: 28,
    fontWeight: "bold",
    backgroundColor: PeachyColors.light,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
    letterSpacing: 2,
    fontFamily: "System",
  },
  countdownEventName: {
    color: PeachyColors.primary,
    fontSize: 15,
    marginTop: 2,
    fontWeight: "500",
    fontFamily: "System",
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
    marginTop: 20,
  },
  header: {
    fontSize: 26,
    fontFamily: "Poppins",
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
    textAlign: "center",
  },
  descText: {
    color: "#555",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: PeachyColors.light,
    color: PeachyColors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
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
  eventBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PeachyColors.primary,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  eventDate: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 14,
  },
  eventTitle: {
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 4,
    color: "#222",
  },
  eventDesc: {
    color: "#555",
    fontSize: 15,
    marginTop: 2,
  },
});
