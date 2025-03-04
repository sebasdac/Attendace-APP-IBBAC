import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AttendanceScreen from '../screens/AttendaceScreen';
import ReportStackNavigation from './ReportStackNavigation';
import AttendanceStackNavigator from './AttendanceStackNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import Home from '../screens/Home';
import KidsScreen from '../screens/KidsScreen';
import KidsAttendanceStackNavigation from './KidsAttendanceStackNavigation';
import MultiColorIcon from '../components/MultiColorIcon';


const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <>
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
              iconName = focused ? 'home' : 'home-outline';
            } 
            else if (route.name === 'Kids') {
              return <MultiColorIcon name={focused ? 'extension-puzzle' : 'extension-puzzle-outline'} size={size} focused={focused} />;
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Registro" component={AttendanceScreen} />
        <Tab.Screen name="Reportes" component={ReportStackNavigation} />
        <Tab.Screen name="Asistencia" component={AttendanceStackNavigator} />
        <Tab.Screen name="Kids" component={KidsAttendanceStackNavigation} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} />
   
      </Tab.Navigator>
    </>
  );
};

export default BottomTabs;
