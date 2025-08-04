import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KidsScreen from '../screens//kids/KidsScreen'
import RegisterKid from '../screens/kids/RegisterKid';
import KidsAttendanceScreen from '../screens/kids/KidsAttendanceScreen';
import SelectDateAndSessionScreen from '../screens/kids/SelectDateAndSessionScreen';
import MonthlyAttendanceScreen from '../screens/kids/MonthlyAttendanceScreen';
const Stack = createStackNavigator();

export default function KidsAttendanceStackNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KidsScreen" component={KidsScreen} />
      <Stack.Screen name="RegisterKid" component={RegisterKid} />
      <Stack.Screen name= "KidsAttendanceScreen" component={KidsAttendanceScreen} />
      <Stack.Screen name= "SelectDateAndSessionScreen" component={SelectDateAndSessionScreen} />
      <Stack.Screen name= "MonthlyAttendanceScreen" component={MonthlyAttendanceScreen} />

      
    </Stack.Navigator>
  );
}
