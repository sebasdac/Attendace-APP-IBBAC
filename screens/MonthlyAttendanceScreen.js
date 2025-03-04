import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { db } from "../database/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";

const MonthlyAttendanceScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]); // Lista de clases
  const [selectedClass, setSelectedClass] = useState(""); // Clase seleccionada
  const [selectedMonth, setSelectedMonth] = useState(""); // Mes seleccionado
  const [sundays, setSundays] = useState([]); // Lista de domingos del mes
  const [selectedSunday, setSelectedSunday] = useState(""); // Domingo seleccionado
  const [selectedSession, setSelectedSession] = useState(""); // Sesión seleccionada (AM o PM)
  const [attendance, setAttendance] = useState([]); // Asistencia mensual
  const [loading, setLoading] = useState(false); // Estado de carga
  const [showClassModal, setShowClassModal] = useState(false); // Modal para seleccionar clase
  const [showMonthModal, setShowMonthModal] = useState(false); // Modal para seleccionar mes
  const [showSundayModal, setShowSundayModal] = useState(false); // Modal para seleccionar domingo
  const [showSessionModal, setShowSessionModal] = useState(false); // Modal para seleccionar sesión
  const [kids, setKids] = useState({}); // Mapa de niños (id -> nombre)

  // Meses del año
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  // Cargar las clases al iniciar la pantalla
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "classes"));
        const classesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classesList);
      } catch (error) {
        console.error("Error al cargar clases:", error);
      }
    };

    fetchClasses();
  }, []);

  // Cargar los nombres de los niños
  useEffect(() => {
    const fetchKids = async () => {
      try {
        const snapshot = await getDocs(collection(db, "kids"));
        const kidsMap = {};
        snapshot.docs.forEach((doc) => {
          const kidData = doc.data();
          if (kidData.name) { // Asegurarse de que el campo "name" existe
            kidsMap[doc.id] = kidData.name; // Guardar el nombre del niño usando su ID como clave
          }
        });
        setKids(kidsMap);
      } catch (error) {
        console.error("Error al cargar los niños:", error);
        Alert.alert("Error", "No se pudieron cargar los nombres de los niños.");
      }
    };

    fetchKids();
  }, []);

  // Función para obtener los domingos del mes seleccionado
  const getSundaysInMonth = (monthIndex) => {
    const year = new Date().getFullYear();
    const sundays = [];
    const date = new Date(year, monthIndex, 1); // Primer día del mes

    // Avanzar al primer domingo del mes
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }

    // Recorrer todos los domingos del mes
    while (date.getMonth() === monthIndex) {
      sundays.push(new Date(date)); // Agregar el domingo a la lista
      date.setDate(date.getDate() + 7); // Avanzar al siguiente domingo
    }

    return sundays;
  };

  // Función para cargar la asistencia
  const fetchAttendance = async () => {
    if (!selectedClass || !selectedSunday || !selectedSession) {
      Alert.alert("Error", "Por favor, selecciona una clase, un domingo y una sesión.");
      return;
    }

    setLoading(true);
    try {
      // Formatear la fecha del domingo seleccionado (YYYY-MM-DD)
      const formattedDate = selectedSunday.toISOString().split("T")[0];

      // Consultar la asistencia en Firestore
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("class", "==", selectedClass),
        where("date", "==", formattedDate),
        where("session", "==", selectedSession)
      );

      const snapshot = await getDocs(attendanceQuery);
      const attendanceData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error al cargar la asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar los domingos cuando se selecciona un mes
  useEffect(() => {
    if (selectedMonth) {
      const monthIndex = months.indexOf(selectedMonth);
      const sundaysInMonth = getSundaysInMonth(monthIndex);
      setSundays(sundaysInMonth);
    }
  }, [selectedMonth]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Asistencia Mensual</Text>

      {/* Selector de clase */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowClassModal(true)}
      >
        <Text style={styles.selectorButtonText}>
          {selectedClass || "Selecciona una clase"}
        </Text>
      </TouchableOpacity>

      {/* Selector de mes */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowMonthModal(true)}
      >
        <Text style={styles.selectorButtonText}>
          {selectedMonth || "Selecciona un mes"}
        </Text>
      </TouchableOpacity>

      {/* Selector de domingo */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowSundayModal(true)}
        disabled={!selectedMonth}
      >
        <Text style={styles.selectorButtonText}>
          {selectedSunday ? selectedSunday.toLocaleDateString() : "Selecciona un domingo"}
        </Text>
      </TouchableOpacity>

      {/* Selector de sesión */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowSessionModal(true)}
        disabled={!selectedSunday}
      >
        <Text style={styles.selectorButtonText}>
          {selectedSession || "Selecciona una sesión"}
        </Text>
      </TouchableOpacity>

      {/* Botón para cargar la asistencia */}
      <TouchableOpacity
        style={styles.button}
        onPress={fetchAttendance}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Cargar Asistencia</Text>
        )}
      </TouchableOpacity>

      {/* Lista de asistencia */}
      {attendance.length > 0 ? (
        <FlatList
          data={attendance}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const kidName = kids[item.kidId]; // Obtener el nombre del niño
            return (
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceName}>
                  {kidName || "Niño no encontrado"}
                </Text>
                <Text style={styles.attendanceDate}>{item.date}</Text>
                <Text style={styles.attendanceSession}>Sesión: {item.session}</Text>
                <Text style={styles.attendanceStatus}>
                  {item.attended ? "Asistió" : "No asistió"}
                </Text>
              </View>
            );
          }}
        />
      ) : (
        <Text style={styles.noDataText}>No hay datos de asistencia para esta sesión.</Text>
      )}

      {/* Modal para seleccionar clase */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowClassModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona una Clase</Text>
          <ScrollView>
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedClass(classItem.name);
                  setShowClassModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{classItem.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para seleccionar mes */}
      <Modal
        visible={showMonthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMonthModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona un Mes</Text>
          <ScrollView>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedMonth(month);
                  setShowMonthModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para seleccionar domingo */}
      <Modal
        visible={showSundayModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSundayModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSundayModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona un Domingo</Text>
          <ScrollView>
            {sundays.map((sunday, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSunday(sunday);
                  setShowSundayModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {sunday.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para seleccionar sesión */}
      <Modal
        visible={showSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSessionModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecciona una Sesión</Text>
          <ScrollView>
            {["AM", "PM"].map((session, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSession(session);
                  setShowSessionModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{session}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  selectorButton: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  selectorButtonText: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#6a11cb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  attendanceItem: {
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
  attendanceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  attendanceDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  attendanceSession: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  attendanceStatus: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: "auto",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default MonthlyAttendanceScreen;