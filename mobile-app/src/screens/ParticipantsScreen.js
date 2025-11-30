// src/screens/ParticipantsScreen.js

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { loadStudents, loadPhotoPrefs } from '../utils/offlineStorage';
import Colors from '../utils/colors';

export default function ParticipantsScreen() {
  const { params } = useRoute();
  const { eventId } = params;

  const [students, setStudents] = useState([]);
  const [prefs, setPrefs]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const [search, setSearch]               = useState('');
  const [photoTypeFilter, setPhotoTypeFilter] = useState('all');
  const [page, setPage]                   = useState(1);
  const limit = 20;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [stu, pr] = await Promise.all([
        loadStudents(eventId),
        loadPhotoPrefs(eventId),
      ]);
      setStudents(stu);
      setPrefs(pr);
      setLoading(false);
    })();
  }, [eventId]);

  const merged = useMemo(
    () => students.map(s => {
      const pref = prefs.find(p => p.student_id === s.id);
      return {
        ...s,
        preference_type: pref?.preference_type || 'individual',
      };
    }),
    [students, prefs]
  );

  const filtered = useMemo(
    () => merged.filter(item => {
      const matchesName = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesType =
        photoTypeFilter === 'all' ||
        item.preference_type === photoTypeFilter;
      return matchesName && matchesType;
    }),
    [merged, search, photoTypeFilter]
  );

  const paged = useMemo(
    () => filtered.slice(0, page * limit),
    [filtered, page]
  );

  const handleEndReached = () => {
    if (filtered.length > paged.length) {
      setPage(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search students..."
        placeholderTextColor={Colors.textTertiary}
        value={search}
        onChangeText={text => {
          setSearch(text);
          setPage(1);
        }}
      />

      {/* Photo Type */}
      <View style={styles.pickerContainer}>
        <Picker
          mode="dropdown"
          dropdownIconColor={Colors.textSecondary}
          selectedValue={photoTypeFilter}
          onValueChange={value => {
            setPhotoTypeFilter(value);
            setPage(1);
          }}
          style={styles.picker}
        >
          <Picker.Item label="All Types" value="all" />
          <Picker.Item label="Individual" value="individual" />
          <Picker.Item label="With Sibling" value="with_sibling" />
          <Picker.Item label="With Friend" value="with_friend" />
          <Picker.Item label="Group" value="group" />
        </Picker>
      </View>

      {/* Participants List */}
      <FlatList
        contentContainerStyle={
          paged.length === 0 ? styles.emptyContainer : undefined
        }
        data={paged}
        keyExtractor={item => String(item.id)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.class}>{`Class: ${item.class_name || "–"}`}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {item.preference_type.replace('_', ' ')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.message}>No participants found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  // Search box
  searchInput: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: Colors.textPrimary,
  },

  // Picker wrapper: full width, fixed height
  pickerContainer: {
    width: '100%',
    height: 48,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center', // vertically center the selected text
  },
  picker: {
    width: '100%',
    height: '100%',
  },

  // Card style
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    // shadow / elevation
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardText: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  class: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  typeBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
