import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React, {useEffect} from 'react';
import BottomTabs from './navigation/BottomTabs';
import { NavigationContainer } from '@react-navigation/native';
import BirthdayNotification from './components/BirthdayNotification';
import NotificationTest from './components/NotificationTest';
import * as Notifications from 'expo-notifications';
import { checkBackgroundStatus, registerBirthdayTask } from './utils/backgroundFetch';

export default function App() {
  useEffect(() => {
    // Registrar la tarea de verificación de cumpleaños
    registerBirthdayTask();
   
  }, []);

  return (
    
    <NavigationContainer>
      <BirthdayNotification/>
      <BottomTabs/>
    </NavigationContainer>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
