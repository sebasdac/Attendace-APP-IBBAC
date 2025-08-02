import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Switch, Button, TextInput, ActivityIndicator } from 'react-native';
import { db } from '../database/firebase';
import { getDocs, collection, addDoc, query, where, updateDoc, doc, getDoc, setDoc} from 'firebase/firestore';

export default function AttendanceListScreen({ route }) {
  const { date, session } = route.params;
  const [people, setPeople] = useState([]); // Lista de adultos
  const [attendance, setAttendance] = useState({}); // Estado de asistencia
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  const updatePersonAttendanceCount = async (personId, personName, increment) => {
  try {
    const countRef = doc(db, 'attendanceCounts', personId);
    const countSnap = await getDoc(countRef);

    if (countSnap.exists()) {
      const data = countSnap.data();
      const newCount = Math.max(0, (data.count || 0) + increment);
      await updateDoc(countRef, { count: newCount });
    } else if (increment > 0) {
      await setDoc(countRef, { count: 1, name: personName });
    }
  } catch (error) {
    console.error(`Error actualizando attendanceCounts para ${personId}:`, error);
  }
};


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
    for (const personId in attendance) {
      const attendanceRef = collection(db, 'attendance');
      const attendanceQuery = query(
        attendanceRef,
        where('personId', '==', personId),
        where('date', '==', date),
        where('session', '==', session)
      );

      const existingAttendance = await getDocs(attendanceQuery);
      const isAttended = attendance[personId];

      if (existingAttendance.empty) {
        // 1. Crear nuevo registro
        await addDoc(attendanceRef, {
          personId,
          date,
          session,
          attended: isAttended,
        });

        // 2. Si asistió, actualizar el resumen
        if (isAttended) {
          await updateMonthlySummary(date);
          const person = people.find((p) => p.id === personId);
          await updatePersonAttendanceCount(personId, person?.name || "Desconocido", +1);
        }

      } else {
        // 3. Actualizar si cambia el estado
        const docSnapshot = existingAttendance.docs[0];
        const docRef = docSnapshot.ref;
        const prevAttended = docSnapshot.data().attended;

        if (prevAttended !== isAttended) {
          await updateDoc(docRef, {
            attended: isAttended,
          });

          const person = people.find((p) => p.id === personId);

          if (!prevAttended && isAttended) {
            // Asistencia marcada → aumentar resumen mensual y conteo individual
            await updateMonthlySummary(date, +1);
            await updatePersonAttendanceCount(personId, person?.name || "Desconocido", +1);
          }

          if (prevAttended && !isAttended) {
            // Asistencia desmarcada → restar resumen mensual y conteo individual
            await updateMonthlySummary(date, -1);
            await updatePersonAttendanceCount(personId, person?.name || "Desconocido", -1);
          }
        }

      }
    }

    alert('Asistencia guardada correctamente.');
  } catch (error) {
    alert('Error al guardar la asistencia.');
    console.error('Error al guardar la asistencia:', error);
  } finally {
    setLoading(false);
  }
};
const updateMonthlySummary = async (dateStr, incremento = 1) => {
  try {
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear().toString();
    const month = dateObj.toLocaleString('es-ES', { month: 'short' }).toLowerCase(); // ej: "ago"

    const summaryRef = doc(db, 'attendanceSummary', year);
    const summarySnap = await getDoc(summaryRef);

    if (summarySnap.exists()) {
      const data = summarySnap.data();
      const currentCount = data[month] || 0;
      const newCount = Math.max(0, currentCount + incremento); // evita negativos
      await updateDoc(summaryRef, {
        [month]: newCount,
      });
    } else if (incremento > 0) {
      // Solo creamos el documento si es para sumar
      await setDoc(summaryRef, {
        [month]: 1,
      });
    }
  } catch (error) {
    console.error('Error actualizando el resumen mensual:', error);
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