import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db } from '../database/firebase';
import { collection, getDocs } from 'firebase/firestore'; // Importa las funciones correctas

export default function HistoryScreen() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        // Acceder a la colección 'people' y obtener los documentos
        const querySnapshot = await getDocs(collection(db, 'people'));

        // Mapear los datos y agregar al estado
        const peopleList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPeople(peopleList);
      } catch (error) {
        console.error('Error al cargar personas:', error);
      }
    };

    fetchPeople();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lista de Personas Registradas</Text>
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.personItem}>
            <Text>{item.name}</Text>
            <Text>{item.phone}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  personItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});
