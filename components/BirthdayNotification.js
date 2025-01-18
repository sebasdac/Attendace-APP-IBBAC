import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db } from '../database/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BirthdayNotification = () => {
  useEffect(() => {
    // Solicitar permisos de notificación
    const requestNotificationPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas permitir las notificaciones para recibir alertas de cumpleaños.');
      }
    };

    requestNotificationPermission();

    // Verificar los cumpleaños
    const checkBirthdays = async () => {
      try {
        const today = new Date();
        const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        const usersRef = collection(db, 'people'); // Asegúrate de que el path sea correcto.
        const querySnapshot = await getDocs(usersRef);

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          const userBirthday = userData.birthDay; // Obtenemos la fecha de cumpleaños del usuario
          
          // Extraemos el día y el mes de la fecha de cumpleaños
          const [userDay, userMonth] = userBirthday.split('/');

          // Comparamos solo el día y el mes
          if (`${userDay.padStart(2, '0')}/${userMonth.padStart(2, '0')}` === formattedToday) {
            Alert.alert('🎂 ¡Feliz Cumpleaños!', `Hoy es el cumpleaños de ${userData.name}! 🎉`);
            sendBirthdayNotification(userData.name);
          }
        });
      } catch (error) {
        console.error('Error al verificar cumpleaños:', error);
      }
    };

    checkBirthdays();
  }, []);

  const sendBirthdayNotification = async (name) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎂 ¡Feliz Cumpleaños!',
        body: `Hoy es el cumpleaños de ${name}! 🎉`,
        sound: true,
      },
      trigger: null, // Se ejecuta inmediatamente.
    });
  };

  return null;
};

export default BirthdayNotification;
