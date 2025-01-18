import React, { useEffect } from 'react';
import { StyleSheet, View, Button, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function NotificationTest() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Registrar permisos para notificaciones
  const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Error', 'No se pudo obtener permiso para notificaciones.');
        return;
      }
    } else {
      Alert.alert('Error', 'Las notificaciones sólo funcionan en dispositivos físicos.');
    }
  };

  // Programar una notificación de prueba
  const handleSendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 ¡Feliz Cumpleaños!',
        body: 'Hoy es el cumpleaños de [Nombre]. 🎂',
        sound: true,
      },
      trigger: { seconds: 2 }, // Notificación en 2 segundos
    });

    Alert.alert('Notificación', 'La notificación se activará en 2 segundos.');
  };

  return (
    <View style={styles.container}>
      <Button title="Enviar Notificación" onPress={handleSendNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
