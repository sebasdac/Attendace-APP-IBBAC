import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KidsScreen from '../screens/KidsScreen'
import RegisterKid from '../screens/RegisterKid';
import KidsAttendanceScreen from '../screens/KidsAttendanceScreen';
import SelectDateAndSessionScreen from '../screens/SelectDateAndSessionScreen';
import MonthlyAttendanceScreen from '../screens/MonthlyAttendanceScreen';
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
