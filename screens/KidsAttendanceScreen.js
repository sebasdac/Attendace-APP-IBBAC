import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db } from "../database/firebase";
import { collection, getDocs, addDoc, query, where, updateDoc } from "firebase/firestore";

export default function KidsAttendanceScreen({ route }) {
  const { classRoom, date, session } = route.params; // Parámetros recibidos
  const [kids, setKids] = useState([]); // Lista de niños de la clase seleccionada
  const [attendance, setAttendance] = useState({}); // Estado de asistencia
  const [loading, setLoading] = useState(false);

  // Función para cargar los niños de la clase seleccionada
  const fetchKidsByClass = async () => {
    try {
      setLoading(true);

      // Obtener todos los niños
      const kidsSnapshot = await getDocs(collection(db, "kids"));
      const kidsList = kidsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrar los niños que pertenecen a la clase seleccionada
      const filteredKids = kidsList.filter((kid) =>
        kid.classes.includes(classRoom)
      );
      setKids(filteredKids);

      // Cargar la asistencia ya registrada para la fecha y sesión seleccionadas
      const attendanceSnapshot = await getDocs(
        query(
          collection(db, "attendance"),
          where("date", "==", date),
          where("session", "==", session),
          where("class", "==", classRoom)
        )
      );

      const attendanceData = {};
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceData[data.kidId] = data.attended; // Guardar el estado de asistencia por kidId
      });

      setAttendance(attendanceData); // Actualizar el estado de asistencia
    } catch (error) {
      console.error("Error al cargar niños o asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el cambio de asistencia
  const handleAttendanceChange = (id, attended) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: attended,
    }));
  };

  // Función para guardar la asistencia en Firestore
  const saveAttendance = async () => {
    if (Object.keys(attendance).length === 0) {
      Alert.alert("Error", "No hay cambios en la asistencia para guardar.");
      return;
    }

    try {
      setLoading(true);

      // Guardar la asistencia de cada niño
      for (const kidId in attendance) {
        // Verificar si ya existe un registro de asistencia para este niño, fecha y sesión
        const existingAttendanceQuery = query(
          collection(db, "attendance"),
          where("kidId", "==", kidId),
          where("date", "==", date),
          where("session", "==", session),
          where("class", "==", classRoom)
        );

        const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery);

        if (existingAttendanceSnapshot.empty) {
          // Si no existe, añadimos un nuevo documento
          await addDoc(collection(db, "attendance"), {
            kidId,
            date,
            session,
            class: classRoom,
            attended: attendance[kidId],
          });
        } else {
          // Si ya existe, actualizamos el primer documento encontrado
          const doc = existingAttendanceSnapshot.docs[0];
          const docRef = doc.ref;
          await updateDoc(docRef, {
            attended: attendance[kidId],
          });
        }
      }

      Alert.alert("Éxito", "Asistencia guardada correctamente.");
    } catch (error) {
      Alert.alert("Error", "Error al guardar la asistencia.");
      console.error("Error al guardar la asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar niños y asistencia cuando se inicia la pantalla
  useEffect(() => {
    fetchKidsByClass();
  }, [classRoom, date, session]);

  return (
    <View style={styles.container}>
      {/* Título de la pantalla */}
      <Text style={styles.title}>Pasar Lista - {classRoom}</Text>
      <Text style={styles.subtitle}>
        Fecha: {date} - Sesión: {session}
      </Text>

      {/* Lista de niños y asistencia */}
      {loading ? (
        <ActivityIndicator size="large" color="#6a11cb" />
      ) : (
        <FlatList
          data={kids}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.kidItem}>
              <Text style={styles.kidName}>{item.name}</Text>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  attendance[item.id] && styles.attendanceButtonActive,
                ]}
                onPress={() => handleAttendanceChange(item.id, !attendance[item.id])}
              >
                <Text style={styles.attendanceButtonText}>
                  {attendance[item.id] ? "Asistió" : "No Asistió"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Botón para guardar la asistencia */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveAttendance}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Asistencia</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  kidItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  kidName: {
    fontSize: 16,
    color: "#333",
  },
  attendanceButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
  },
  attendanceButtonActive: {
    backgroundColor: "#4CAF50",
  },
  attendanceButtonText: {
    fontSize: 14,
    color: "#111",
  },
  saveButton: {
    backgroundColor: "#6a11cb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
});