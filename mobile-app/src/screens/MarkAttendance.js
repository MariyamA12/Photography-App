// src/screens/MarkAttendance.js

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import sharedStyles from '../utils/styles';

export default function MarkAttendance({ navigation }) {
  return (
    <View style={sharedStyles.container}>
      <Text style={sharedStyles.title}>Attendance Screen</Text>
      <TouchableOpacity
        style={sharedStyles.button}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <Text style={sharedStyles.buttonText}>Back to QR Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}
