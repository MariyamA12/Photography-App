// src/navigation/HomeStackNavigator.js

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import EventsScreen from "../screens/EventsScreen";
import EventDetailsScreen from "../screens/EventDetailsScreen";
import ParticipantsScreen from "../screens/ParticipantsScreen";
import AttendanceScreen from "../screens/AttendanceScreen"; // updated
import QRScanner from "../screens/QRScanner";
import StudentInfo from "../screens/StudentInfo";
import ManualCapture from "../screens/ManualCapture";
import MarkAttendance from "../screens/MarkAttendance";
import FinalReview from "../screens/FinalReview";


const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Events">
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: "Your Events" }}
      />

      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: "Event Details" }}
      />

      <Stack.Screen
        name="Participants"
        component={ParticipantsScreen}
        options={{ title: "Participants" }}
      />

      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: "Attendance" }}
      />

      <Stack.Screen
        name="QRScanner"
        component={QRScanner}
        options={{ title: "Scan QR or Manual" }}
      />

      <Stack.Screen
        name="StudentInfo"
        component={StudentInfo}
        options={{ title: "Photo Details" }}
      />

      <Stack.Screen
        name="ManualCapture"
        component={ManualCapture}
        options={{ title: "Manual Capture" }}
      />

      <Stack.Screen
        name="MarkAttendance"
        component={MarkAttendance}
        options={{ title: "Mark Attendance" }}
      />

      <Stack.Screen
        name="FinalReview"
        component={FinalReview}
        options={{ title: "Finalize Event" }}
      />
    </Stack.Navigator>
  );
}
