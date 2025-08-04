import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { db } from "../database/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";

const MonthlyAttendanceScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [reportType, setReportType] = useState('overview'); // 'overview' o 'detailed'
  const [detailedView, setDetailedView] = useState('calendar'); // 'calendar' o 'individual'
  const [kids, setKids] = useState({});

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Inicializar con mes actual
  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "classes"));
        const classesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classesList);
        
        // Auto-seleccionar primera clase si solo hay una
        if (classesList.length === 1) {
          setSelectedClass(classesList[0].name);
        }
      } catch (error) {
        console.error("Error al cargar clases:", error);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchKids = async () => {
      try {
        const snapshot = await getDocs(collection(db, "kids"));
        const kidsMap = {};
        snapshot.docs.forEach((doc) => {
          const kidData = doc.data();
          if (kidData.name) {
            kidsMap[doc.id] = kidData.name;
          }
        });
        setKids(kidsMap);
      } catch (error) {
        console.error("Error al cargar los niños:", error);
      }
    };

    fetchKids();
  }, []);

  // Función mejorada para generar reporte mensual completo
  const generateMonthlyReport = async () => {
    if (!selectedClass) {
      Alert.alert("Selección requerida", "Por favor, selecciona una clase.");
      return;
    }

    setLoading(true);
    try {
      const monthIndex = months.indexOf(selectedMonth);
      const year = currentYear;
      
      // Obtener todos los domingos del mes
      const sundays = getSundaysInMonth(monthIndex, year);
      
      // Consultar toda la asistencia del mes para la clase seleccionada
      const attendancePromises = sundays.map(async (sunday) => {
        const formattedDate = sunday.toISOString().split("T")[0];
        
        const morningQuery = query(
          collection(db, "attendance"),
          where("class", "==", selectedClass),
          where("date", "==", formattedDate),
          where("session", "==", "AM")
        );
        
        const afternoonQuery = query(
          collection(db, "attendance"),
          where("class", "==", selectedClass),
          where("date", "==", formattedDate),
          where("session", "==", "PM")
        );

        const [morningSnapshot, afternoonSnapshot] = await Promise.all([
          getDocs(morningQuery),
          getDocs(afternoonQuery)
        ]);

        return {
          date: sunday,
          morning: morningSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          afternoon: afternoonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };
      });

      const weeklyData = await Promise.all(attendancePromises);
      
      // Procesar datos para estadísticas
      const report = processMonthlyData(weeklyData);
      setMonthlyReport(report);
      
    } catch (error) {
      console.error("Error al generar reporte:", error);
      Alert.alert("Error", "No se pudo generar el reporte mensual.");
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (weeklyData) => {
    const attendanceByKid = {};
    const weeklyStats = [];
    let totalSessions = 0;
    let totalAttendance = 0;

    weeklyData.forEach((week, index) => {
      const weekStats = {
        week: index + 1,
        date: week.date,
        morning: week.morning.length,
        afternoon: week.afternoon.length,
        total: week.morning.length + week.afternoon.length
      };
      
      weeklyStats.push(weekStats);
      totalSessions += 2; // AM y PM
      totalAttendance += weekStats.total;

      // Procesar asistencia individual
      [...week.morning, ...week.afternoon].forEach(record => {
        if (record.attended) {
          const kidName = kids[record.kidId] || "Desconocido";
          if (!attendanceByKid[kidName]) {
            attendanceByKid[kidName] = { total: 0, sessions: [] };
          }
          attendanceByKid[kidName].total++;
          attendanceByKid[kidName].sessions.push({
            date: week.date,
            session: record.session
          });
        }
      });
    });

    // Top asistentes del mes
    const topAttendees = Object.entries(attendanceByKid)
      .map(([name, data]) => ({ name, count: data.total, sessions: data.sessions }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      weeklyStats,
      topAttendees,
      totalSessions,
      totalAttendance,
      averagePerSession: totalSessions > 0 ? (totalAttendance / totalSessions).toFixed(1) : 0,
      attendanceByKid
    };
  };

  const getSundaysInMonth = (monthIndex, year) => {
    const sundays = [];
    const date = new Date(year, monthIndex, 1);

    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }

    while (date.getMonth() === monthIndex) {
      sundays.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }

    return sundays;
  };

  // Auto-generar reporte cuando se seleccionen clase y mes
  useEffect(() => {
    if (selectedClass && selectedMonth) {
      generateMonthlyReport();
    }
  }, [selectedClass, selectedMonth]);

  // Función auxiliar para obtener asistentes de una sesión específica
  const getAttendeesForSession = (date, session) => {
    const attendees = [];
    Object.entries(monthlyReport.attendanceByKid).forEach(([kidName, data]) => {
      const hasSession = data.sessions.some(s => 
        s.date.getTime() === date.getTime() && s.session === session
      );
      if (hasSession) {
        attendees.push(kidName);
      }
    });
    return attendees.sort();
  };

  // Vista de calendario con asistencia por fecha
  const renderCalendarView = () => {
    return (
      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>🗓️ Asistencia por fecha</Text>
        
        {monthlyReport.weeklyStats.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.dateCard}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>
                {week.date.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
              <View style={styles.dateStats}>
                <Text style={styles.dateTotal}>
                  Total: {week.total} asistencias
                </Text>
              </View>
            </View>

            <View style={styles.sessionsRow}>
              <View style={styles.sessionBlock}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>🌅 Mañana</Text>
                  <Text style={styles.sessionCount}>{week.morning}</Text>
                </View>
                
                <View style={styles.attendeesList}>
                  {getAttendeesForSession(week.date, 'AM').map((attendee, index) => (
                    <View key={index} style={styles.attendeeChip}>
                      <Text style={styles.attendeeChipText}>{attendee}</Text>
                    </View>
                  ))}
                  {week.morning === 0 && (
                    <Text style={styles.noAttendees}>Sin asistencia</Text>
                  )}
                </View>
              </View>

              <View style={styles.sessionBlock}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>🌆 Tarde</Text>
                  <Text style={styles.sessionCount}>{week.afternoon}</Text>
                </View>
                
                <View style={styles.attendeesList}>
                  {getAttendeesForSession(week.date, 'PM').map((attendee, index) => (
                    <View key={index} style={styles.attendeeChip}>
                      <Text style={styles.attendeeChipText}>{attendee}</Text>
                    </View>
                  ))}
                  {week.afternoon === 0 && (
                    <Text style={styles.noAttendees}>Sin asistencia</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Vista individual por niño
  const renderIndividualView = (allKids) => {
    return (
      <View style={styles.individualContainer}>
        <Text style={styles.individualTitle}>👥 Asistencia individual</Text>
        
        {allKids.map((kidName, index) => {
          const kidData = monthlyReport.attendanceByKid[kidName];
          const attendanceRate = ((kidData.total / (monthlyReport.weeklyStats.length * 2)) * 100).toFixed(1);
          
          return (
            <View key={index} style={styles.kidCard}>
              <View style={styles.kidHeader}>
                <View style={styles.kidInfo}>
                  <Text style={styles.kidName}>{kidName}</Text>
                  <Text style={styles.kidStats}>
                    {kidData.total} de {monthlyReport.weeklyStats.length * 2} sesiones ({attendanceRate}%)
                  </Text>
                </View>
                <View style={styles.attendanceRing}>
                  <Text style={styles.attendancePercent}>{attendanceRate}%</Text>
                </View>
              </View>

              <View style={styles.sessionsGrid}>
                {monthlyReport.weeklyStats.map((week, weekIndex) => {
                  const morningAttended = kidData.sessions.some(s => 
                    s.date.getTime() === week.date.getTime() && s.session === 'AM'
                  );
                  const afternoonAttended = kidData.sessions.some(s => 
                    s.date.getTime() === week.date.getTime() && s.session === 'PM'
                  );

                  return (
                    <View key={weekIndex} style={styles.weekColumn}>
                      <Text style={styles.weekNumber}>S{weekIndex + 1}</Text>
                      <View style={styles.sessionDots}>
                        <View style={[
                          styles.sessionDot,
                          morningAttended ? styles.sessionDotPresent : styles.sessionDotAbsent
                        ]} />
                        <View style={[
                          styles.sessionDot,
                          afternoonAttended ? styles.sessionDotPresent : styles.sessionDotAbsent
                        ]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.attendancePattern}>
                <Text style={styles.patternTitle}>Patrón de asistencia:</Text>
                <View style={styles.patternLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.sessionDot, styles.sessionDotPresent]} />
                    <Text style={styles.legendText}>Presente</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.sessionDot, styles.sessionDotAbsent]} />
                    <Text style={styles.legendText}>Ausente</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {allKids.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataEmoji}>📭</Text>
            <Text style={styles.noDataText}>No hay datos de asistencia</Text>
            <Text style={styles.noDataDesc}>
              No se encontraron registros para el mes seleccionado
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Función para renderizar la vista detallada
  const renderDetailedReport = () => {
    if (!monthlyReport) return null;

    // Obtener lista única de todos los niños que tuvieron asistencia
    const allKids = Object.keys(monthlyReport.attendanceByKid).sort();

    return (
      <View style={styles.detailedReportContainer}>
        {/* Selector de vista detallada */}
        <View style={styles.detailedOptions}>
          <TouchableOpacity
            style={[
              styles.detailOption,
              detailedView === 'calendar' && styles.detailOptionActive
            ]}
            onPress={() => setDetailedView('calendar')}
          >
            <Text style={[
              styles.detailOptionText,
              detailedView === 'calendar' && styles.detailOptionTextActive
            ]}>
              📅 Calendario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.detailOption,
              detailedView === 'individual' && styles.detailOptionActive
            ]}
            onPress={() => setDetailedView('individual')}
          >
            <Text style={[
              styles.detailOptionText,
              detailedView === 'individual' && styles.detailOptionTextActive
            ]}>
              👥 Individual
            </Text>
          </TouchableOpacity>
        </View>

        {detailedView === 'calendar' ? (
          renderCalendarView()
        ) : (
          renderIndividualView(allKids)
        )}
      </View>
    );
  };

  const renderWeeklyOverview = () => {
    if (!monthlyReport) return null;

    return (
      <View style={styles.reportSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyReport.totalAttendance}</Text>
            <Text style={styles.statLabel}>Total asistencias</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthlyReport.averagePerSession}</Text>
            <Text style={styles.statLabel}>Promedio por sesión</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 Asistencia por semana</Text>
          {monthlyReport.weeklyStats.map((week, index) => (
            <View key={index} style={styles.weekBar}>
              <View style={styles.weekInfo}>
                <Text style={styles.weekLabel}>Semana {week.week}</Text>
                <Text style={styles.weekDate}>
                  {week.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={styles.weekStats}>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionLabel}>🌅 {week.morning}</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionLabel}>🌆 {week.afternoon}</Text>
                </View>
                <View style={styles.totalStat}>
                  <Text style={styles.totalLabel}>{week.total}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {monthlyReport.topAttendees.length > 0 && (
          <View style={styles.topAttendeesContainer}>
            <Text style={styles.sectionTitle}>🏆 Top 5 del mes</Text>
            {monthlyReport.topAttendees.map((attendee, index) => (
              <View key={index} style={styles.attendeeItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.attendeeInfo}>
                  <Text style={styles.attendeeName}>{attendee.name}</Text>
                  <Text style={styles.attendeeCount}>{attendee.count} asistencias</Text>
                </View>
                <View style={styles.attendeeProgress}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${(attendee.count / monthlyReport.topAttendees[0].count) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.header}>📈 Reporte Mensual</Text>
          <Text style={styles.subtitle}>Análisis de asistencia detallado</Text>
        </View>
      </View>

      {/* Controles simplificados */}
      <View style={styles.controlsSection}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.selectorCard, { flex: 1, marginRight: 8 }]}
            onPress={() => setShowClassModal(true)}
          >
            <Text style={styles.selectorLabel}>Clase</Text>
            <Text style={styles.selectorValue}>
              {selectedClass || "Seleccionar"}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectorCard, { flex: 1, marginLeft: 8 }]}
            onPress={() => setShowMonthModal(true)}
          >
            <Text style={styles.selectorLabel}>Mes</Text>
            <Text style={styles.selectorValue}>{selectedMonth}</Text>
            <Icon name="keyboard-arrow-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Toggle para tipo de reporte */}
        <View style={styles.reportTypeToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              reportType === 'overview' && styles.toggleButtonActive
            ]}
            onPress={() => setReportType('overview')}
          >
            <Text style={[
              styles.toggleText,
              reportType === 'overview' && styles.toggleTextActive
            ]}>
              📊 Resumen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              reportType === 'detailed' && styles.toggleButtonActive
            ]}
            onPress={() => setReportType('detailed')}
          >
            <Text style={[
              styles.toggleText,
              reportType === 'detailed' && styles.toggleTextActive
            ]}>
              📋 Detallado
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido del reporte */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Generando reporte...</Text>
        </View>
      ) : (
        <>
          {reportType === 'overview' ? renderWeeklyOverview() : renderDetailedReport()}
        </>
      )}

      {/* Modal para seleccionar clase */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowClassModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona una Clase</Text>
            <TouchableOpacity onPress={() => setShowClassModal(false)}>
              <Icon name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={[
                  styles.modalItem,
                  selectedClass === classItem.name && styles.modalItemSelected
                ]}
                onPress={() => {
                  setSelectedClass(classItem.name);
                  setShowClassModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedClass === classItem.name && styles.modalItemTextSelected
                ]}>
                  {classItem.name}
                </Text>
                {selectedClass === classItem.name && (
                  <Icon name="check" size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para seleccionar mes */}
      <Modal
        visible={showMonthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMonthModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona un Mes</Text>
            <TouchableOpacity onPress={() => setShowMonthModal(false)}>
              <Icon name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalItem,
                  selectedMonth === month && styles.modalItemSelected
                ]}
                onPress={() => {
                  setSelectedMonth(month);
                  setShowMonthModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedMonth === month && styles.modalItemTextSelected
                ]}>
                  {month} {currentYear}
                </Text>
                {selectedMonth === month && (
                  <Icon name="check" size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
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
  controlsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#64748b',
    position: 'absolute',
    top: 8,
    left: 16,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
  },
  reportTypeToggle: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  reportSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
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
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekInfo: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  weekDate: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  weekStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionStat: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  totalStat: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  topAttendeesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
  attendeeProgress: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    width: 80,
    marginLeft: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#6366f1',
  },
  detailedReportContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  detailedOptions: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailOptionActive: {
    backgroundColor: '#6366f1',
  },
  detailOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  detailOptionTextActive: {
    color: '#ffffff',
  },
  calendarContainer: {
    gap: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#334155',
  },
  dateCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateHeader: {
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textTransform: 'capitalize',
  },
  dateStats: {
    marginTop: 4,
  },
  dateTotal: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionBlock: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  sessionCount: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  attendeesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attendeeChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendeeChipText: {
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '500',
  },
  noAttendees: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  individualContainer: {
    gap: 20,
  },
  individualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  kidCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  kidStats: {
    fontSize: 12,
    color: '#64748b',
  },
  attendanceRing: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendancePercent: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sessionsGrid: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  weekColumn: {
    alignItems: 'center',
  },
  weekNumber: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  sessionDots: {
    flexDirection: 'column',
    gap: 4,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionDotPresent: {
    backgroundColor: '#22c55e',
  },
  sessionDotAbsent: {
    backgroundColor: '#e5e7eb',
  },
  attendancePattern: {
    marginTop: 16,
  },
  patternTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#334155',
  },
  patternLegend: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  noDataContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  noDataEmoji: {
    fontSize: 48,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
  },
  noDataDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
  },
  modalItemTextSelected: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});

export default MonthlyAttendanceScreen;
