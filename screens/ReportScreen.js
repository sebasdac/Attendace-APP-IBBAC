import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, TextInput, Alert } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from '../database/firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { generateDailyReportPDF } from '../utils/pdfGenerator'; // Importar la función PDF

const AnalyticsScreen = () => {
  const [attendanceCounts, setAttendanceCounts] = useState({
    AM: { kids: 0, adults: 0 },
    PM: { kids: 0, adults: 0 },
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false); 
  const [dataLoaded, setDataLoaded] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false); // Estado para la generación de PDF

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      let q = collection(db, "attendance");

      const localDate = new Date(selectedDate.getTime() + Math.abs(selectedDate.getTimezoneOffset() * 60000));
      const dateString = localDate.toISOString().split("T")[0];

      q = query(q, where("date", "==", dateString));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setAttendanceCounts({
          AM: { kids: 0, adults: 0 },
          PM: { kids: 0, adults: 0 },
        });
        return;
      }

      let counts = {
        AM: { kids: 0, adults: 0 },
        PM: { kids: 0, adults: 0 },
      };

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.attended) {
          const session = data.session || "AM";

          const isKid = data.kidId && data.class;
          const isAdult = !data.kidId && !data.class;

          if (session === "AM" || session === "PM") {
            if (isKid) counts[session].kids += 1;
            else if (isAdult) counts[session].adults += 1;
          }
        }
      });

      setAttendanceCounts(counts);
    } catch (error) {
      console.error("Error al obtener los datos de Firestore: ", error);
    }
  };

  // Función para generar el PDF del reporte diario
  const handleGeneratePDF = async () => {
    if (generatingPDF) return;
    
    setGeneratingPDF(true);
    
    try {
      const totalAM = attendanceCounts.AM.kids + attendanceCounts.AM.adults;
      const totalPM = attendanceCounts.PM.kids + attendanceCounts.PM.adults;
      const totalDay = totalAM + totalPM;
      
      const reportData = {
        date: selectedDate,
        attendanceCounts,
        totalAM,
        totalPM,
        totalDay
      };
      
      await generateDailyReportPDF(reportData);
    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleViewAttendance = (personId) => {
    navigation.navigate('AttendanceReport', { personId });
  };
  
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      const localDate = new Date(date.setHours(0, 0, 0, 0));
      setSelectedDate(localDate);
    }
  };

  const fetchPeople = async () => {
    setLoadingPeople(true);
    try {
      const snapshot = await getDocs(collection(db, 'people'));
      const peopleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPeople(peopleList);
      setFilteredPeople(peopleList);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoadingPeople(false);
    }
  };

  const normalizeText = (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const filterByName = (text) => {
    setSearch(text);
    const filtered = people.filter((person) =>
      normalizeText(person.name).includes(normalizeText(text))
    );
    setFilteredPeople(filtered);
  };

  // Función para formatear la fecha de manera más amigable
  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Calcular totales
  const totalAM = attendanceCounts.AM.kids + attendanceCounts.AM.adults;
  const totalPM = attendanceCounts.PM.kids + attendanceCounts.PM.adults;
  const totalDay = totalAM + totalPM;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📊 Estadísticas</Text>
        <Text style={styles.subtitle}>Panel de asistencia diaria</Text>
      </View>

      {/* Selección de Fecha Mejorada */}
      <View style={styles.dateSection}>
        <View style={styles.dateSectionHeader}>
          <Text style={styles.sectionTitle}>📅 Fecha seleccionada</Text>
          <TouchableOpacity
            style={[
              styles.pdfButton, 
              (generatingPDF || totalDay === 0) && styles.pdfButtonDisabled
            ]}
            onPress={handleGeneratePDF}
            disabled={generatingPDF || totalDay === 0}
          >
            {generatingPDF ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.pdfButtonText}>📄 PDF</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
          <View style={styles.datePickerContent}>
            <Text style={styles.dateMainText}>
              {formatDate(selectedDate)}
            </Text>
            <Text style={styles.dateSubText}>
              Toca para cambiar
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Resumen Total */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total del día</Text>
        <Text style={styles.summaryValue}>{totalDay}</Text>
        <Text style={styles.summarySubtitle}>personas asistieron</Text>
      </View>

      {/* Tarjetas de estadísticas mejoradas */}
      <View style={styles.statsGrid}>
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionIcon}>🌅</Text>
            <Text style={styles.sessionTitle}>Mañana</Text>
            <Text style={styles.sessionTotal}>{totalAM}</Text>
          </View>
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{attendanceCounts.AM.kids}</Text>
              <Text style={styles.statLabel}>Niños</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{attendanceCounts.AM.adults}</Text>
              <Text style={styles.statLabel}>Adultos</Text>
            </View>
          </View>
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionIcon}>🌆</Text>
            <Text style={styles.sessionTitle}>Tarde</Text>
            <Text style={styles.sessionTotal}>{totalPM}</Text>
          </View>
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{attendanceCounts.PM.kids}</Text>
              <Text style={styles.statLabel}>Niños</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{attendanceCounts.PM.adults}</Text>
              <Text style={styles.statLabel}>Adultos</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Gráfico mejorado */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>📈 Gráfico de asistencia</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: ['Niños AM', 'Adultos AM', 'Niños PM', 'Adultos PM'],
              datasets: [
                {
                  data: [
                    attendanceCounts.AM.kids,
                    attendanceCounts.AM.adults,
                    attendanceCounts.PM.kids,
                    attendanceCounts.PM.adults,
                  ],
                },
              ],
            }}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#f8fafc',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
              propsForBackgroundLines: {
                stroke: '#e2e8f0',
              },
              propsForLabels: {
                fontSize: 12,
              },
            }}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
        </View>
      </View>

      {/* Sección de personas */}
      <View style={styles.peopleSection}>
        <Text style={styles.sectionTitle}>👥 Reportes individuales</Text>
        
        {!dataLoaded ? (
          <TouchableOpacity
            style={styles.loadButton}
            onPress={fetchPeople}
            disabled={loadingPeople}
          >
            {loadingPeople ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <>
                <Text style={styles.loadButtonText}>Cargar lista de personas</Text>
                <Text style={styles.loadButtonSubtext}>Ver reportes individuales</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Buscar por nombre..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={filterByName}
            />
            
            {filteredPeople.length > 0 ? (
              <FlatList
                data={filteredPeople}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.personCard}>
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>{item.name}</Text>
                      <Text style={styles.personSubtext}>Ver historial completo</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewAttendance(item.id)}
                    >
                      <Text style={styles.viewButtonText}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👤</Text>
                <Text style={styles.emptyStateText}>No se encontraron personas</Text>
                <Text style={styles.emptyStateSubtext}>Verifica tu búsqueda</Text>
              </View>
            )}
          </>
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
  dateSection: {
    padding: 24,
    paddingBottom: 16,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  pdfButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  datePicker: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerContent: {
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    textTransform: 'capitalize',
  },
  dateSubText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  sessionTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  chartSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chart: {
    borderRadius: 8,
  },
  peopleSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#334155',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  loadButtonSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  personCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  personSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  viewButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});

export default AnalyticsScreen;