// BirthdayNotification.js
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db } from '../database/firebase';
import { checkBirthdaysAndNotify } from '../services/birthdayTaskServices';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BirthdayNotification = () => {
  useEffect(() => {
    const requestNotificationPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas permitir las notificaciones para recibir alertas de cumpleaños.');
      }
    };

    requestNotificationPermission();

    const syncPeopleData = async () => {
      try {
        const usersRef = collection(db, 'people');
        const querySnapshot = await getDocs(usersRef);
        const people = [];
        querySnapshot.forEach((doc) => {
          people.push(doc.data());
        });
        await AsyncStorage.setItem('people', JSON.stringify(people));
      } catch (error) {
        console.error('Error al sincronizar datos:', error);
      }
    };

    syncPeopleData();
    checkBirthdaysAndNotify(); // Llamada a la función que importa
  }, []);

  return null;
};

export default BirthdayNotification;
