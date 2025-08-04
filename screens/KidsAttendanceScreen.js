import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../database/firebase";
import { collection, getDocs, addDoc, query, where, updateDoc, doc, setDoc, getDoc} from "firebase/firestore";

export default function KidsAttendanceScreen({ route }) {
  const navigation = useNavigation();
  const { classRoom, date, session } = route.params;
  const [kids, setKids] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ FUNCIÓN AGREGADA: Parsear fecha de forma segura
  const parseDateString = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
  };

  // ✅ FUNCIÓN CORREGIDA: updateMonthlySummary
  const updateMonthlySummary = async (dateStr, incremento = 1) => {
    try {
      // Usar la función segura para parsear la fecha
      const dateObj = parseDateString(dateStr);
      const year = dateObj.getFullYear().toString();
      const month = dateObj.toLocaleString("es-ES", { month: "short" }).toLowerCase();

      const summaryRef = doc(db, "attendanceSummary", year);
      const summarySnap = await getDoc(summaryRef);

      if (summarySnap.exists()) {
        const data = summarySnap.data();
        const newCount = Math.max(0, (data[month] || 0) + incremento);
        await updateDoc(summaryRef, {
          [month]: newCount,
        });
      } else if (incremento > 0) {
        await setDoc(summaryRef, {
          [month]: 1,
        });
      }
    } catch (error) {
      console.error("Error actualizando resumen mensual:", error);
    }
  };

  // ✅ FUNCIÓN CORREGIDA: formatDisplayDate
  const formatDisplayDate = (dateStr) => {
    // Usar la función segura para parsear la fecha
    const date = parseDateString(dateStr);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Función para cargar los niños de la clase seleccionada
  const fetchKidsByClass = async () => {
    try {
      setLoading(true);

      // Obtener todos los niños
      const kidsSnapshot = await getDocs(collection(db, "kids"));
      const kidsList = kidsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrar los niños que pertenecen a la clase seleccionada
      const filteredKids = kidsList.filter((kid) =>
        kid.classes.includes(classRoom)
      );
      setKids(filteredKids);

      // Cargar la asistencia ya registrada para la fecha y sesión seleccionadas
      const attendanceSnapshot = await getDocs(
        query(
          collection(db, "attendance"),
          where("date", "==", date),
          where("session", "==", session),
          where("class", "==", classRoom)
        )
      );

      const attendanceData = {};
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceData[data.kidId] = data.attended;
      });

      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error al cargar niños o asistencia:", error);
      Alert.alert("Error", "No se pudieron cargar los datos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el cambio de asistencia
  const handleAttendanceChange = (id, attended) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: attended,
    }));
  };

  // Función para guardar la asistencia en Firestore
  const saveAttendance = async () => {
    if (Object.keys(attendance).length === 0) {
      Alert.alert("Información", "No hay cambios en la asistencia para guardar.");
      return;
    }

    try {
      setSaving(true);

      for (const kidId in attendance) {
        const isAttended = attendance[kidId];

        const existingAttendanceQuery = query(
          collection(db, "attendance"),
          where("kidId", "==", kidId),
          where("date", "==", date),
          where("session", "==", session),
          where("class", "==", classRoom)
        );

        const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery);

        if (existingAttendanceSnapshot.empty) {
          // Nuevo registro
          await addDoc(collection(db, "attendance"), {
            kidId,
            date,
            session,
            class: classRoom,
            attended: isAttended,
          });

          if (isAttended) {
            await updateMonthlySummary(date, +1);
          }
        } else {
          // Ya existe
          const docSnapshot = existingAttendanceSnapshot.docs[0];
          const docRef = docSnapshot.ref;
          const prevAttended = docSnapshot.data().attended;

          if (prevAttended !== isAttended) {
            await updateDoc(docRef, {
              attended: isAttended,
            });

            if (!prevAttended && isAttended) {
              await updateMonthlySummary(date, +1);
            }

            if (prevAttended && !isAttended) {
              await updateMonthlySummary(date, -1);
            }
          }
        }
      }

      Alert.alert(
        "¡Éxito!", 
        "La asistencia se guardó correctamente.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la asistencia. Intenta nuevamente.");
      console.error("Error al guardar la asistencia:", error);
    } finally {
      setSaving(false);
    }
  };

  // Calcular estadísticas
  const getAttendanceStats = () => {
    const totalKids = kids.length;
    const attendedCount = Object.values(attendance).filter(Boolean).length;
    const absentCount = Object.values(attendance).filter(attended => attended === false).length;
    const pendingCount = totalKids - attendedCount - absentCount;
    
    return { totalKids, attendedCount, absentCount, pendingCount };
  };

  const stats = getAttendanceStats();

  // Cargar niños y asistencia cuando se inicia la pantalla
  useEffect(() => {
    fetchKidsByClass();
  }, [classRoom, date, session]);

  // ✅ AGREGAR DEBUG para verificar la fecha
  console.log('KidsAttendance - Fecha recibida (string):', date);
  console.log('KidsAttendance - Fecha parseada:', parseDateString(date));
  console.log('KidsAttendance - Fecha formateada:', formatDisplayDate(date));

  // Renderizar cada estudiante
  const renderKidItem = ({ item }) => (
    <View style={styles.kidCard}>
      <View style={styles.kidInfo}>
        <View style={styles.kidAvatar}>
          <Ionicons name="person" size={20} color="#6366f1" />
        </View>
        <View style={styles.kidDetails}>
          <Text style={styles.kidName}>{item.name}</Text>
          <Text style={styles.kidId}>ID: {item.id.slice(-6)}</Text>
        </View>
      </View>
      
      <View style={styles.attendanceOptions}>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            styles.presentButton,
            attendance[item.id] === true && styles.presentButtonActive
          ]}
          onPress={() => handleAttendanceChange(item.id, true)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={attendance[item.id] === true ? "#ffffff" : "#10b981"} 
          />
          <Text style={[
            styles.attendanceButtonText,
            attendance[item.id] === true && styles.attendanceButtonTextActive
          ]}>
            Presente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.attendanceButton,
            styles.absentButton,
            attendance[item.id] === false && styles.absentButtonActive
          ]}
          onPress={() => handleAttendanceChange(item.id, false)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="close-circle" 
            size={20} 
            color={attendance[item.id] === false ? "#ffffff" : "#ef4444"} 
          />
          <Text style={[
            styles.attendanceButtonText,
            attendance[item.id] === false && styles.attendanceButtonTextActive
          ]}>
            Ausente
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando estudiantes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.header}>📋 Lista de Asistencia</Text>
          <Text style={styles.subtitle}>Marca quién está presente</Text>
        </View>
      </View>

      {/* Información de la sesión */}
      <View style={styles.sessionInfoSection}>
        <View style={styles.sessionInfoCard}>
          <View style={styles.sessionInfoRow}>
            <View style={styles.sessionInfoItem}>
              <Ionicons name="school" size={16} color="#64748b" />
              <Text style={styles.sessionInfoText}>{classRoom}</Text>
            </View>
            <View style={styles.sessionInfoItem}>
              <Ionicons name="calendar" size={16} color="#64748b" />
              <Text style={styles.sessionInfoText}>{formatDisplayDate(date)}</Text>
            </View>
            <View style={styles.sessionInfoItem}>
              <Ionicons name="time" size={16} color="#64748b" />
              <Text style={styles.sessionInfoText}>
                {session === "AM" ? "Mañana" : "Tarde"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Resumen de asistencia</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.attendedCount}</Text>
              <Text style={styles.statLabel}>Presentes</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#10b981' }]} />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.absentCount}</Text>
              <Text style={styles.statLabel}>Ausentes</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#ef4444' }]} />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.pendingCount}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#94a3b8' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Lista de estudiantes */}
      <View style={styles.studentsSection}>
        <Text style={styles.sectionTitle}>👥 Estudiantes ({kids.length})</Text>
        
        <FlatList
          data={kids}
          keyExtractor={(item) => item.id}
          renderItem={renderKidItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.studentsList}
        />
      </View>

      {/* Botón para guardar */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (saving || Object.keys(attendance).length === 0) && styles.saveButtonDisabled
          ]}
          onPress={saveAttendance}
          disabled={saving || Object.keys(attendance).length === 0}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Guardar Asistencia</Text>
            </>
          )}
        </TouchableOpacity>

        {Object.keys(attendance).length === 0 && (
          <Text style={styles.helperText}>
            Marca la asistencia de al menos un estudiante
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
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
  headerContainer: {
    backgroundColor: '#6366f1',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    opacity: 0.9,
  },
  sessionInfoSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sessionInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionInfoText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  statIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  studentsSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  studentsList: {
    paddingBottom: 20,
  },
  kidCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  kidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kidAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kidDetails: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  kidId: {
    fontSize: 12,
    color: '#64748b',
  },
  attendanceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  presentButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  presentButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  absentButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  absentButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  attendanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  attendanceButtonTextActive: {
    color: '#ffffff',
  },
  saveSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
});