import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './navigation/BottomTabs';
import BirthdayNotification from './components/BirthdayNotification';
import * as Updates from 'expo-updates'; // Importar expo-updates para manejar actualizaciones

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdateChecked, setIsUpdateChecked] = useState(false);

  useEffect(() => {
    // Verificar si hay una actualización disponible
    const checkForUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setUpdateAvailable(true);
        }
        setIsUpdateChecked(true);  // Marcar que la verificación de actualización se realizó
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkForUpdate();  // Llamar a la función cuando la app se monta
  }, []);

  return (
    <NavigationContainer>
      <BirthdayNotification />
      <BottomTabs />
      {isUpdateChecked && updateAvailable && (
        <View style={styles.container}>
          <Text style={styles.updateText}>¡Hay una actualización disponible!</Text>
        </View>
      )}
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
  updateText: {
    marginTop: 20,
    fontSize: 16,
    color: 'red',  // Cambiar el color si es necesario
  }
});
