import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './navigation/BottomTabs';
import BirthdayNotification from './components/BirthdayNotification';
import * as Updates from 'expo-updates'; // Importar expo-updates para manejar actualizaciones

export default function App() {
  useEffect(() => {
    // Verificar y aplicar la actualización automáticamente
    const checkForUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Descargar la actualización
          await Updates.fetchUpdateAsync();
          // Reiniciar la app para aplicar la actualización
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.error('Error checking or applying updates:', error);
      }
    };

    checkForUpdate(); // Llamar a la función cuando la app se monta
  }, []);

  return (
    <NavigationContainer>
      <BirthdayNotification />
      <BottomTabs />
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
