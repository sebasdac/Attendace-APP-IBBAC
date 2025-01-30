import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../Autentication';
import BottomTabs from './BottomTabs'; // Asegurar importación correcta

const Stack = createStackNavigator();

const LoginStackNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainApp" component={BottomTabs} />
    </Stack.Navigator>
  );
};

export default LoginStackNavigation;
