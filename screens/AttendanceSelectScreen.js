import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

export default function AttendanceSelectScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [session, setSession] = useState('');
  const [loading, setLoading] = useState(false);

  // FUNCIÓN CORREGIDA - Crear fecha sin problemas de zona horaria
  const handleDateChange = (event, date) => {
    setShowPicker(false);
  
    if (date) {
      // Crear una nueva fecha usando solo año, mes y día (sin horas)
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const localDate = new Date(year, month, day);
      setSelectedDate(localDate);
      
      // DEBUG: Agregar console.log para verificar
      console.log('Fecha seleccionada:', localDate);
      console.log('Fecha formateada:', formatDateForNavigation(localDate));
    }
  };

  const handleSessionSelect = (selectedSession) => {
    setSession(selectedSession);
  };

  // NUEVA FUNCIÓN para formatear fecha de navegación de forma segura
  const formatDateForNavigation = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSaveAttendance = () => {
    if (!selectedDate || !session) {
      Alert.alert('Error', 'Por favor selecciona una fecha y sesión.');
      return;
    }

    setLoading(true);

    // DEBUG: Verificar qué fecha se está enviando
    const dateToSend = formatDateForNavigation(selectedDate);
    console.log('Enviando fecha:', dateToSend);
    console.log('Fecha original:', selectedDate);

    setTimeout(() => {
      setLoading(false);
      navigation.navigate('AttendanceListScreen', {
        date: dateToSend, // Usar la función segura en lugar de toISOString
        session,
      });
    }, 2000);
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

  // Función para obtener el emoji de la sesión
  const getSessionEmoji = (sessionType) => {
    return sessionType === 'AM' ? '🌅' : '🌆';
  };

  const isFormValid = selectedDate && session;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📋 Registro de Asistencia</Text>
        <Text style={styles.subtitle}>Selecciona fecha y sesión</Text>
      </View>

      {/* Contenido principal */}
      <View style={styles.contentSection}>
        
        {/* Paso 1: Selección de fecha */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>📅 Selecciona la fecha</Text>
          </View>
          
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowPicker(true)}
          >
            <View style={styles.dateSelectorContent}>
              <Text style={styles.dateMainText}>
                {formatDate(selectedDate)}
              </Text>
              <Text style={styles.dateSubText}>
                {formatDateForNavigation(selectedDate)}
              </Text>
              <Text style={styles.dateActionText}>Toca para cambiar</Text>
            </View>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Paso 2: Selección de sesión */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>⏰ Selecciona la sesión</Text>
          </View>

          <View style={styles.sessionGrid}>
            <TouchableOpacity
              style={[
                styles.sessionCard,
                session === 'AM' && styles.selectedSessionCard,
              ]}
              onPress={() => handleSessionSelect('AM')}
            >
              <Text style={styles.sessionEmoji}>🌅</Text>
              <Text style={[
                styles.sessionLabel,
                session === 'AM' && styles.selectedSessionLabel,
              ]}>
                Mañana
              </Text>
              <Text style={[
                styles.sessionTime,
                session === 'AM' && styles.selectedSessionTime,
              ]}>
                AM
              </Text>
              {session === 'AM' && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sessionCard,
                session === 'PM' && styles.selectedSessionCard,
              ]}
              onPress={() => handleSessionSelect('PM')}
            >
              <Text style={styles.sessionEmoji}>🌆</Text>
              <Text style={[
                styles.sessionLabel,
                session === 'PM' && styles.selectedSessionLabel,
              ]}>
                Tarde
              </Text>
              <Text style={[
                styles.sessionTime,
                session === 'PM' && styles.selectedSessionTime,
              ]}>
                PM
              </Text>
              {session === 'PM' && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen de selección */}
        {isFormValid && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📝 Resumen</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha:</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sesión:</Text>
                <Text style={styles.summaryValue}>
                  {getSessionEmoji(session)} {session === 'AM' ? 'Mañana' : 'Tarde'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Botón de acción */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            !isFormValid && styles.disabledButton,
            loading && styles.loadingButton,
          ]}
          onPress={handleSaveAttendance}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.loadingText}>Preparando...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.actionButtonText}>
                Continuar al registro
              </Text>
              <Text style={styles.actionButtonSubtext}>
                Comenzar a tomar asistencia
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Mensaje de ayuda */}
        {!isFormValid && (
          <View style={styles.helpCard}>
            <Text style={styles.helpIcon}>💡</Text>
            <Text style={styles.helpTitle}>Instrucciones</Text>
            <Text style={styles.helpText}>
              1. Selecciona la fecha del evento{'\n'}
              2. Elige la sesión (Mañana o Tarde){'\n'}
              3. Toca "Continuar" para empezar
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  dateSelector: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  dateSelectorContent: {
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    textTransform: 'capitalize',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateSubText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  dateActionText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  sessionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  selectedSessionCard: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sessionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  selectedSessionLabel: {
    color: '#ffffff',
  },
  sessionTime: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedSessionTime: {
    color: '#c7d2fe',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingButton: {
    backgroundColor: '#6366f1',
  },
  buttonContent: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    color: '#c7d2fe',
    fontSize: 14,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#a16207',
    textAlign: 'center',
    lineHeight: 20,
  },
});