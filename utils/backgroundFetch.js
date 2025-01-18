import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { checkBirthdaysAndNotify } from '../services/birthdayTaskServices';

// Agrega un log justo antes de definir la tarea para confirmar que se está ejecutando
console.log('Definiendo la tarea de cumpleaños en segundo plano...');

TaskManager.defineTask('birthdayTask', async () => {
  try {
    console.log('Comprobando cumpleaños en segundo plano...');
    await checkBirthdaysAndNotify(); // Llamar al servicio que verifica cumpleaños
  } catch (error) {
    console.error('Error en la tarea de cumpleaños:', error);
  }
});



export const registerBirthdayTask = async () => {
  try {
    console.log('Registrando tarea de cumpleaños...');
    await BackgroundFetch.registerTaskAsync('birthdayTask', {
      minimumInterval: 900, // Intervalo de 1 minuto (en segundos)
      stopOnTerminate: false, // Mantener la tarea activa incluso si la app se cierra
      startOnBoot: true, // Iniciar la tarea al reiniciar el dispositivo
    });
    console.log('Tarea registrada correctamente');
    
    // Verificar el estado de BackgroundFetch después de registrar la tarea
    checkBackgroundFetchStatus();
  } catch (error) {
    console.error('Error al registrar la tarea:', error);
  }
};

// Función para verificar el estado de BackgroundFetch
const checkBackgroundFetchStatus = async () => {
  const status = await BackgroundFetch.getStatusAsync();
  console.log('Estado de BackgroundFetch:', status);
};
