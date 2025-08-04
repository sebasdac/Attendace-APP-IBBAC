import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SelectDateAndSessionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { classRoom } = route.params;
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [session, setSession] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para manejar el cambio de fecha
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Función para formatear la fecha en YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear la fecha para mostrar
  const formatDisplayDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // Función para navegar a la pantalla de asistencia
  const navigateToAttendance = async () => {
    if (!session) {
      alert("Por favor, selecciona una sesión (AM/PM).");
      return;
    }
    
    setLoading(true);
    
    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
      navigation.navigate("KidsAttendanceScreen", {
        classRoom,
        date: formatDate(date),
        session,
      });
      setLoading(false);
    }, 500);
  };

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
          <Text style={styles.header}>📅 Fecha y Sesión</Text>
          <Text style={styles.subtitle}>Selecciona cuándo pasar lista</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Información de la clase */}
        <View style={styles.classInfoSection}>
          <View style={styles.classInfoCard}>
            <View style={styles.classInfoHeader}>
              <View style={styles.classIcon}>
                <Ionicons name="school" size={24} color="#6366f1" />
              </View>
              <View style={styles.classInfoContent}>
                <Text style={styles.classInfoLabel}>Clase seleccionada</Text>
                <Text style={styles.classInfoName}>{classRoom}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selector de fecha */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>📅 Selecciona la fecha</Text>
          
          <TouchableOpacity
            style={styles.datePickerContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.inputIcon}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
            </View>
            <View style={styles.datePickerContent}>
              <Text style={styles.datePickerLabel}>Fecha</Text>
              <Text style={styles.datePickerText}>
                {formatDisplayDate(date)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Selector de sesión */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>🕐 Selecciona la sesión</Text>
          
          <View style={styles.sessionContainer}>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                session === "AM" && styles.sessionButtonActive
              ]}
              onPress={() => setSession("AM")}
              activeOpacity={0.8}
            >
              <View style={styles.sessionIconContainer}>
                <Ionicons 
                  name="sunny" 
                  size={24} 
                  color={session === "AM" ? "#ffffff" : "#f59e0b"} 
                />
              </View>
              <Text style={[
                styles.sessionButtonText,
                session === "AM" && styles.sessionButtonTextActive
              ]}>
                Mañana
              </Text>
              <Text style={[
                styles.sessionButtonSubtext,
                session === "AM" && styles.sessionButtonSubtextActive
              ]}>
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sessionButton,
                session === "PM" && styles.sessionButtonActive
              ]}
              onPress={() => setSession("PM")}
              activeOpacity={0.8}
            >
              <View style={styles.sessionIconContainer}>
                <Ionicons 
                  name="moon" 
                  size={24} 
                  color={session === "PM" ? "#ffffff" : "#6366f1"} 
                />
              </View>
              <Text style={[
                styles.sessionButtonText,
                session === "PM" && styles.sessionButtonTextActive
              ]}>
                Tarde
              </Text>
              <Text style={[
                styles.sessionButtonSubtext,
                session === "PM" && styles.sessionButtonSubtextActive
              ]}>
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen */}
        {session && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Resumen</Text>
              <View style={styles.summaryItem}>
                <Ionicons name="school" size={16} color="#64748b" />
                <Text style={styles.summaryText}>Clase: {classRoom}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={16} color="#64748b" />
                <Text style={styles.summaryText}>Fecha: {formatDisplayDate(date)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={16} color="#64748b" />
                <Text style={styles.summaryText}>Sesión: {session === "AM" ? "Mañana" : "Tarde"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Botón para continuar */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!session || loading) && styles.continueButtonDisabled
            ]}
            onPress={navigateToAttendance}
            disabled={!session || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.continueButtonText}>Continuar</Text>
              </>
            )}
          </TouchableOpacity>

          {!session && (
            <Text style={styles.helperText}>
              Selecciona una sesión para continuar
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Selector de fecha (modal) */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  classInfoSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  classInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  classInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  classInfoContent: {
    flex: 1,
  },
  classInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 4,
  },
  classInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 16,
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 4,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sessionContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionButton: {
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sessionButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sessionIconContainer: {
    marginBottom: 12,
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sessionButtonTextActive: {
    color: '#ffffff',
  },
  sessionButtonSubtext: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  sessionButtonSubtextActive: {
    color: '#c7d2fe',
  },
  summarySection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  summaryCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonIcon: {
    marginRight: 8,
  },
  continueButtonText: {
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