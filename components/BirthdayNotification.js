// BirthdayNotification.js
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db } from '../database/firebase';
import { checkBirthdaysAndNotify } from '../services/birthdayTaskServices';

const scheduleBirthdayCheck = async () => {
  try {
    // Cancelar cualquier notificación programada previamente
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calcular la hora exacta de las 12 AM del próximo día
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Configurar a las 12:00:00 AM

    // Programar la tarea a las 12 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎂 Verificando cumpleaños...',
        body: 'Ejecutando la verificación de cumpleaños.',
        sound: false, // No queremos que notifique, solo que dispare la verificación
      },
      trigger: {
        hour: 0, // A las 12 AM
        minute: 0,
        repeats: true, // Se repite diariamente
      },
    });

    console.log('✅ Notificación programada para verificar cumpleaños a las 12 AM diariamente.');
  } catch (error) {
    console.error('❌ Error al programar la verificación de cumpleaños:', error);
  }
};

const BirthdayNotification = () => {
  useEffect(() => {
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
    scheduleBirthdayCheck();

    // Escuchar cuando se recibe la notificación y ejecutar la verificación de cumpleaños
    const notificationListener = Notifications.addNotificationReceivedListener(async () => {
      console.log('🔔 Ejecutando verificación de cumpleaños desde la notificación...');
      await checkBirthdaysAndNotify();
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
    };
  }, []);

  return null;
};

export default BirthdayNotification;
