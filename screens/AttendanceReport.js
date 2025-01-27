import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../database/firebase';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';

const AttendanceReport = ({ route }) => {
  const { personId } = route.params;
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sundayCount, setSundayCount] = useState(0);
  const [totalSundays, setTotalSundays] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0); // 0 para domingos, 3 para miércoles
  const [sessionsPerDay, setSessionsPerDay] = useState(2); // 2 para domingos, 1 para miércoles
  const [initialDate, setInitialDate] = useState(null);
  const [attendedSessions, setAttendedSessions] = useState([]);
  const [visibleSessions, setVisibleSessions] = useState(4); // Mostrar 4 por defecto



  const [showDatePicker, setShowDatePicker] = useState({ type: null, visible: false });

  useEffect(() => {
  
    // Carga inicial para domingo
    const today = new Date();
    const startDateToUse = new Date(initialDate);
    const endDateToUse = today;
  
    // Filtra los registros iniciales para domingo (día 0)
    const filteredRecords = filterByDay(attendanceRecords, 0); // 0 = domingo
    console.log('Registros iniciales filtrados para domingo:', filteredRecords);
  
    setFilteredRecords(filteredRecords);


    const attendedSessions = filteredRecords.map((record) => ({
      date: record.date, // Fecha de la sesión
      session: record.session, // Sesión (AM o PM)
    }));
    setAttendedSessions(attendedSessions);
    
  
    // Calcula sesiones iniciales para domingo
    calculateSessions(filteredRecords, startDateToUse, endDateToUse, 0, 2); // 2 sesiones por domingo
  }, [attendanceRecords, initialDate]);
  

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

        // Guardar initialDate en el estado
        setInitialDate(initialDate);
    
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
        console.log('Configuración obtenida desde Firebase:', configData);
        console.log('Campo initialDate:', configData.initialDate);
        
    
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
      if (!start || !end) return;
    
      // Calcula el número de días totales (domingos o miércoles) entre start y end
      const totalDaysPassed = calculateTotalDays(start, end, selectedDay);
    
      // Calcula las sesiones totales en base a los días y las sesiones por día
      const totalSessions = totalDaysPassed * sessionsPerDay;
      setTotalSundays(totalSessions); // Actualiza las sesiones totales
    
      // El número de sesiones asistidas es simplemente el número de registros filtrados
      const attendedSessions = records.length;
      setSundayCount(attendedSessions); // Actualiza las sesiones asistidas
    
      console.log('Sesiones totales:', totalSessions);
      console.log('Sesiones asistidas:', attendedSessions);
    };
    
    
    
    
  
    fetchAttendance();
  }, [personId]);
  
  const loadMoreSessions = () => {
    setVisibleSessions((prev) => prev + 4); // Aumenta el número de filas visibles
  };
  const sessionsToDisplay = attendedSessions.slice(0, visibleSessions);

  
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
    return new Date(year, month - 1, day); // Convierte el formato dd/mm/aaaa a Date
  };
  

  const calculateSessions = (records, start, end, day, sessions) => {
    if (!start || !end) return;
  
    // Calcula los días totales según el día proporcionado
    const totalDaysPassed = calculateTotalDays(start, end, day);
  
    // Calcula las sesiones totales basadas en los días y las sesiones proporcionadas
    const totalSessions = totalDaysPassed * sessions;
  
    // Calcula las asistencias basadas en los registros filtrados
    const attendedSessions = records.length;
  
    setTotalSundays(totalSessions);
    setSundayCount(attendedSessions);
  
    console.log(
      `Cálculo actualizado: Total de días: ${totalDaysPassed}, Sesiones totales: ${totalSessions}, Sesiones asistidas: ${attendedSessions}`
    );
  };
  
  
  
  
  const calculateTotalDays = (start, end, day) => {
    let count = 0;
  
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (date.getUTCDay() === day) {
        count++;
      }
    }
  
    console.log(`Total de días calculados para ${day === 0 ? 'domingo' : 'miércoles'}:`, count);
    return count;
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

  const handleDaySelection = (day, sessions) => {
    if (!initialDate) {
      console.error('initialDate no está disponible.');
      return;
    }
  
    // Actualiza el día seleccionado y las sesiones por día
    setSelectedDay(day);
    setSessionsPerDay(sessions);
  
    const today = new Date();
    const startDateToUse = new Date(initialDate);
    const endDateToUse = today;
  
    // Filtra los registros según el día seleccionado
    const filteredRecords = filterByDay(attendanceRecords, day);
    console.log(`Registros filtrados para ${day === 0 ? 'domingo' : 'miércoles'}:`, filteredRecords);
    setFilteredRecords(filteredRecords);
  
    // Calcula y guarda las sesiones asistidas
    const attendedSessions = filteredRecords.map((record) => ({
      date: record.date,
      session: record.session,
    }));
    setAttendedSessions(attendedSessions);
  
    // Calcula las sesiones totales y asistidas
    calculateSessions(filteredRecords, startDateToUse, endDateToUse, day, sessions);
  };
  
  
  
  
  
  
  
  

  const filterByDay = (records, day) => {
    return records.filter((record) => {
      const recordDate = new Date(record.date);
      const isCorrectDay = recordDate.getUTCDay() === day;
  
      // Domingo: Puede ser AM o PM; Miércoles: Solo PM
      const isCorrectSession =
        day === 0 ? ['AM', 'PM'].includes(record.session) : record.session === 'PM';
  
      return isCorrectDay && isCorrectSession;
    });
  };
  
  
  
  const resetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const today = new Date();
    filterRecords(attendanceRecords, startOfYear, today);
  };

  console.log('Datos para el gráfico:', {
    asistidas: sundayCount,
    totales: totalSundays,
  });
  //remderizar sesiones asistidas
  const renderSession = ({ item }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Icon
        name={item.session === 'AM' ? 'weather-sunny' : 'weather-night'}
        size={24}
        color={item.session === 'AM' ? '#FFD700' : '#4B0082'}
        style={{ marginRight: 10 }}
      />
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
          {`Fecha: ${item.date}`}
        </Text>
        <Text style={{ fontSize: 16, color: '#666' }}>{`Sesión: ${
          item.session === 'AM' ? 'Mañana' : 'Tarde'
        }`}</Text>
      </View>
    </View>
  );
  
  <FlatList
    data={attendedSessions}
    keyExtractor={(item, index) => `${item.date}-${item.session}-${index}`}
    renderItem={renderSession}
  />
  

  const chartData = {
    labels: ['Sesiones asistidas', 'Sesiones totales'],
    datasets: [{ data: [sundayCount, totalSundays] }],
  };

    const pieData = [
      {
        name: `Asistidas (${((sundayCount / totalSundays) * 100).toFixed(1)}%)`,
        population: sundayCount,
        color: '#333333', // Cambiado a negro
        legendFontColor: '#000', // Texto de la leyenda en negro
        legendFontSize: 12,
      },
      {
        name: `No asistidas (${(((totalSundays - sundayCount) / totalSundays) * 100).toFixed(1)}%)`,
        population: totalSundays - sundayCount,
        color: '#CCCCCC', // Cambiado a gris claro
        legendFontColor: '#000', // Texto de la leyenda en negro
        legendFontSize: 12,
      },
    ];
  
  
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 16, marginTop:30 }}>
              Reportes
            </Text>
  
      {/* Botones para seleccionar días */}
      <View style={styles.daySelectorContainer}>
        <TouchableOpacity
          style={[styles.button, selectedDay === 0 && styles.selectedButton]} // Botón activo
          onPress={() => handleDaySelection(0, 2)} // Domingos (2 sesiones)
        >
          <Text style={styles.buttonText}>Domingos</Text>
        </TouchableOpacity>
  
        <TouchableOpacity
          style={[styles.button, selectedDay === 3 && styles.selectedButton]} // Botón activo
          onPress={() => handleDaySelection(3, 1)} // Miércoles (1 sesión)
        >
          <Text style={styles.buttonText}>Miércoles</Text>
        </TouchableOpacity>
      </View>
  
      {/* Gráficos */}
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars={true}
          style={styles.chartStyle}
        />
  
        <PieChart
        data={pieData}
        width={Dimensions.get('window').width - 40}
        height={210}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color negro
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Etiquetas en negro
        }}
        accessor="population"
        backgroundColor="transparent"
        center={[0, 0]}
        absolute
        style={styles.chartStyle}
      />

      </View>
  
      {/* Lista de sesiones asistidas */}
      <ScrollView>
        <View style={styles.sessionListContainer}>
          <Text style={styles.sessionTitle}>Sesiones Asistidas:</Text>
          <FlatList
            data={attendedSessions}
            keyExtractor={(item, index) => `${item.date}-${item.session}-${index}`}
            renderItem={renderSession}
          />
        </View>
      </ScrollView>
  
      {/* Botón "Cargar más" */}
      {visibleSessions < attendedSessions.length && (
        <TouchableOpacity onPress={loadMoreSessions} style={styles.loadMoreButton}>
          <Text style={styles.loadMoreButtonText}>Cargar más</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  
  
};

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#f5f5f5',
  backgroundGradientTo: '#f5f5f5',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 8 },
  barPercentage: 0.5,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000',
  },
  daySelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    opacity: 0.5,
  },
  button: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartStyle: {
    borderRadius: 8,
    marginVertical: 8,
  },
  sessionListContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  loadMoreButton: {
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  loadMoreButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});



export default AttendanceReport;
