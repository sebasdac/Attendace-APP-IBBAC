import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
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
import { db } from "../database/firebase";

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
  const [loading, setLoading] = useState(false);
  
  const monthNames = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  
  const rotation = useSharedValue(0);

  // ✅ FUNCIÓN AGREGADA: Parsear fecha de forma segura
  const parseDateString = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
  };

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

      const excludedRef = collection(db, "excludedPeople");
      const excludedSnapshot = await getDocs(excludedRef);
      const excludedNames = excludedSnapshot.docs.map((doc) =>
        doc.data().name.trim()
      );

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

  // ✅ FUNCIÓN CORREGIDA: formatDate
  const formatDate = (dateString) => {
    // Usar la función segura para parsear la fecha
    const date = parseDateString(dateString);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Función para obtener el emoji de la sesión
  const getSessionEmoji = (session) => {
    return session === 'AM' ? '🌅' : '🌆';
  };

  // ✅ AGREGAR DEBUG para verificar la fecha
  console.log('Dashboard - Última sesión:', lastSession);
  if (lastSession) {
    console.log('Dashboard - Fecha de última sesión (string):', lastSession.date);
    console.log('Dashboard - Fecha parseada:', parseDateString(lastSession.date));
    console.log('Dashboard - Fecha formateada:', formatDate(lastSession.date));
  }

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
        <Text style={styles.loaderText}>Cargando dashboard...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🏠 Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de asistencia</Text>
      </View>

      {/* Tarjetas principales */}
      <View style={styles.cardsSection}>
        <View style={styles.row}>
          {/* Tarjeta Top 3 */}
          <View style={styles.top3Card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🏆</Text>
              <Text style={styles.cardTitle}>Top 3</Text>
            </View>
            <Text style={styles.cardSubtitle}>Asistentes más frecuentes</Text>
            
            {top3Attendees && top3Attendees.length > 0 ? (
              <View style={styles.top3List}>
                {top3Attendees.map((attendee, index) => (
                  <View key={index} style={styles.top3Item}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName} numberOfLines={1}>
                        {attendee.name}
                      </Text>
                      <Text style={styles.attendeeCount}>
                        {attendee.count} asistencias
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Sin datos</Text>
              </View>
            )}
          </View>

          {/* Tarjeta última sesión */}
          <View style={styles.lastSessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionIcon}>
                {lastSession ? getSessionEmoji(lastSession.session) : '📅'}
              </Text>
            </View>
            
            {lastSession ? (
              <>
                <Text style={styles.attendanceNumber}>
                  {lastSession.attended}
                </Text>
                <Text style={styles.attendanceLabel}>
                  personas asistieron
                </Text>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionInfo}>
                    {lastSession.session === 'AM' ? 'Mañana' : 'Tarde'}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {formatDate(lastSession.date)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Sin datos recientes</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Gráfico de asistencia anual */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>📈 Asistencia anual {new Date().getFullYear()}</Text>
        
        <View style={styles.chartContainer}>
          {monthlyAttendance && monthlyAttendance.length > 0 ? (
            <>
              {/* Estadísticas rápidas */}
              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatNumber}>
                    {monthlyAttendance.reduce((sum, item) => sum + item.count, 0)}
                  </Text>
                  <Text style={styles.quickStatLabel}>Total del año</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatNumber}>
                    {Math.round(monthlyAttendance.reduce((sum, item) => sum + item.count, 0) / 12)}
                  </Text>
                  <Text style={styles.quickStatLabel}>Promedio mensual</Text>
                </View>
              </View>

              <LineChart
                data={{
                  labels: monthNames.filter((_, index) => index % 2 === 0),
                  datasets: [
                    {
                      data: monthlyAttendance.map((item) => item.count),
                      color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={Dimensions.get("window").width - 48}
                height={200}
                yAxisInterval={10}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#f8fafc",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(226, 232, 240, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: "#ffffff",
                    fill: "#6366f1",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#e2e8f0",
                  },
                }}
                bezier
                style={styles.chart}
              />
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartIcon}>📊</Text>
              <Text style={styles.emptyChartText}>No hay datos para mostrar</Text>
              <Text style={styles.emptyChartSubtext}>
                Los datos aparecerán cuando haya registros de asistencia
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sección de acciones rápidas */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>⚡ Acciones rápidas</Text>
        
        <View style={styles.actionCards}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Estadísticas</Text>
            <Text style={styles.actionSubtitle}>Ver más detalles</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Personas</Text>
            <Text style={styles.actionSubtitle}>Gestionar registros</Text>
          </TouchableOpacity>
        </View>
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
  cardsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  top3Card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  top3List: {
    gap: 12,
  },
  top3Item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  attendeeCount: {
    fontSize: 12,
    color: '#64748b',
  },
  lastSessionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    marginBottom: 16,
  },
  sessionIcon: {
    fontSize: 32,
  },
  attendanceNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: 'center',
    marginBottom: 12,
  },
  sessionDetails: {
    alignItems: 'center',
  },
  sessionInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  chartSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStats: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyChartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  actionCards: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default Dashboard;