// birthdayTaskServices.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkBirthdaysAndNotify = async () => {
  try {
    const today = new Date();
    const todayDay = today.getDate().toString().padStart(2, '0');
    const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');

    console.log(`📅 Fecha actual: ${todayDay}/${todayMonth}`);

    const localData = await AsyncStorage.getItem('people');
    const people = localData ? JSON.parse(localData) : [];

    // Verificar si ya se enviaron notificaciones hoy
    const notifiedToday = await AsyncStorage.getItem('notifiedToday');
    const notifiedSet = notifiedToday ? new Set(JSON.parse(notifiedToday)) : new Set();

    let birthdayPeople = [];

    for (const person of people) {
      if (!person.birthDay) {
        console.warn(`⚠️ La persona ${person.name} no tiene fecha de cumpleaños registrada.`);
        continue;
      }

      // Extraer el día y el mes del cumpleaños
      const [userDay, userMonth] = person.birthDay.split('/').map(num => num.padStart(2, '0'));

      if (userDay === todayDay && userMonth === todayMonth) {
        if (!notifiedSet.has(person.name)) { 
          birthdayPeople.push(person.name);
          notifiedSet.add(person.name);
        } else {
          console.log(`🔄 ${person.name} ya recibió una notificación hoy.`);
        }
      }
    }

    // Enviar notificación si hay cumpleaños hoy
    if (birthdayPeople.length > 0) {
      await sendBirthdayNotification(birthdayPeople);
    }

    // Guardar los nombres de las personas a las que ya se notificó hoy
    await AsyncStorage.setItem('notifiedToday', JSON.stringify([...notifiedSet]));

    if (birthdayPeople.length === 0) {
      console.log('🎂 No hay cumpleaños hoy.');
    }
  } catch (error) {
    console.error('❌ Error al verificar cumpleaños:', error);
  }
};

// Enviar notificación con la lista de cumpleañeros
const sendBirthdayNotification = async (names) => {
  try {
    const message = names.length === 1 
      ? `Hoy es el cumpleaños de ${names[0]}! 🎉` 
      : `Hoy cumplen años: ${names.join(', ')}! 🎉`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎂 ¡Feliz Cumpleaños!',
        body: message,
        sound: true,
      },
      trigger: null, // Se envía inmediatamente si hay cumpleaños
    });

    console.log(`✅ Notificación enviada: ${message}`);
  } catch (error) {
    console.error('❌ Error al enviar la notificación:', error);
  }
};
