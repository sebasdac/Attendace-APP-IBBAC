import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabs from './navigation/BottomTabs';
import BirthdayNotification from './components/BirthdayNotification';
import * as Updates from 'expo-updates';
import LoginStackNavigation from './navigation/LoginStackNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './database/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';


const Stack = createStackNavigator();

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [bannerAnimation] = useState(new Animated.Value(-100)); // Para animar el banner
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const usersRef = collection(db, 'usuarios');
          const q = query(usersRef, 
            where('email', '==', parsedUser.email), 
            where('password', '==', parsedUser.password) // Verifica también la contraseña
          );
          const querySnapshot = await getDocs(q);
  
          if (!querySnapshot.empty) {
            console.log("✅ El usuario y la contraseña son correctos.");
            setUser(parsedUser);
          } else {
            console.log("❌ Usuario o contraseña incorrectos, cerrando sesión.");
            await AsyncStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.log("⚠️ Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);
  
  const applyUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error applying update:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="BottomTabs" component={BottomTabs} />
          
          
        ) : (
          <Stack.Screen name="LoginStack" component={LoginStackNavigation} />
        )}
       
      </Stack.Navigator>
      
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
       <BirthdayNotification/>
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
