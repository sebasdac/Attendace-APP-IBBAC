import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../database/firebase';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const AttendanceReport = ({ route }) => {
  const { personId } = route.params;
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sundayCount, setSundayCount] = useState(0);
  const [totalSundays, setTotalSundays] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState({ type: null, visible: false });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const attendanceRef = collection(db, 'attendance');
        const attendanceQuery = query(attendanceRef, where('personId', '==', personId));
        const querySnapshot = await getDocs(attendanceQuery);

        const records = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((record) => record.attended === true);

        setAttendanceRecords(records);
        filterRecords(records, startDate, endDate);

        const count = records.filter((record) => {
          const recordDate = new Date(record.date);
          const isSunday = recordDate.getUTCDay() === 0;
          const isSameYear = recordDate.getFullYear() === new Date().getFullYear();

          return isSunday && isSameYear;
        }).length;

        setSundayCount(count);
      } catch (error) {
        console.error('Error al obtener la asistencia:', error);
      }
    };

    const calculateTotalSundays = () => {
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31);

      let sundays = 0;
      for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getUTCDay() === 0) {
          sundays++;
        }
      }

      setTotalSundays(sundays);
    };

    fetchAttendance();
    calculateTotalSundays();
  }, [personId, startDate, endDate]);

  const filterRecords = (records, start, end) => {
    if (start && end) {
      const filtered = records.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(records);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentType = showDatePicker.type;
    setShowDatePicker({ type: null, visible: false });

    if (selectedDate) {
      if (currentType === 'start') {
        setStartDate(selectedDate);
        filterRecords(attendanceRecords, selectedDate, endDate);
      } else if (currentType === 'end') {
        setEndDate(selectedDate);
        filterRecords(attendanceRecords, startDate, selectedDate);
      }
    }
  };

  const resetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredRecords(attendanceRecords);
  };

  const chartData = {
    labels: ['Domingos Asistidos'],
    datasets: [
      {
        data: [sundayCount],
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte de asistencia</Text>

      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
            backgroundColor: '#1e2923',
            backgroundGradientFrom: '#08130D',
            backgroundGradientTo: '#1e2923',
            decimalPlaces: 0, // Sin decimales
            color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
            borderRadius: 16,
            },
            barPercentage: 0.5,
            propsForBackgroundLines: {
            strokeWidth: 1, // Ancho de las líneas de fondo
            strokeDasharray: "5", // Líneas punteadas en el fondo (opcional)
            },
            yAxis: {
            min: 0,  // Establece el valor mínimo a 0
            max: totalSundays > 0 ? totalSundays : 10,  // Establece el valor máximo según los domingos
            interval: totalSundays > 0 ? Math.max(1, Math.floor(totalSundays / 5)) : 1,  // Ajuste dinámico del intervalo
            },
        }}
        style={{
            marginVertical: 8,
            borderRadius: 16,
        }}
        fromZero={true} // Asegura que el gráfico comience desde 0
        />



      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker({ type: 'start', visible: true })}
        >
          <Text style={styles.buttonText}>
            {startDate ? `Inicio: ${startDate.toLocaleDateString()}` : 'Seleccionar inicio'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker({ type: 'end', visible: true })}
        >
          <Text style={styles.buttonText}>
            {endDate ? `Fin: ${endDate.toLocaleDateString()}` : 'Seleccionar fin'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={resetFilter}>
          <Text style={styles.buttonText}>Restablecer filtro</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordContainer}>
            <Text>Fecha: {item.date}</Text>
            <Text>Sesión: {item.session}</Text>
            <Text>Asistió: Sí</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop:30 },
  recordContainer: { marginBottom: 10, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AttendanceReport;
