// src/navigation/AppStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen    from '../screens/EventsScreen';
import QRScanner       from '../screens/QRScanner';
import StudentInfo     from '../screens/StudentInfo';
import MarkAttendance  from '../screens/MarkAttendance';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Events">
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: 'Your Events' }}
      />
      <Stack.Screen name="QRScanner"       component={QRScanner} />
      <Stack.Screen name="StudentInfo"     component={StudentInfo} />
      <Stack.Screen name="MarkAttendance"  component={MarkAttendance} />
    </Stack.Navigator>
  );
}
