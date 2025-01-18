// birthdayTaskServices.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkBirthdaysAndNotify = async () => {
  try {
    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    const localData = await AsyncStorage.getItem('people');
    const people = localData ? JSON.parse(localData) : [];

    people.forEach((person) => {
      const [userDay, userMonth] = person.birthDay.split('/');
      if (`${userDay.padStart(2, '0')}/${userMonth.padStart(2, '0')}` === formattedToday) {
        sendBirthdayNotification(person.name);
      }
    });
  } catch (error) {
    console.error('Error al verificar cumpleaños localmente:', error);
  }
};

const sendBirthdayNotification = async (name) => {
  try {
    //const todayKey = `notified-${name}-${new Date().toDateString()}`;
    //const alreadyNotified = await AsyncStorage.getItem(todayKey);
    //if (alreadyNotified) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎂 ¡Feliz Cumpleaños!',
        body: `Hoy es el cumpleaños de ${name}! 🎉`,
        sound: true,
      },
      trigger: null,
    });

    //await AsyncStorage.setItem(todayKey, 'true');
    console.log(`Notificación enviada para ${name}`);
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
  }
};
