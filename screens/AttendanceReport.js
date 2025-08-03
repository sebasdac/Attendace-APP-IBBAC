import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../database/firebase';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [visibleSessions, setVisibleSessions] = useState(6); // Mostrar 6 por defecto
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({ type: null, visible: false });

  useEffect(() => {
    if (!attendanceRecords.length || !initialDate) return;
    
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
        setLoading(true);
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
        const [day, month, year] = initialDateStr.split('/');
        
        if (!day || !month || !year) {
          console.log('Formato de fecha inválido:', initialDateStr);
          return;
        }
        
        const initialDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        
        if (isNaN(initialDate.getTime())) {
          console.log('Fecha inválida al parsear:', initialDateStr);
          return;
        }

        // Guardar initialDate en el estado
        setInitialDate(initialDate);

        // Obtener los registros de asistencia para la persona
        const attendanceRef = collection(db, 'attendance');
        const attendanceQuery = query(attendanceRef, where('personId', '==', personId));
        const querySnapshotAttendance = await getDocs(attendanceQuery);

        const records = querySnapshotAttendance.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((record) => record.attended === true && record.date && record.session);  // Filtramos solo las asistencias válidas

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
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [personId]);

  const loadMoreSessions = () => {
    setVisibleSessions((prev) => prev + 6); // Aumenta el número de filas visibles
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

  const calculateSessions = (records, start, end, day = selectedDay, sessions = sessionsPerDay) => {
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
    if (!start || !end) return 0;
    
    let count = 0;
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      if (date.getUTCDay() === day) {
        count++;
      }
    }

    console.log(`Total de días calculados para ${day === 0 ? 'domingo' : 'miércoles'}:`, count);
    return count;
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
    if (!records || !Array.isArray(records)) return [];
    
    return records.filter((record) => {
      if (!record || !record.date) return false;
      
      try {
        const recordDate = new Date(record.date);
        const isCorrectDay = recordDate.getUTCDay() === day;

        // Domingo: Puede ser AM o PM; Miércoles: Solo PM
        const isCorrectSession =
          day === 0 ? ['AM', 'PM'].includes(record.session) : record.session === 'PM';

        return isCorrectDay && isCorrectSession;
      } catch (error) {
        console.error('Error al procesar fecha:', record.date, error);
        return false;
      }
    });
  };

  // Función para formatear la fecha de manera más amigable
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('es-ES', options);
    } catch (error) {
      console.error('Error al formatear fecha:', dateString, error);
      return 'Fecha inválida';
    }
  };

  // Función para obtener el emoji de la sesión
  const getSessionEmoji = (session) => {
    return session === 'AM' ? '🌅' : '🌆';
  };

  // Renderizar sesiones asistidas
  const renderSession = ({ item }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionIconContainer}>
        <Text style={styles.sessionEmoji}>
          {getSessionEmoji(item.session)}
        </Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionDate}>
          {formatDate(item.date)}
        </Text>
        <Text style={styles.sessionTime}>
          {item.session === 'AM' ? 'Mañana' : 'Tarde'}
        </Text>
      </View>
    </View>
  );

  const chartData = {
    labels: ['Asistidas', 'Totales'],
    datasets: [{ data: [sundayCount || 0, totalSundays || 1] }], // Evitar división por cero
  };

  const pieData = [
    {
      name: `Asistidas (${totalSundays > 0 ? ((sundayCount / totalSundays) * 100).toFixed(1) : 0}%)`,
      population: sundayCount || 0,
      color: '#6366f1',
      legendFontColor: '#334155',
      legendFontSize: 14,
    },
    {
      name: `No asistidas (${totalSundays > 0 ? (((totalSundays - sundayCount) / totalSundays) * 100).toFixed(1) : 0}%)`,
      population: Math.max(0, (totalSundays || 1) - (sundayCount || 0)),
      color: '#e2e8f0',
      legendFontColor: '#334155',
      legendFontSize: 14,
    },
  ];

  const attendancePercentage = totalSundays > 0 ? ((sundayCount / totalSundays) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/preloader.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loaderText}>Cargando reporte...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📊 Reporte de Asistencia</Text>
        <Text style={styles.subtitle}>Análisis detallado de participación</Text>
      </View>

      {/* Selector de días */}
      <View style={styles.selectorSection}>
        <Text style={styles.sectionTitle}>📅 Seleccionar día</Text>
        <View style={styles.daySelectorContainer}>
          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === 0 && styles.selectedDayButton
            ]}
            onPress={() => handleDaySelection(0, 2)}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === 0 && styles.selectedDayButtonText
            ]}>
              🗓️ Domingos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === 3 && styles.selectedDayButton
            ]}
            onPress={() => handleDaySelection(3, 1)}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === 3 && styles.selectedDayButtonText
            ]}>
              📆 Miércoles
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas principales */}
      <View style={styles.statsSection}>
        <View style={styles.row}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statNumber}>{sundayCount}</Text>
            <Text style={styles.statLabel}>Asistidas</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statNumber}>{totalSundays}</Text>
            <Text style={styles.statLabel}>Total posibles</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statNumber}>{attendancePercentage}%</Text>
            <Text style={styles.statLabel}>Asistencia</Text>
          </View>
        </View>
      </View>

      {/* Gráficos */}
      <View style={styles.chartsSection}>
        <Text style={styles.sectionTitle}>📊 Análisis visual</Text>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Comparativo de asistencia</Text>
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 48}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#f8fafc',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
              style: { borderRadius: 16 },
              barPercentage: 0.6,
            }}
            fromZero
            showValuesOnTopOfBars={true}
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribución porcentual</Text>
          <PieChart
            data={pieData}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#f8fafc',
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            center={[10, 0]}
            absolute
            style={styles.chart}
          />
        </View>
      </View>

      {/* Lista de sesiones asistidas */}
      <View style={styles.sessionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 Sesiones asistidas</Text>
          <Text style={styles.sessionsCount}>
            {attendedSessions.length} registros
          </Text>
        </View>

        <View style={styles.sessionsList}>
          {sessionsToDisplay.length > 0 ? (
            <FlatList
              data={sessionsToDisplay}
              keyExtractor={(item, index) => `${item.date}-${item.session}-${index}`}
              renderItem={renderSession}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateText}>No hay sesiones registradas</Text>
              <Text style={styles.emptyStateSubtext}>
                Las sesiones aparecerán cuando haya registros de asistencia
              </Text>
            </View>
          )}
        </View>

        {/* Botón "Cargar más" */}
        {visibleSessions < attendedSessions.length && (
          <TouchableOpacity onPress={loadMoreSessions} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreButtonText}>Ver más sesiones</Text>
            <Text style={styles.loadMoreIcon}>👇</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: { 
    width: 80, 
    height: 80,
  },
  loaderText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
  },
  headerContainer: {
    backgroundColor: '#6366f1',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#c7d2fe',
    opacity: 0.9,
  },
  selectorSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  daySelectorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dayButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDayButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  selectedDayButtonText: {
    color: '#ffffff',
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  chartsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  sessionsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionsCount: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionsList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  sessionIconContainer: {
    marginRight: 16,
  },
  sessionEmoji: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  sessionTime: {
    fontSize: 14,
    color: '#64748b',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  loadMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadMoreIcon: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default AttendanceReport;