import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './database/firebase';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }
      
      let userData = null;
      querySnapshot.forEach((doc) => {
        userData = { id: doc.id, ...doc.data() };
      });
      
      if (userData.password !== password) {
        Alert.alert('Error', 'Contraseña incorrecta');
        return;
      }
      
      // Guardar sesión en AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      Alert.alert('Inicio de sesión exitoso', 'Bienvenido');
      console.log(navigation)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
      
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al iniciar sesión', error);
    }
  };
  
  return (
    <View style={{ padding: 20 }}>
      <Text>Email:</Text>
      <TextInput 
        placeholder="Correo" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Text>Contraseña:</Text>
      <TextInput 
        placeholder="Contraseña" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
