// src/components/FilterBar.js

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import Colors from "../utils/colors";
import { textStyles } from "../utils/typography";
import { spacing, borderRadius, shadows } from "../utils/spacing";

export default function FilterBar({
  schools,
  onSearchChange,
  onSchoolChange,
  onDateRangeChange,
  onSortToggle,
  onIncludeExpiredToggle,
  onClearFilters,
  includeExpired,
  sortAsc,
}) {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSchoolPickerVisible, setIsSchoolPickerVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [searchText, setSearchText] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate filter bar entrance
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [slideAnim]);

  const handleSearchChange = (text) => {
    try {
      setSearchText(text);
      onSearchChange(text);
    } catch (error) {
      console.error("FilterBar: Error handling search change", error);
    }
  };

  const handleStartDateConfirm = (date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("FilterBar: Invalid start date", date);
        return;
      }
      setSelectedStartDate(date);
      setIsDatePickerVisible(false);
      onDateRangeChange({ start: date, end: selectedEndDate });
    } catch (error) {
      console.error("FilterBar: Error handling start date confirm", error);
    }
  };

  const handleEndDateConfirm = (date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("FilterBar: Invalid end date", date);
        return;
      }
      setSelectedEndDate(date);
      setIsDatePickerVisible(false);
      onDateRangeChange({ start: selectedStartDate, end: date });
    } catch (error) {
      console.error("FilterBar: Error handling end date confirm", error);
    }
  };

  const handleSchoolSelect = (school) => {
    try {
      // Handle both string and object school formats
      const schoolId =
        school === "All Schools"
          ? null
          : typeof school === "object"
          ? school.id
          : school;
      const schoolName =
        school === "All Schools"
          ? "All Schools"
          : typeof school === "object"
          ? school.name
          : school;

      setSelectedSchool(schoolName);
      setIsSchoolPickerVisible(false);
      onSchoolChange(schoolId);
    } catch (error) {
      console.error("FilterBar: Error handling school select", error);
    }
  };

  const handleClearFilters = () => {
    try {
      // Animate clear button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setSelectedSchool(null);
      setSearchText("");
      onClearFilters();
    } catch (error) {
      console.error("FilterBar: Error clearing filters", error);
    }
  };

  const hasActiveFilters =
    selectedStartDate ||
    selectedEndDate ||
    selectedSchool ||
    searchText.length > 0;

  // Process schools to handle both string and object formats
  const schoolOptions = ["All Schools"];
  if (Array.isArray(schools)) {
    schools.forEach((school) => {
      if (typeof school === "string") {
        schoolOptions.push(school);
      } else if (school && typeof school === "object" && school.name) {
        schoolOptions.push(school);
      }
    });
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Header with calendar icon and title */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={Colors.gradientViolet} // Now coral gradient
            style={styles.calendarIconContainer}
          >
            <Ionicons name="calendar" size={24} color={Colors.white} />
          </LinearGradient>
          <Text style={[styles.titleText, textStyles.heading4]}>Events</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, textStyles.bodyMedium]}
            placeholder="Search events..."
            placeholderTextColor={Colors.textTertiary}
            value={searchText}
            onChangeText={handleSearchChange}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                try {
                  handleSearchChange("");
                } catch (error) {
                  console.error("FilterBar: Error clearing search", error);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Options - Three horizontal pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {/* All Events Filter */}
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => {
            try {
              onClearFilters();
            } catch (error) {
              console.error("FilterBar: Error clearing filters", error);
            }
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.white, Colors.background]}
            style={styles.filterChipGradient}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={[styles.filterChipText, textStyles.caption]}>
              All Events
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Date Range Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            (selectedStartDate || selectedEndDate) && styles.filterChipActive,
          ]}
          onPress={() => {
            try {
              setIsDatePickerVisible(true);
            } catch (error) {
              console.error("FilterBar: Error opening date picker", error);
            }
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedStartDate || selectedEndDate
                ? Colors.gradientCyan // Now light coral gradient
                : [Colors.white, Colors.background]
            }
            style={styles.filterChipGradient}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={
                selectedStartDate || selectedEndDate
                  ? Colors.white
                  : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterChipText,
                textStyles.caption,
                (selectedStartDate || selectedEndDate) &&
                  styles.filterChipTextActive,
              ]}
            >
              {selectedStartDate && selectedEndDate
                ? `${format(selectedStartDate, "MMM dd")} - ${format(
                    selectedEndDate,
                    "MMM dd"
                  )}`
                : "Date Range"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* School Filter */}
        <TouchableOpacity
          style={[styles.filterChip, selectedSchool && styles.filterChipActive]}
          onPress={() => {
            try {
              setIsSchoolPickerVisible(true);
            } catch (error) {
              console.error("FilterBar: Error opening school picker", error);
            }
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedSchool
                ? Colors.gradientAmber // Now peach gradient
                : [Colors.white, Colors.background]
            }
            style={styles.filterChipGradient}
          >
            <Ionicons
              name="school-outline"
              size={16}
              color={selectedSchool ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                textStyles.caption,
                styles.fallbackText,
                selectedSchool && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedSchool || "School"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <DateTimePicker
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={
          selectedStartDate ? handleEndDateConfirm : handleStartDateConfirm
        }
        onCancel={() => {
          try {
            setIsDatePickerVisible(false);
          } catch (error) {
            console.error("FilterBar: Error canceling date picker", error);
          }
        }}
        date={selectedStartDate || selectedEndDate || new Date()}
        minimumDate={selectedStartDate || new Date()}
      />

      {/* School Picker Modal */}
      <Modal
        visible={isSchoolPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSchoolPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[Colors.white, Colors.background]}
              style={styles.modalCard}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    textStyles.heading2,
                    styles.fallbackText,
                  ]}
                >
                  Select School
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    try {
                      setIsSchoolPickerVisible(false);
                    } catch (error) {
                      console.error(
                        "FilterBar: Error closing school picker",
                        error
                      );
                    }
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.schoolList}>
                {schoolOptions.map((school, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.schoolOption,
                      selectedSchool ===
                        (typeof school === "object" ? school.name : school) &&
                        styles.schoolOptionSelected,
                    ]}
                    onPress={() => {
                      try {
                        handleSchoolSelect(school);
                      } catch (error) {
                        console.error(
                          "FilterBar: Error selecting school",
                          error
                        );
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        selectedSchool ===
                        (typeof school === "object" ? school.name : school)
                          ? Colors.gradientAmber
                          : [Colors.white, Colors.background]
                      }
                      style={styles.schoolOptionGradient}
                    >
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color={
                          selectedSchool ===
                          (typeof school === "object" ? school.name : school)
                            ? Colors.white
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.schoolOptionText,
                          textStyles.bodyMedium,
                          styles.fallbackText,
                          selectedSchool ===
                            (typeof school === "object"
                              ? school.name
                              : school) && styles.schoolOptionTextSelected,
                        ]}
                      >
                        {typeof school === "object" ? school.name : school}
                      </Text>
                      {selectedSchool ===
                        (typeof school === "object" ? school.name : school) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.white}
                        />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  // Fallback text styling to ensure text is always visible
  fallbackText: {
    fontFamily: undefined, // Let React Native use default font
    fontSize: undefined, // Let typography system handle this
    fontWeight: undefined, // Let typography system handle this
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  titleText: {
    color: Colors.textPrimary,
    fontWeight: "600",
    fontSize: 18,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: spacing.xs,
    fontSize: 16,
    fontWeight: "400",
  },
  filtersContainer: {
    paddingRight: spacing.lg,
  },
  filterChip: {
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.sm,
  },
  filterChipActive: {
    ...shadows.md,
  },
  filterChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minWidth: 100,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontWeight: "500",
    fontSize: 14,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: "600",
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
    maxHeight: "80%",
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
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  schoolList: {
    maxHeight: 300,
  },
  schoolOption: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  schoolOptionSelected: {
    ...shadows.md,
  },
  schoolOptionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  schoolOptionText: {
    color: Colors.textSecondary,
    flex: 1,
    fontWeight: "500",
  },
  schoolOptionTextSelected: {
    color: Colors.white,
    fontWeight: "600",
  },
});
