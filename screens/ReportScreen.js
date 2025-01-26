import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { BarChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker"; // Instala con `expo install @react-native-community/datetimepicker`
import { db } from '../database/firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const AnalyticsScreen = () => {
  const [attendanceCounts, setAttendanceCounts] = useState({ AM: 0, PM: 0 }); // Asistencias por sesión
  const [selectedDate, setSelectedDate] = useState(new Date()); // Fecha seleccionada
  const [showDatePicker, setShowDatePicker] = useState(false); // Mostrar selector de fecha

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      let q = collection(db, "attendance");

      // Filtrar por la fecha seleccionada
      const dateString = selectedDate.toISOString().split("T")[0];
      q = query(q, where("date", "==", dateString));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("No se encontraron datos para la fecha seleccionada.");
        setAttendanceCounts({ AM: 0, PM: 0 });
        return;
      }

      // Contar asistencias por sesión
      let amCount = 0;
      let pmCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.session === "AM") amCount++;
        if (data.session === "PM") pmCount++;
      });

      setAttendanceCounts({ AM: amCount, PM: pmCount });
    } catch (error) {
      console.error("Error al obtener los datos de Firestore: ", error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setSelectedDate(selectedDate);
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      {/* Encabezado */}
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 16 }}>
        Analytics
      </Text>

      {/* Selección de Fecha */}
      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
          <Text style={styles.dateText}>
            Fecha: {selectedDate.toISOString().split("T")[0]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mostrar el selector de fecha */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Tarjetas de estadísticas */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total AM Attendance</Text>
          <Text style={styles.statValue}>{attendanceCounts.AM}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total PM Attendance</Text>
          <Text style={styles.statValue}>{attendanceCounts.PM}</Text>
        </View>
      </View>

      {/* Gráfico de Barras */}
      <BarChart
        data={{
          labels: ["AM", "PM"], // Etiquetas del gráfico
          datasets: [
            {
              data: [attendanceCounts.AM, attendanceCounts.PM], // Cantidades de asistencia
            },
          ],
        }}
        width={Dimensions.get("window").width - 32}
        height={220}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#f5f5f5",
          backgroundGradientTo: "#f5f5f5",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color negro para las barras
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color negro para las etiquetas
          propsForBackgroundLines: {
            stroke: "#e3e3e3", // Líneas de fondo en gris claro
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 8,
        }}
        fromZero // Las barras comienzan desde 0
        showValuesOnTopOfBars // Mostrar los valores en la parte superior de las barras
      />
    </ScrollView>
  );
};

const styles = {
  datePicker: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statTitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
};

export default AnalyticsScreen;
