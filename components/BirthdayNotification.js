// BirthdayNotification.js
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { db } from '../database/firebase';
import { checkBirthdaysAndNotify } from '../services/birthdayTaskServices';




const BIRTHDAY_TASK = "check-birthdays-task";




// Definir la tarea en segundo plano
TaskManager.defineTask(BIRTHDAY_TASK, async () => {
    console.log("🔄 Ejecutando verificación de cumpleaños en background...");
    await checkBirthdaysAndNotify();
    return BackgroundFetch.Result.NewData;
});

// Asegurar que la notificación se muestre aunque la app esté cerrada
Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: true,  // Muestra la notificación en pantalla
      shouldPlaySound: true,  // Asegura que tenga sonido
      shouldSetBadge: true,   // Agrega el icono en la app
  }),
});


// Función para registrar la tarea en segundo plano
const registerBackgroundTask = async () => {
    try {
        await BackgroundFetch.registerTaskAsync(BIRTHDAY_TASK, {
            minimumInterval: 60 * 60 * 6, // Verifica cada 6 horas si es necesario ejecutar
            stopOnTerminate: false,
            startOnBoot: true,
        });
        console.log("✅ Tarea de cumpleaños registrada correctamente.");
    } catch (err) {
        console.error("❌ Error al registrar la tarea de cumpleaños:", err);
    }
};

// Programar la ejecución exacta a las 12 AM
const scheduleMidnightExecution = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0); // 12:00 AM exacto

    let timeUntilMidnight = midnight.getTime() - now.getTime();
    if (timeUntilMidnight < 0) {
        // Si ya pasó la medianoche, programa para el siguiente día
        midnight.setDate(midnight.getDate() + 1);
        timeUntilMidnight = midnight.getTime() - now.getTime();
    }

    console.log(`🕛 La verificación de cumpleaños se ejecutará en ${timeUntilMidnight / 1000 / 60} minutos`);

    setTimeout(async () => {
        console.log("🎂 Ejecutando verificación de cumpleaños a las 12 AM...");
        await checkBirthdaysAndNotify();
        scheduleMidnightExecution(); // Volver a programar para el siguiente día
    }, timeUntilMidnight);
    
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
                console.error('❌ Error al sincronizar datos:', error);
            }
        };

        syncPeopleData();
        registerBackgroundTask();
        scheduleMidnightExecution();

        return () => {
            console.log("🛑 Tarea desmontada.");
        };
    }, []);
    

    return null;
};

export default BirthdayNotification;
