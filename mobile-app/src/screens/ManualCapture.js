// src/screens/ManualCapture.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { loadStudents, savePhotoSession } from '../utils/offlineStorage';
import Colors from '../utils/colors';

export default function ManualCapture() {
  const { params } = useRoute();
  const { eventId } = params;
  const navigation = useNavigation();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [photoType, setPhotoType] = useState('individual');

  useEffect(() => {
    (async () => {
      const loaded = await loadStudents(eventId);
      setStudents(loaded);
    })();
  }, [eventId]);

  const handleSearch = (text) => {
    setSearch(text);
    if (text.trim()) {
      setResults(
        students.filter((s) =>
          s.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    } else {
      setResults([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      return Alert.alert('Select Students', 'Please select at least one.');
    }
    const timestamp = new Date().toISOString();
    const session = {
      session_id: `manual_${Date.now()}`,
      qrcode_id: null,
      photo_type: photoType,
      student_ids: selectedIds,
      timestamp,
      status: 'present',
    };
    await savePhotoSession(eventId, session);
    Alert.alert('Saved', 'Manual session recorded.');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.container}>
        {/* CONTENT */}
        <View style={styles.content}>
          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={handleSearch}
          />

          {/* Search results appear ABOVE type chips */}
          {results.length > 0 && (
            <View style={styles.resultsCard}>
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingVertical: 4 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.resultRow,
                      selectedIds.includes(item.id) && styles.selectedRow,
                    ]}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.className}>
                      {`Class: ${item.class_name || '–'}`}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Photo type chips */}
          <View style={styles.typeCard}>
            <Text style={styles.typeLabel}>Photo Type</Text>
            <View style={styles.chipsRow}>
              {[
                { key: 'individual', label: 'Individual' },
                { key: 'with_sibling', label: 'With Sibling' },
                { key: 'with_friend', label: 'With Friend' },
                { key: 'group', label: 'Group' },
              ].map((opt) => {
                const active = photoType === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setPhotoType(opt.key)}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Selected list */}
          {selectedIds.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.subHeader}>Selected Students</Text>
              {selectedIds.map((id) => {
                const s = students.find((stu) => stu.id === id);
                return (
                  <Text key={id} style={styles.selectedName}>
                    • {s?.name} {s?.class_name ? `(Class: ${s.class_name})` : ''}
                  </Text>
                );
              })}
            </View>
          )}
        </View>

        {/* FOOTER BUTTON */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
            ]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Manual Session</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flex: 1,
    padding: 16,
  },

  // Search input
  searchInput: {
    width: '100%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    color: Colors.textPrimary,
  },

  // Results list card (above chips)
  resultsCard: {
    maxHeight: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectedRow: {
    backgroundColor: Colors.primaryMuted,
  },
  name: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  className: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Type chips block (replaces wheel picker)
  typeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },

  // Selected list
  selectedContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  selectedName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginBottom: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  saveButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
