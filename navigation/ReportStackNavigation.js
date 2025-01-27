import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ReportScreen from '../screens/ReportScreen'
import AttendanceReport from '../screens/AttendanceReport';

const Stack = createStackNavigator();

export default function ReportStackNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportScreen" component={ReportScreen} />
      <Stack.Screen name="AttendanceReport" component={AttendanceReport} />
    
    </Stack.Navigator>
  );
}
