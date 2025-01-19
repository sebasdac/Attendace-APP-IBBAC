import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AttendanceReport from '../screens/AttendanceReport';
import AttendanceScreen from '../screens/AttendaceScreen';

const Stack = createStackNavigator();

export default function ReportStackNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />
      <Stack.Screen name="AttendanceReport" component={AttendanceReport} />
    
    </Stack.Navigator>
  );
}
