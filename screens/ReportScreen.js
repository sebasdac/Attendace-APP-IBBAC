import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { db } from '../database/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Componente principal
export default function AttendanceReportScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Manejo de la selección de fecha
  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
  };

  // Obtener los datos de asistencia de Firebase
  const fetchAttendanceData = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Por favor, selecciona una fecha.');
      return;
    }

    setLoading(true);

    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(
        attendanceRef,
        where('date', '==', selectedDate)
      );

      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push(docData);
      });

      setAttendanceData(data);
      setReportGenerated(true);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cargar los datos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Generar el reporte de asistencia
  const generateReport = () => {
    const amAttended = attendanceData.filter((attendee) => attendee.session === 'AM' && attendee.attended === true).length;
    const pmAttended = attendanceData.filter((attendee) => attendee.session === 'PM' && attendee.attended === true).length;
    const amNotAttended = attendanceData.filter((attendee) => attendee.session === 'AM' && attendee.attended === false).length;
    const pmNotAttended = attendanceData.filter((attendee) => attendee.session === 'PM' && attendee.attended === false).length;

    const totalAttendees = amAttended + pmAttended + amNotAttended + pmNotAttended;
    const amPercentage = ((amAttended / totalAttendees) * 100).toFixed(2);
    const pmPercentage = ((pmAttended / totalAttendees) * 100).toFixed(2);

    return {
      amAttended,
      pmAttended,
      amNotAttended,
      pmNotAttended,
      amPercentage,
      pmPercentage,
    };
  };

  const report = generateReport();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Reporte de Asistencia</Text>

      <Calendar
        markedDates={{ [selectedDate]: { selected: true, selectedColor: '#007bff', selectedTextColor: 'white' } }}
        onDayPress={handleDateSelect}
        minDate={new Date().toISOString().split('T')[0]}
        monthFormat={'yyyy MM'}
        hideExtraDays
        markingType={'simple'}
        style={styles.calendar}
        theme={{
          todayTextColor: '#007bff',
          arrowColor: '#007bff',
        }}
      />

      <TouchableOpacity style={styles.button} onPress={fetchAttendanceData}>
        <Text style={styles.buttonText}>Generar Reporte</Text>
      </TouchableOpacity>

      {loading && <Text style={styles.loading}>Cargando...</Text>}

      {reportGenerated && (
        <View style={styles.reportContainer}>
          <Text style={styles.subHeader}>Reporte de Asistencia para {selectedDate}</Text>

          {/* Gráfico de barras */}
          <BarChart
            data={{
              labels: ['AM', 'PM'],
              datasets: [
                {
                  data: [report.amAttended, report.pmAttended],
                },
              ],
            }}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#f7f7f7',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            fromZero
            style={styles.chart}
          />

          {/* Conclusiones */}
          <View style={styles.conclusionContainer}>
            <Text style={styles.conclusion}>Total Asistentes: {report.amAttended + report.pmAttended}</Text>
            <Text style={styles.conclusion}>AM: {report.amAttended} personas ({report.amPercentage}%)</Text>
            <Text style={styles.conclusion}>PM: {report.pmAttended} personas ({report.pmPercentage}%)</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f4f8',
    paddingBottom: 20,
  },
  header: {
    fontSize: 25,
    marginTop:30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007bff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
  },
  reportContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  subHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  chart: {
    marginVertical: 20,
  },
  conclusionContainer: {
    backgroundColor: '#e8f0fe',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    marginTop: 20,
  },
  conclusion: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'center',
    color: '#007bff',
  },
});
