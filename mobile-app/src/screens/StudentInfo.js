// src/screens/StudentInfo.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Button, Alert, ScrollView,
  TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  loadQRCodes, loadStudents, savePhotoSession
} from '../utils/offlineStorage';
import Colors from '../utils/colors';

export default function StudentInfo() {
  const { params }        = useRoute();
  const { eventId, qrId } = params;
  const navigation        = useNavigation();

  const [qr, setQr]           = useState(null);
  const [students, setStudents] = useState([]);
  const [status, setStatus]   = useState('present');

  useEffect(() => {
    (async () => {
      const qrList      = await loadQRCodes(eventId);
      const found       = qrList.find(q => q.id === qrId);
      const allStudents = await loadStudents(eventId);
      setQr(found);
      setStudents(allStudents.filter(s => found.student_ids.includes(s.id)));
    })();
  }, [eventId, qrId]);

  const handleSave = async () => {
    if (!qr) return;
    const timestamp = new Date().toISOString();
    const session = {
      session_id:   `${qr.id}_${Date.now()}`,
      qrcode_id:    qr.id,
      photo_type:   qr.photo_type,
      student_ids:  qr.student_ids,
      timestamp,
      status,      // 'present' or 'absent'
    };
    await savePhotoSession(eventId, session);
    Alert.alert('Saved', `Attendance marked ${status.toUpperCase()}.`);
    navigation.goBack();
  };

  if (!qr) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Photo Details</Text>
      <Text style={styles.label}>Photo Type</Text>
      <Text style={styles.value}>{qr.photo_type}</Text>

      <Text style={styles.label}>Students</Text>
      {students.map(s => (
        <Text key={s.id} style={styles.student}>
          • {s.name} ({s.class_name})
        </Text>
      ))}

      <Text style={styles.label}>Timestamp</Text>
      <Text style={styles.value}>{new Date().toLocaleString()}</Text>

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            status === 'present' && styles.statusBtnActive
          ]}
          onPress={() => setStatus('present')}
        >
          <Text
            style={[
              styles.statusText,
              status === 'present' && styles.statusTextActive
            ]}
          >
            Present
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            status === 'absent' && styles.statusBtnActive
          ]}
          onPress={() => setStatus('absent')}
        >
          <Text
            style={[
              styles.statusText,
              status === 'absent' && styles.statusTextActive
            ]}
          >
            Absent
          </Text>
        </TouchableOpacity>
      </View>

      <Button title="Save" onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 16, backgroundColor: Colors.background },
  center:      { flex:1, justifyContent:'center', alignItems:'center' },
  header:      { fontSize:18, fontWeight:'700', color:Colors.secondary, marginBottom:12 },
  label:       { fontSize:14, fontWeight:'600', color:Colors.secondary, marginTop:12 },
  value:       { fontSize:14, color:Colors.secondary, marginBottom:8 },
  student:     { fontSize:14, color:Colors.secondary, marginLeft:8, marginBottom:4 },
  statusContainer:   { flexDirection:'row', marginVertical:16 },
  statusBtn:    {
    flex:1,
    paddingVertical:10,
    borderWidth:1,
    borderColor:Colors.secondary,
    borderRadius:6,
    marginHorizontal:4,
    alignItems:'center'
  },
  statusBtnActive:   { backgroundColor:Colors.primary, borderColor:Colors.primary },
  statusText:        { color:Colors.secondary, fontWeight:'600' },
  statusTextActive:  { color:'#fff' },
});
