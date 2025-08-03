import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform } from 'react-native';
import AttendanceScreen from '../screens/AttendaceScreen';
import ReportStackNavigation from './ReportStackNavigation';
import AttendanceStackNavigator from './AttendanceStackNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import Home from '../screens/Home';
import KidsAttendanceStackNavigation from './KidsAttendanceStackNavigation';
import MultiColorIcon from '../components/MultiColorIcon';
import { useAuth } from '../navigation/AuthContext';

const Tab = createBottomTabNavigator();

// Componente personalizado para los iconos de tab
const TabIcon = ({ name, focused, size, color, isMultiColor = false }) => {
  if (isMultiColor) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: focused ? '#6366f1' : 'transparent',
        marginTop: focused ? -4 : 0,
      }}>
        <MultiColorIcon 
          name={focused ? 'extension-puzzle' : 'extension-puzzle-outline'} 
          size={focused ? 22 : size} 
          focused={focused}
          color={focused ? '#ffffff' : color}
        />
      </View>
    );
  }

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: focused ? '#6366f1' : 'transparent',
      marginTop: focused ? -4 : 0,
    }}>
      <Ionicons 
        name={name} 
        size={focused ? 22 : size} 
        color={focused ? '#ffffff' : color} 
      />
    </View>
  );
};

// Componente personalizado para las etiquetas
const TabLabel = ({ focused, children }) => (
  <Text 
    style={{
      fontSize: focused ? 12 : 11,
      fontWeight: focused ? '600' : '500',
      color: focused ? '#6366f1' : '#64748b',
      marginTop: focused ? 4 : 2,
      textAlign: 'center',
      maxWidth: 80, // Limita el ancho máximo
    }}
    numberOfLines={1} // Solo una línea
    ellipsizeMode="tail" // Agrega "..." al final si es muy largo
    adjustsFontSizeToFit={true} // Reduce el tamaño de fuente si es necesario
    minimumFontScale={0.8} // Escala mínima (80% del tamaño original)
  >
    {children}
  </Text>
);

const BottomTabs = () => {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(null);

  useEffect(() => {
    console.log("👤 Usuario en BottomTabs:", user);
    setIsTeacher(user?.isTeacher);
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Kids') {
            return (
              <TabIcon
                isMultiColor={true}
                focused={focused}
                size={size}
                color={color}
              />
            );
          }

          if (route.name === 'Registro') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          } else if (route.name === 'Reportes') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Asistencia') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Ajustes') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          }

          return (
            <TabIcon
              name={iconName}
              focused={focused}
              size={size}
              color={color}
            />
          );
        },
        tabBarLabel: ({ focused, children }) => (
          <TabLabel focused={focused}>{children}</TabLabel>
        ),
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingHorizontal: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 16,
          marginHorizontal: 2,
          maxWidth: 90, // Limita el ancho de cada tab
          minWidth: 60, // Ancho mínimo para consistencia
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      {isTeacher ? (
        <>
          <Tab.Screen 
            name="Kids" 
            component={KidsAttendanceStackNavigation}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Niños</TabLabel>
              ),
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen 
            name="Home" 
            component={Home}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Inicio</TabLabel>
              ),
            }}
          />
          <Tab.Screen 
            name="Registro" 
            component={AttendanceScreen}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Registro</TabLabel>
              ),
            }}
          />
          <Tab.Screen 
            name="Asistencia" 
            component={AttendanceStackNavigator}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Asistencia</TabLabel>
              ),
            }}
          />
          <Tab.Screen 
            name="Reportes" 
            component={ReportStackNavigation}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Reportes</TabLabel>
              ),
            }}
          />
          <Tab.Screen 
            name="Kids" 
            component={KidsAttendanceStackNavigation}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Niños</TabLabel>
              ),
            }}
          />
          <Tab.Screen 
            name="Ajustes" 
            component={SettingsScreen}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabLabel focused={focused}>Ajustes</TabLabel>
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default BottomTabs;