// src/screens/AttendanceScreen.js

import React, { useEffect, useState } from 'react';
import {
  View, Text, SectionList, FlatList,
  ActivityIndicator, StyleSheet, TouchableOpacity
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  loadQRCodes, loadStudents, loadPhotoSessions
} from '../utils/offlineStorage';
import Colors from '../utils/colors';

const TABS = [
  { key:'all',    label:'All' },
  { key:'qr',     label:'QR Only' },
  { key:'manual', label:'Manual Only' },
];

export default function AttendanceScreen() {
  const { params }      = useRoute();
  const { eventId }     = params;
  const [qrCodes, setQrCodes]      = useState([]);
  const [students, setStudents]    = useState([]);
  const [sessions, setSessions]    = useState([]);
  const [loading, setLoading]      = useState(true);
  const [filter, setFilter]        = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [qr, stu, sess] = await Promise.all([
        loadQRCodes(eventId),
        loadStudents(eventId),
        loadPhotoSessions(eventId),
      ]);
      setQrCodes(qr);
      setStudents(stu);
      setSessions(sess);
      setLoading(false);
    })();
  }, [eventId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Build QR sessions
  const qrData = qrCodes.map(qr => {
    const sess = sessions.find(s => s.qrcode_id === qr.id);
    return {
      id:            qr.id,
      student_names: (qr.students||[]).map(s=>s.name).join(', '),
      photo_type:    qr.photo_type,
      timestamp:     sess?.timestamp || null,
      status:        sess?.status || null, // present | absent | missed | refused | null
    };
  });

  // Manual sessions
  const manualData = sessions
    .filter(s => s.qrcode_id === null)
    .map(sess => {
      const names = (sess.student_ids||[])
        .map(id => students.find(s=>s.id===id)?.name)
        .filter(Boolean)
        .join(', ');
      return {
        id:            sess.session_id,
        student_names: names,
        photo_type:    sess.photo_type,
        timestamp:     sess.timestamp,
        status:        sess.status || 'manual',
      };
    });

  const renderRow = ({ item }) => {
    let badgeText  = 'Not taken';
    let badgeColor = '#F44336';

    if (item.status === 'present') {
      badgeText  = 'Present';
      badgeColor = '#4CAF50';
    } else if (item.status === 'absent') {
      badgeText  = 'Absent';
      badgeColor = '#FFC107';
    } else if (item.status === 'missed') {
      badgeText  = 'Missed';
      badgeColor = '#f98f16ed';
    } else if (item.status === 'refused') {
      badgeText  = 'Refused';
      badgeColor = '#ffbb00ff';
    } else if (item.status === 'manual') {
      badgeText  = 'Taken (Manual)';
      badgeColor = '#3B82F6';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.name}>{item.student_names}</Text>
          <Text style={styles.type}>Type: {item.photo_type}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
          {item.timestamp && (
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const SingleList = ({ data, emptyMessage }) => (
    <FlatList
      contentContainerStyle={data.length ? styles.list : styles.emptyContainer}
      data={data}
      keyExtractor={i => String(i.id)}
      renderItem={renderRow}
      ListEmptyComponent={<Text style={styles.message}>{emptyMessage}</Text>}
    />
  );

  const AllList = () => (
    <SectionList
      contentContainerStyle={styles.list}
      sections={[
        { title:'QR Sessions',     data:qrData     },
        { title:'Manual Sessions', data:manualData },
      ]}
      keyExtractor={item => String(item.id)}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={renderRow}
      ListEmptyComponent={<Text style={styles.message}>No attendance data.</Text>}
    />
  );

  return (
    <View style={styles.container}>
      <TabBar filter={filter} setFilter={setFilter} />
      {filter==='all'    && <AllList />}
      {filter==='qr'     && <SingleList data={qrData}     emptyMessage="No QR sessions." />}
      {filter==='manual' && <SingleList data={manualData} emptyMessage="No manual captures." />}
    </View>
  );
}

function TabBar({ filter, setFilter }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, filter===tab.key && styles.tabActive]}
          onPress={() => setFilter(tab.key)}
        >
          <Text style={[styles.tabLabel, filter===tab.key && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor:Colors.background },
  center:         { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:Colors.background },
  tabBar:         { flexDirection:'row', justifyContent:'space-around', paddingVertical:12, backgroundColor:Colors.white, borderBottomWidth:1, borderColor:'#EEE' },
  tab:            { paddingVertical:6, paddingHorizontal:20, borderRadius:20 },
  tabActive:      { backgroundColor:Colors.primary },
  tabLabel:       { fontSize:14, color:Colors.textSecondary },
  tabLabelActive: { color:Colors.white, fontWeight:'600' },
  sectionHeader:  { marginTop:16, marginBottom:8, fontSize:14, fontWeight:'700', color:Colors.textPrimary },
  list:           { padding:16 },
  emptyContainer: { flex:1, justifyContent:'center', alignItems:'center', padding:16 },
  message:        { fontSize:16, color:Colors.textSecondary, textAlign:'center', marginTop:32 },
  card:           { flexDirection:'row', backgroundColor:'#fff', borderRadius:8, padding:12, marginBottom:12, elevation:1, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.1, shadowRadius:2 },
  cardLeft:       { flex:1 },
  cardRight:      { alignItems:'flex-end', justifyContent:'center' },
  name:           { fontSize:16, color:Colors.textPrimary },
  type:           { fontSize:12, color:Colors.textSecondary, marginTop:4 },
  badge:          { borderRadius:12, paddingVertical:4, paddingHorizontal:8, marginBottom:4 },
  badgeText:      { color:'#fff', fontSize:12, fontWeight:'600' },
  timestamp:      { fontSize:12, color:Colors.textTertiary },
});
