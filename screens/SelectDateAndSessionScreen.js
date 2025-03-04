import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Button } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker"; // Para el selector de fecha
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SelectDateAndSessionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { classRoom } = route.params; // Clase seleccionada pasada como parámetro
  const [date, setDate] = useState(new Date()); // Fecha seleccionada
  const [showDatePicker, setShowDatePicker] = useState(false); // Mostrar/ocultar el selector de fecha
  const [session, setSession] = useState(""); // Sesión seleccionada (AM/PM)

  // Función para manejar el cambio de fecha
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // Ocultar el selector de fecha
    if (selectedDate) {
      setDate(selectedDate); // Actualizar la fecha seleccionada
    }
  };

  // Función para navegar a la pantalla de asistencia
  const navigateToAttendance = () => {
    if (!session) {
      alert("Por favor, selecciona una sesión (AM/PM).");
      return;
    }
    navigation.navigate("KidsAttendanceScreen", {
      classRoom, // Clase seleccionada
      date: date.toISOString().split("T")[0], // Formato YYYY-MM-DD
      session, // Sesión seleccionada
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona la Fecha y Sesión</Text>
      <Text style={styles.subtitle}>Clase: {classRoom}</Text>

      {/* Selector de fecha */}
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.datePickerText}>
          {date.toLocaleDateString()} {/* Mostrar la fecha seleccionada */}
        </Text>
      </TouchableOpacity>

      {/* Selector de sesión (AM/PM) */}
      <View style={styles.sessionContainer}>
        <TouchableOpacity
          style={[styles.sessionButton, session === "AM" && styles.sessionButtonActive]}
          onPress={() => setSession("AM")}
        >
          <Text style={styles.sessionButtonText}>AM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionButton, session === "PM" && styles.sessionButtonActive]}
          onPress={() => setSession("PM")}
        >
          <Text style={styles.sessionButtonText}>PM</Text>
        </TouchableOpacity>
      </View>

      {/* Botón para continuar */}
      <Button
        title="Continuar"
        onPress={navigateToAttendance}
        disabled={!session} // Deshabilitar si no se ha seleccionado una sesión
      />

      {/* Selector de fecha (modal) */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  datePickerButton: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  sessionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  sessionButton: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    width: "40%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sessionButtonActive: {
    backgroundColor: "#6a11cb",
  },
  sessionButtonText: {
    fontSize: 16,
    color: "#333",
  },
});