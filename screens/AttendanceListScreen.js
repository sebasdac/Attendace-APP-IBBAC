import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Switch, Button, TextInput, ActivityIndicator } from 'react-native';
import { db } from '../database/firebase';
import { getDocs, collection, addDoc, query, where, updateDoc } from 'firebase/firestore';

export default function AttendanceListScreen({ route }) {
  const { date, session } = route.params;
  const [people, setPeople] = useState([]); // Lista de adultos
  const [attendance, setAttendance] = useState({}); // Estado de asistencia
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para cargar personas (adultos) desde Firestore
  const fetchPeople = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'people'));
      const peopleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar por nombre en orden alfabético
      const sortedPeople = peopleList.sort((a, b) => a.name.localeCompare(b.name));
      setPeople(sortedPeople);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    }
  };

  // Función para verificar la asistencia de las personas ya registradas en esa fecha y sesión
  const fetchAttendance = async () => {
    try {
      const attendanceSnapshot = await getDocs(
        query(collection(db, 'attendance'), where('date', '==', date), where('session', '==', session))
      );

      const attendanceData = {};
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceData[data.personId] = data.attended;
      });

      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error al cargar la asistencia:', error);
    }
  };

  useEffect(() => {
    fetchPeople();
    fetchAttendance();
  }, []);

  // Manejo del cambio de asistencia (sin guardar en Firestore todavía)
  const handleAttendanceChange = (id, attended) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: attended,
    }));
  };

  // Función para guardar la asistencia en Firestore
  const handleSaveAttendance = async () => {
    setLoading(true);

    try {
      // Guardamos o actualizamos la asistencia de cada persona
      for (const personId in attendance) {
        const attendanceRef = collection(db, 'attendance');
        const attendanceQuery = query(
          attendanceRef,
          where('personId', '==', personId),
          where('date', '==', date),
          where('session', '==', session)
        );

        const existingAttendance = await getDocs(attendanceQuery);

        if (existingAttendance.empty) {
          // Si no existe, añadimos un nuevo documento
          await addDoc(attendanceRef, {
            personId,
            date,
            session,
            attended: attendance[personId],
          });
        } else {
          // Si ya existe, actualizamos el primer documento encontrado
          const doc = existingAttendance.docs[0];
          const docRef = doc.ref;

          if (doc.data().attended !== attendance[personId]) {
            await updateDoc(docRef, {
              attended: attendance[personId],
            });
          }
        }
      }
      alert('Asistencia guardada correctamente.');
    } catch (error) {
      alert('Error al guardar la asistencia.');
      console.error("Error al guardar la asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para normalizar texto (elimina tildes y convierte a minúsculas)
  const normalizeText = (text) => {
    return text
      .normalize('NFD') // Descompone caracteres con tildes
      .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, etc.)
      .toLowerCase(); // Convierte a minúsculas
  };

  // Filtrar personas según el texto de búsqueda
  const filteredPeople = people.filter((person) =>
    normalizeText(person.name).includes(normalizeText(searchText))
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Asistencia - {date} ({session})
      </Text>

      {/* Campo de búsqueda */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre"
        value={searchText}
        onChangeText={(text) => setSearchText(text)}
      />

      {/* Lista de personas con la opción de asistencia */}
      <FlatList
        data={filteredPeople}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.personItem}>
            <Text style={styles.personName}>{item.name}</Text>
            <Switch
              value={attendance[item.id] || false}
              onValueChange={(value) => handleAttendanceChange(item.id, value)}
              thumbColor={attendance[item.id] ? '#4CAF50' : '#FF5722'}
              trackColor={{ false: '#f0f0f0', true: '#a5d6a7' }}
            />
            <Text style={styles.attendanceStatus}>
              {attendance[item.id] ? 'Asistió' : 'No asistió'}
            </Text>
          </View>
        )}
      />

      {/* Botón para guardar la asistencia o indicador de carga */}
      <View style={styles.saveButtonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <Button title="Guardar Asistencia" onPress={handleSaveAttendance} color="#007bff" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 16,
    backgroundColor: '#f4f7f6',
  },
  header: {
    fontSize: 24,
    marginTop: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingLeft: 10,
    fontSize: 16,
  },
  personItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  personName: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  attendanceStatus: {
    fontSize: 16,
    color: '#777',
  },
  saveButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});