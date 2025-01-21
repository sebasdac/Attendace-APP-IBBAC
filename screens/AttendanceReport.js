import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../database/firebase';
import { BarChart, PieChart } from 'react-native-chart-kit';
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
        // Obtener el documento 'globalSettings' desde la colección 'config'
        const docRef = doc(db, 'config', 'globalSettings');
        const docSnapshot = await getDoc(docRef);
    
        if (!docSnapshot.exists()) {
          console.log('No se encontró el documento globalSettings');
          return;
        }
    
        const configData = docSnapshot.data();
        const initialDateStr = configData?.initialDate;
    
        if (!initialDateStr) {
          console.log('No se encontró initialDate en configuración');
          return;
        }
    
        // Parsear la fecha initialDate a formato Date (dd/mm/yyyy)
        const [day, month, year] = initialDateStr.split('/');  // Convertimos el formato dd/mm/yyyy
        const initialDate = new Date(`${year}-${month}-${day}`);  // Nueva fecha con formato yyyy-mm-dd
    
        // Obtener los registros de asistencia para la persona
        const attendanceRef = collection(db, 'attendance');
        const attendanceQuery = query(attendanceRef, where('personId', '==', personId));
        const querySnapshotAttendance = await getDocs(attendanceQuery);
    
        const records = querySnapshotAttendance.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((record) => record.attended === true);  // Filtramos solo las asistencias
    
        setAttendanceRecords(records);
    
        // Establecemos las fechas de inicio y fin para el filtro
        const today = new Date();
    
        // Si no hay fechas de filtro, usamos las predeterminadas
        const startDateToUse = startDate ? new Date(startDate) : initialDate;
        const endDateToUse = endDate ? new Date(endDate) : today;
    
        // Filtrar los registros por las fechas de inicio y fin
        filterRecords(records, startDateToUse, endDateToUse);
    
        // Calcular el total de sesiones a partir de initialDate
        calculateSessions(records, startDateToUse, endDateToUse);
    
      } catch (error) {
        console.error('Error al obtener la asistencia:', error);
      }
    };
    
    
    const filterRecords = (records, start, end) => {
      if (start && end) {
        const filtered = records.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate <= end;
        });
        
        setFilteredRecords(filtered);
        calculateSessions(filtered, start, end);
      } else {
        // Si no hay fechas definidas, simplemente mostramos todos los registros
        setFilteredRecords(records);
        calculateSessions(records);
      }
    };
    
    const calculateSessions = (records, start, end) => {
      if (!start || !end) {
        // Si no se han definido fechas, no calculamos las sesiones
        return;
      }
    
      const totalSundaysPassed = calculateTotalSundays(start, end);
      const totalSessions = totalSundaysPassed * 2;  // Ajusta según la lógica de sesiones que necesitas
      setTotalSundays(totalSessions);
    
      const attendedSessions = records.length;
      setSundayCount(attendedSessions);
    };
    
    
    
  
    fetchAttendance();
  }, [personId]);
  

  const filterRecords = (records, start, end) => {
    if (start && end) {
      const filtered = records.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
      
      setFilteredRecords(filtered);
      calculateSessions(filtered, start, end);
    } else {
      // Cuando no hay fechas definidas (se usará el rango predeterminado)
      setFilteredRecords(records);
      calculateSessions(records);
    }
  };
  
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // `month - 1` porque los meses en Date van de 0 a 11
  };
  

  const calculateSessions = (records, start, end) => {
    if (!start || !end) {
      // Si no hay fechas definidas, no calculamos las sesiones totales por ahora
      return;
    }
  
    const totalSundaysPassed = calculateTotalSundays(start, end);
    const totalSessions = totalSundaysPassed * 2;
    setTotalSundays(totalSessions);
  
    const attendedSessions = records.length;
    setSundayCount(attendedSessions);
  };
  

  const calculateTotalSundays = (start, end) => {
    let sundays = 0;
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (date.getUTCDay() === 0) {
        sundays++;
      }
    }
    return sundays;
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
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const today = new Date();
    filterRecords(attendanceRecords, startOfYear, today);
  };

  const chartData = {
    labels: ['Sesiones asistidas', 'Sesiones totales'],
    datasets: [{ data: [sundayCount, totalSundays] }],
  };

   const pieData = [
    {
      name: `Asistidas (${((sundayCount / totalSundays) * 100).toFixed(1)}%)`,
      population: sundayCount,
      color: '#4285F4', // Azul principal
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: `No asistidas (${(((totalSundays - sundayCount) / totalSundays) * 100).toFixed(1)}%)`,
      population: totalSundays - sundayCount,
      color: '#A8D0F0', // Azul claro
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte de Asistencia</Text>

      {/* Gráficos */}
      <View style={styles.chartContainer}>
      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={220}
        chartConfig={chartConfig}
        fromZero
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1} // Intervalos dinámicos según los datos
        showValuesOnTopOfBars={true} // Muestra valores directamente sobre las barras
      />


        
<PieChart
  data={pieData}
  width={Dimensions.get('window').width - 30}
  height={210}
  chartConfig={{
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    
  }}
  accessor="population"
  backgroundColor="transparent"
  center={[0, 0]}
  absolute // Números visibles dentro del gráfico
/>

      </View>

      {/* Filtros */}
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDatePicker({ type: 'start', visible: true })}
        >
          <Text style={styles.buttonText}>
            {startDate ? `Desde: ${startDate.toLocaleDateString()}` : 'Seleccionar inicio'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDatePicker({ type: 'end', visible: true })}
        >
          <Text style={styles.buttonText}>
            {endDate ? `Hasta: ${endDate.toLocaleDateString()}` : 'Seleccionar fin'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.resetButton]}
        onPress={resetFilter}
      >
        <Text style={styles.buttonText}>Restablecer Filtro</Text>
      </TouchableOpacity>

      {/* Selector de Fecha */}
      {showDatePicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Lista de Registros */}
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

const chartConfig = {
  backgroundColor: '#1e2923',
  backgroundGradientFrom: '#08130D',
  backgroundGradientTo: '#1e2923',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  barPercentage: 0.5,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', marginTop:30},
  chartContainer: { marginBottom: 20 },
  recordContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  button: { backgroundColor: '#4285F4', padding: 5, borderRadius: 5 },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  resetButton: { backgroundColor: '#f44336' },
});

export default AttendanceReport;
