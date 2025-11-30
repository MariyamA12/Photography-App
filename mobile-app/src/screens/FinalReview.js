// src/screens/FinalReview.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Colors from '../utils/colors';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { saveEvent, loadEvent } from '../utils/offlineStorage';
import {
  loadStudents,
  loadPhotoSessions,
  loadQRCodes,
  savePhotoSession,
} from '../utils/offlineStorage';

const STATUSES = ['absent', 'missed', 'refused'];

export default function FinalReview() {
  const { params } = useRoute();
  const { eventId } = params;
  const navigation = useNavigation();

  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const computeUnphotographed = (students, sessions, qrs) => {
  
  const studentToQr = new Map();
  (qrs || []).forEach(qr => {
    (qr.students || []).forEach(stu => {
      if (stu?.id != null) studentToQr.set(String(stu.id), qr.id);
    });
  });

  // A) Students who already have a QR-linked session (any status) are accounted
  const hasQrSession = new Set();
  (sessions || []).forEach(s => {
    if (s.qrcode_id != null) {
      (s.student_ids || []).forEach(id => {
        hasQrSession.add(String(id));
      });
    }
  });

  // B) Manual present INDIVIDUAL counts as photographed; others don't
  const hasManualPresentIndividual = new Set();
  (sessions || []).forEach(s => {
    if (s.qrcode_id == null && s.status === 'present' && s.photo_type === 'individual') {
      (s.student_ids || []).forEach(id => {
        hasManualPresentIndividual.add(String(id));
      });
    }
  });

  return (students || [])
    .filter(stu => {
      const sid = String(stu.id);
      // exclude if QR-linked session exists OR manual present individual exists
      if (hasQrSession.has(sid)) return false;
      if (hasManualPresentIndividual.has(sid)) return false;
      return true; 
    })
    .map(stu => ({
      studentId: stu.id,
      name: stu.name,
      className: stu.class_name || '',
      qrcodeId: studentToQr.get(String(stu.id)) ?? null,
      status: null,
    }));
  };


  const loadRows = async () => {
    setLoading(true);
    const [students, sessions, qrs] = await Promise.all([
      loadStudents(eventId),
      loadPhotoSessions(eventId),
      loadQRCodes(eventId),
    ]);
    const list = computeUnphotographed(students, sessions, qrs);
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
  }, [eventId]);

  const allChosen = useMemo(() => rows.length > 0 && rows.every(r => r.status), [rows]);

  const setStatus = (studentId, status) =>
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));

  const bulkSet = (status) => setRows(prev => prev.map(r => ({ ...r, status })));

  const onConfirm = async () => {
    const now = new Date().toISOString();

    
    const sessions = await loadPhotoSessions(eventId);

    
    const byStudent = new Map();
    sessions.forEach(s => {
      (s.student_ids || []).forEach(id => {
        const key = String(id);
        const arr = byStudent.get(key) || [];
        arr.push(s);
        byStudent.set(key, arr);
      });
    });
    for (const [key, arr] of byStudent) {
      arr.sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }

   
    const qrs = await loadQRCodes(eventId);
    const qrPhotoType = new Map(qrs.map(qr => [qr.id, qr.photo_type]));

    // Upsert one status session per student, with a non-null photo_type
    for (const r of rows) {
      const sid      = String(r.studentId);
      const existing = (byStudent.get(sid) || [])[0];
      const qrId     = r.qrcodeId ?? existing?.qrcode_id ?? null;

      const photoType =
        existing?.photo_type ??
        (qrId != null ? qrPhotoType.get(qrId) : null) ??
        'individual'; // fallback

      await savePhotoSession(eventId, {
        session_id:  existing ? existing.session_id : `abs_${r.studentId}`,
        qrcode_id:   qrId,
        photo_type:  photoType,
        student_ids: [r.studentId],
        timestamp:   now,
        status:      r.status,  // 'absent' | 'missed' | 'refused'
      });
    }

    await loadRows();

    const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status]||0)+1; return acc; }, {});
    Alert.alert(
      'Event Completed',
      `Unphotographed marked: ${rows.length}\nAbsent ${counts.absent||0}, Missed ${counts.missed||0}, Refused ${counts.refused||0}`
    );

    // NEW: mark event finished
    try {
      await api.patch(`/photographer/events/${eventId}/finish`);
      const cached = await loadEvent(eventId);
      if (cached) await saveEvent({ ...cached, is_finished: true });
    } catch (e) {
      console.warn('Finish event failed:', e?.message);
    }

    navigation.goBack();
  };

  const Chip = ({ active, label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: Colors.primary, backgroundColor: active ? Colors.primary : 'transparent' }
      ]}
    >
      <Text style={{ color: active ? Colors.white : Colors.primary }}>{label}</Text>
    </TouchableOpacity>
  );

  const Row = ({ item }) => (
    <View style={styles.card}>
      <View style={{ marginBottom: 6 }}>
        <Text style={styles.name}>{item.name}</Text>
        {!!item.className && <Text style={styles.sub}>Class {item.className}</Text>}
      </View>
      <View style={styles.chipsWrap}>
        <Chip active={item.status==='absent'}  label="Absent"  onPress={()=>setStatus(item.studentId,'absent')} />
        <Chip active={item.status==='missed'}  label="Missed"  onPress={()=>setStatus(item.studentId,'missed')} />
        <Chip active={item.status==='refused'} label="Refused" onPress={()=>setStatus(item.studentId,'refused')} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finalize Event</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading…' : `Unphotographed: ${rows.length}. Pick a status for each.`}
        </Text>
        {!loading && rows.length > 0 && (
          <View style={styles.bulkRow}>
            <TouchableOpacity onPress={()=>bulkSet('absent')}  style={styles.bulkBtn}>
              <Text style={styles.bulkTxt}>Mark all Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>bulkSet('missed')}  style={styles.bulkBtn}>
              <Text style={styles.bulkTxt}>Mark all Missed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(i)=>String(i.studentId)}
        renderItem={Row}
        contentContainerStyle={{ padding:16, paddingBottom:100 }}
        ListEmptyComponent={!loading && <Text style={styles.empty}>Everyone’s covered. Great job! </Text>}
      />

      <View style={styles.footer}>
        <Button
          title="Confirm & Complete"
          onPress={onConfirm}
          variant="primary"
          size="large"
          fullWidth
          disabled={loading || !allChosen || rows.length===0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor: Colors.background },
  header:{ paddingHorizontal:16, paddingTop:16 },
  title:{ fontSize:22, fontWeight:'700', color: Colors.textPrimary },
  subtitle:{ marginTop:4, color: Colors.textTertiary },
  bulkRow:{ flexDirection:'row', gap:12, marginTop:12 },
  bulkBtn:{ backgroundColor:'#F3F3F7', paddingVertical:8, paddingHorizontal:12, borderRadius:20 },
  bulkTxt:{ color: Colors.textSecondary, fontWeight:'500' },
  card:{
    backgroundColor: Colors.card, borderRadius:12, padding:16, marginBottom:12,
    elevation:1, shadowColor: Colors.shadow, shadowOpacity:0.1, shadowOffset:{width:0,height:1}
  },
  name:{ fontSize:16, fontWeight:'700', color: Colors.textSecondary },
  sub:{ color: Colors.textTertiary, marginTop:2 },
  chipsWrap:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:6 },
  chip:{ paddingVertical:8, paddingHorizontal:12, borderRadius:20, borderWidth:1 },
  empty:{ textAlign:'center', marginTop:40, color: Colors.textSecondary },
  footer:{ position:'absolute', left:16, right:16, bottom:16 },
});
