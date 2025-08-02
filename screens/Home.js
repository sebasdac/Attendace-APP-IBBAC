import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  getDoc,
  doc,
  limit,
} from "firebase/firestore";
import DashboardCard from "../components/DashboardCard";
import { db } from "../database/firebase"; // Importa tu configuración de Firebase

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const Dashboard = () => {
  const [lastSession, setLastSession] = useState(null);
  const [top3Attendees, setTop3Attendees] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [loading, setLoading] = useState(false); // Estado de carga
  
  const monthNames = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const rotation = useSharedValue(0);

 


 useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchTop3Attendees();
      await fetchLastSession();
      await fetchMonthlyAttendance();
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  const handleLoadStatistics = () => {
    setShouldLoadData(true); // Activa la carga de datos
    setDataLoaded(true); // Indica que los datos han sido cargados
    setLoading(true)
  };
  const fetchTop3Attendees = async () => {
  try {
    const countsRef = collection(db, "attendanceCounts");
    const snapshot = await getDocs(countsRef);

    const allData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name || "Desconocido",
        count: data.count || 0,
      };
    });

    // Obtener lista de excluidos
    const excludedRef = collection(db, "excludedPeople");
    const excludedSnapshot = await getDocs(excludedRef);
    const excludedNames = excludedSnapshot.docs.map((doc) =>
      doc.data().name.trim()
    );

    // Filtrar y ordenar el top 3
    const top3Data = allData
      .filter((person) => !excludedNames.includes(person.name))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    setTop3Attendees(top3Data);
  } catch (error) {
    console.error("Error al obtener top 3 desde attendanceCounts:", error);
  }
};


  const fetchLastSession = async () => {
    try {
      const attendanceRef = collection(db, "attendance");
      const q = query(attendanceRef, orderBy("date", "desc"), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const last = snapshot.docs[0].data();
        const lastDate = last.date;
        const lastSession = last.session;

        const sessionQuery = query(
          attendanceRef,
          where("date", "==", lastDate),
          where("session", "==", lastSession)
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
      console.error("Error fetching last session:", error);
    }
  };

  const fetchMonthlyAttendance = async () => {
  try {
    const year = new Date().getFullYear().toString();
    const summaryRef = doc(db, "attendanceSummary", year);
    const snapshot = await getDoc(summaryRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      const formattedData = monthNames.map((month) => ({
        month,
        count: data[month] || 0,
      }));

      setMonthlyAttendance(formattedData);
    } else {
      setMonthlyAttendance([]);
    }
  } catch (error) {
    console.error("Error al obtener resumen mensual:", error);
  }
};

  if (loading) {
    // Muestra el preloader mientras carga
    return (
      <View style={styles.loaderContainer}>
        <Image
          source={require("../assets/preloader.png")} // Cambia esta ruta a la ubicación de tu imagen
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
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#000",
          marginBottom: 16,
        }}
      >
        Principal
      </Text>
  
     
    
   
        <>
          {/* Fila con dos tarjetas */}
          <View style={styles.row}>
            <DashboardCard
              title="Top 3 Asistentes"
              top3Data={top3Attendees || []} // Si top3Attendees es null o undefined, usa un array vacío
              cardStyle={styles.dashboardCard}
            />
            {lastSession ? ( // Solo renderiza si lastSession existe
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
            ) : (
              <Text style={styles.subtitle}>No hay datos de la última sesión</Text>
            )}
          </View>
  
          {/* Gráfico de asistencia anual */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Asistencia anual</Text>
            {monthlyAttendance && monthlyAttendance.length > 0 ? ( // Solo renderiza si hay datos
              <LineChart
                data={{
                  labels: monthNames.filter((_, index) => index % 2 === 0),
                  datasets: [
                    {
                      data: monthlyAttendance.map((item) => item.count),
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={Dimensions.get("window").width * 0.9}
                height={220}
                yAxisInterval={10}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#ffffff",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.subtitle}>No hay datos para mostrar</Text>
            )}
          </View>
        </>
  
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },
  logo: { width: 100, height: 100, marginBottom: 20 }, 
  container: {
    flex: 1,
    padding: 16,
    marginTop: 30,
    backgroundColor: "#f9f9f9",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  dashboardCard: {
    backgroundColor: "#000",
    width: "48%",
  },
  lastSessionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
  },
  icon: {
    fontSize: 30,
    color: "#000",
  },
  lastSessionTitle: {
    fontSize: 50,
    fontWeight: "800",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#757575",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    marginTop: 8,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    width: "100%",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadButton: {
    backgroundColor: "#007aff", // Color de fondo del botón
    padding: 15, // Espaciado interno
    borderRadius: 10, // Bordes redondeados
    alignSelf: "center", // Centra el botón horizontalmente
    marginTop: 20, // Margen superior
    width: "60%", // Ancho del botón (puedes ajustarlo)
    justifyContent: "center", // Centra el texto verticalmente
    alignItems: "center", // Centra el texto horizontalmente
  },
  loadButtonText: {
    color: "#fff", // Color del texto
    fontSize: 16, // Tamaño del texto
    fontWeight: "bold", // Texto en negrita
  },
});

export default Dashboard;
