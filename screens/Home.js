import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../database/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';


import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  const [lastSession, setLastSession] = useState(null);
  const [top3Attendees, setTop3Attendees] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const monthNames = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun', 
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];
  

  useEffect(() => {
    const fetchTop3Attendees = async () => {
      try {
        const attendanceRef = collection(db, 'attendance');
        const attendanceSnapshot = await getDocs(attendanceRef);
        const attendanceData = attendanceSnapshot.docs.map(doc => doc.data());

        const attendanceCounts = {};
        attendanceData.forEach(item => {
          const { personId } = item;
          if (!personId) return;
          attendanceCounts[personId] = (attendanceCounts[personId] || 0) + 1;
        });

        const peopleRef = collection(db, 'people');
        const peopleSnapshot = await getDocs(peopleRef);
        const peopleData = {};
        peopleSnapshot.docs.forEach(doc => {
          const { name } = doc.data();
          peopleData[doc.id] = name?.trim() || 'Desconocido';
        });

        const excludedRef = collection(db, 'excludedPeople');
        const excludedSnapshot = await getDocs(excludedRef);
        const excludedNames = excludedSnapshot.docs.map(doc => doc.data().name.trim());

        const top3Data = Object.entries(attendanceCounts)
          .map(([personId, count]) => ({
            name: peopleData[personId] || 'Desconocido',
            count,
          }))
          .filter(person => !excludedNames.includes(person.name))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setTop3Attendees(top3Data);
      } catch (error) {
        console.error('Error fetching top 3 attendees:', error);
      }
    };

    fetchTop3Attendees();
  }, []);

  useEffect(() => {
    const fetchLastSession = async () => {
        try {
          // Paso 1: Obtener la última sesión por fecha
          const attendanceRef = collection(db, 'attendance');
          const q = query(attendanceRef, orderBy('date', 'desc'), limit(1)); // Ordenar por fecha descendente y limitar a 1
          const snapshot = await getDocs(q);
      
          if (!snapshot.empty) {
            const last = snapshot.docs[0].data(); // Obtiene los datos de la última sesión
            const lastDate = last.date; // Fecha de la última sesión
            const lastSession = last.session; // Sesión AM o PM
      
            console.log('Última sesión:', last); // Depuración
      
            // Paso 2: Contar los registros de la última sesión
            const sessionQuery = query(
              attendanceRef,
              where('date', '==', lastDate),
              where('session', '==', lastSession)
            );
            const sessionSnapshot = await getDocs(sessionQuery);
      
            console.log('Asistentes en la última sesión:', sessionSnapshot.docs.length); // Depuración
      
            // Paso 3: Establecer el estado con la información obtenida
            setLastSession({
              attended: sessionSnapshot.docs.length, // Número de asistentes
              session: lastSession,
              date: lastDate,
            });
          }
        } catch (error) {
          console.error('Error fetching last session:', error); // Manejo del error
        }
      };
      
      

    fetchLastSession();
  }, []);
  useEffect(() => {
    const fetchMonthlyAttendance = async () => {
      try {
        const attendanceRef = collection(db, 'attendance');
        const snapshot = await getDocs(attendanceRef);
        const attendanceData = snapshot.docs.map(doc => doc.data());
  
        // Agrupar asistencias por mes
        const attendanceByMonth = Array(12).fill(0); // Inicializamos un array con 12 meses
        attendanceData.forEach(item => {
          const date = new Date(item.date); // Convertimos la fecha a formato Date
          const monthIndex = date.getMonth(); // Obtenemos el índice del mes (0-11)
          attendanceByMonth[monthIndex] += 1; // Incrementamos el conteo para el mes correspondiente
        });
  
        // Preparar los datos para la gráfica
        const formattedData = attendanceByMonth.map((count, index) => ({
          month: monthNames[index], // Nombres de los meses (ene, feb, etc.)
          count, // Total de asistentes del mes
        }));
  
        setMonthlyAttendance(formattedData);
      } catch (error) {
        console.error('Error fetching monthly attendance:', error);
      }
    };
  
    fetchMonthlyAttendance();
  }, []);
  
  

  return (
    
    <View style={styles.container}>
       
      <DashboardCard
        title="Top 3 Asistentes"
        top3Data={top3Attendees}
        cardStyle={{ backgroundColor: '#000' }}
      />
      
      {lastSession && (
            <View style={styles.lastSessionCard}>
            <View style={styles.iconWrapper}>
            <Ionicons name="calendar-outline" style={styles.icon} />
            </View>
            <Text style={styles.lastSessionTitle}>{lastSession.attended}</Text>
            <Text style={styles.subtitle}>Asistencia Última Sesión</Text>
            <Text style={styles.details}>
            Fecha: {lastSession.date} - Sesión: {lastSession.session}
            </Text>
        </View>
      
      )}
        <View style={styles.chartContainer}>
  <BarChart
    data={{
      labels: monthlyAttendance.map(item => item.month), // Nombres de los meses
      datasets: [
        {
          data: monthlyAttendance.map(item => item.count), // Conteo por mes
        },
      ],
    }}
    width={Dimensions.get('window').width - 40} // Ancho de la gráfica
    height={220} // Alto de la gráfica
    yAxisLabel="" // Sin prefijo
    chartConfig={{
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 0, // Sin decimales
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color de las barras
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color de las etiquetas
      style: { borderRadius: 16 },
      barPercentage: 0.5,
    }}
    style={{
      marginVertical: 8,
      borderRadius: 16,
    }}
  />
</View>


    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
  },
  lastSessionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    color: '#888',
  },
  lastSessionTitle: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
  },
  details: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Sombra para Android
  },
  
});

export default Dashboard;
