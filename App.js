import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React, {useEffect} from 'react';
import BottomTabs from './navigation/BottomTabs';
import { NavigationContainer } from '@react-navigation/native';
import BirthdayNotification from './components/BirthdayNotification';
import NotificationTest from './components/NotificationTest';
import * as Notifications from 'expo-notifications';

export default function App() {

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
