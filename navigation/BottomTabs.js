import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Importar los íconos
import AttendanceScreen from '../screens/AttendaceScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AttendanceSelectScreen from '../screens/AttendanceSelectScreen';
import AttendanceStackNavigator from './AttendanceStackNavigator'; // Asegúrate de que el StackNavigator esté en un archivo separado
import SettingsScreen from '../screens/SettingsScreen';
import AttendanceReportScreen from '../screens/ReportScreen';
import AttendanceReport from '../screens/AttendanceSelectScreen';
import ReportStackNavigation from './ReportStackNavigation';
import Home from '../screens/Home';


const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Registro') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          } else if (route.name === 'Reportes') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Asistencia'){
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Ajustes'){
            iconName = focused ? 'settings' : "settings-outline";
          } else if (route.name === 'Home') {
            iconName = focused ? 'home-outline' : 'home-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000', // Color para íconos activos
        tabBarInactiveTintColor: 'gray', // Color para íconos inactivos
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Registro" component={AttendanceScreen} />
      <Tab.Screen name="Reportes" component={ReportStackNavigation} />
      <Tab.Screen name="Asistencia" component={AttendanceStackNavigator} />
      <Tab.Screen name="Ajustes" component={SettingsScreen}/>
    </Tab.Navigator>
  );
}
