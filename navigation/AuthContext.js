import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../database/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const usersRef = collection(db, 'usuarios');
          const q = query(
            usersRef,
            where('email', '==', parsedUser.email),
            where('password', '==', parsedUser.password)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            setUser(parsedUser);
          } else {
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

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
