import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AttendanceSelectScreen from '../screens/AttendanceSelectScreen';
import AttendanceListScreen from '../screens/AttendanceListScreen';

const Stack = createStackNavigator();

export default function AttendanceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttendanceSelect" component={AttendanceSelectScreen} />
      <Stack.Screen name="AttendanceListScreen" component={AttendanceListScreen} />
    </Stack.Navigator>
  );
}
