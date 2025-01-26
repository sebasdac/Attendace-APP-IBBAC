import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './navigation/BottomTabs';
import BirthdayNotification from './components/BirthdayNotification';
import * as Updates from 'expo-updates';

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [bannerAnimation] = useState(new Animated.Value(-100)); // Para animar el banner

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setUpdateAvailable(true);
          // Mostrar el banner con animación
          Animated.timing(bannerAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Error checking updates:', error);
      }
    };

    checkForUpdate();
  }, []);

  const applyUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error applying update:', error);
    }
  };

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {updateAvailable && (
          <Animated.View
            style={[
              styles.updateBanner,
              { transform: [{ translateY: bannerAnimation }] },
            ]}
          >
            <Text style={styles.updateText}>¡Actualización disponible!</Text>
            <TouchableOpacity style={styles.updateButton} onPress={applyUpdate}>
              <Text style={styles.updateButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <BirthdayNotification />
        <BottomTabs />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  updateBanner: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#007bff',
    padding: 15,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop:30,
  },
  updateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  updateButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
});
