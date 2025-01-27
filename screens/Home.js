import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Image} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import DashboardCard from '../components/DashboardCard';
import { db } from '../database/firebase'; // Importa tu configuración de Firebase
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';


const Dashboard = () => {
  const [lastSession, setLastSession] = useState(null);
  const [top3Attendees, setTop3Attendees] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const rotation = useSharedValue(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Inicia la carga
        await fetchTop3Attendees();
        await fetchLastSession();
        await fetchMonthlyAttendance();
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      } finally {
        setLoading(false); // Finaliza la carga
      }
    };

    fetchData();
  }, []);

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

  const fetchLastSession = async () => {
    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, orderBy('date', 'desc'), limit(1));
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        const last = snapshot.docs[0].data();
        const lastDate = last.date;
        const lastSession = last.session;
  
        const sessionQuery = query(
          attendanceRef,
          where('date', '==', lastDate),
          where('session', '==', lastSession)
        );
        const sessionSnapshot = await getDocs(sessionQuery);
  
        // Contar solo los registros con attended: true
        let attendedCount = 0;
        sessionSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.attended) {
            attendedCount++;
          }
        });
  
        setLastSession({
          attended: attendedCount,
          session: lastSession,
          date: lastDate,
        });
      }
    } catch (error) {
      console.error('Error fetching last session:', error);
    }
  };
  

  const fetchMonthlyAttendance = async () => {
    try {
      const attendanceRef = collection(db, 'attendance');
      const snapshot = await getDocs(attendanceRef);
      const attendanceData = snapshot.docs
        .map((doc) => doc.data())
        .filter((item) => item.attended); // Filtrar solo registros donde attended es true
  
      const attendanceByMonth = Array(12).fill(0); // Inicializar contadores para los 12 meses
      attendanceData.forEach((item) => {
        const date = new Date(item.date);
        const monthIndex = date.getMonth(); // Obtener el índice del mes (0-11)
        attendanceByMonth[monthIndex] += 1; // Incrementar el contador del mes correspondiente
      });
  
      const formattedData = attendanceByMonth.map((count, index) => ({
        month: monthNames[index], // Usar los nombres de los meses
        count,
      }));
  
      setMonthlyAttendance(formattedData); // Guardar los datos formateados en el estado
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };
  

  if (loading) {
    // Muestra el preloader mientras carga
    return (
      <View style={styles.loaderContainer}>
         <Image
          source={require('../assets/preloader.png')} // Cambia esta ruta a la ubicación de tu imagen
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loaderText}>Cargando datos...</Text>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardCard title="Top 3 Asistentes" top3Data={top3Attendees} cardStyle={{ backgroundColor: '#000' }} />
      {lastSession && (
        <View style={styles.lastSessionCard}>
          <View style={styles.iconWrapper}>
            <Ionicons name="calendar-outline" style={styles.icon} />
          </View>
          <Text style={styles.lastSessionTitle}>{lastSession.attended}</Text>
          <Text style={styles.subtitle}>Asistencia del último culto</Text>
          <Text style={styles.details}>
            Fecha: {lastSession.date} - Sesión: {lastSession.session}
          </Text>
      </View>
      
      )}
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Asistencia anual</Text> {/* Título del gráfico */}
          <LineChart
            data={{
              labels: monthNames.filter((_, index) => index % 2 === 0), // Mostrar meses alternos
              datasets: [
                {
                  data: monthlyAttendance.map((item) => item.count), // Datos dinámicos
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color negro para la línea
                  strokeWidth: 2, // Grosor de la línea
                },
              ],
            }}
            width={Dimensions.get('window').width * 0.9} // Usar el 90% del ancho de la pantalla
            height={220}
            yAxisInterval={10} // Intervalos en el eje Y
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff', // Fondo blanco
              backgroundGradientTo: '#ffffff', // Fondo blanco
              decimalPlaces: 0, // Sin decimales
              color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`, // Color de las líneas de rejilla (gris claro)
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color de etiquetas (negro)
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4', // Tamaño de los puntos
                strokeWidth: '2',
                stroke: '#ffffff', // Contorno blanco de los puntos
              },
              propsForBackgroundLines: {
                strokeDasharray: '', // Líneas sólidas para la rejilla
              },
            }}
            bezier // Hace que la línea sea curva
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          </View>
        </View>
 
    </View>
  );
};

const styles = StyleSheet.create({

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f4' },
  loaderText: { fontSize: 18, marginVertical: 10, color: '#333' },
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5, // Sombra para Android
    borderWidth: 1,
    borderColor: '#e3e3e3', // Borde ligero para destacar el diseño
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5', // Fondo azul claro sutil
  },
  icon: {
    fontSize: 30,
    color: '#000', // Azul vibrante
  },
  lastSessionTitle: {
    fontSize: 50,
    fontWeight: '800',
    color: '#000', // Azul oscuro para destacar
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575', // Gris medio
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#9E9E9E', // Gris claro
    textAlign: 'center',
    marginTop: 8,
  },
  chartWrapper: {
    marginRight:10,
  },
  chartContainer: {
    backgroundColor: '#ffffff', // Fondo blanco del contenedor
    borderRadius: 20, // Bordes redondeados
    padding: 3, // Espaciado interno
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Sombra suave
    borderWidth: 1,
    borderColor: '#d0d0d0', // Borde gris claro
    
  },
  chartTitle: {
    fontSize: 18, // Tamaño de fuente
    fontWeight: 'bold', // Negrita
    textAlign: 'center', // Centrar el texto
    color: '#333', // Gris oscuro
    marginBottom: 10, // Espacio entre el título y el gráfico
    
  },
  logo: { width: 100, height: 100, marginBottom: 20 }, // Ajusta el tamaño de la imagen
  
});

export default Dashboard;
