import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

export default function AttendanceSelectScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [session, setSession] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event, date) => {
    setShowPicker(false);
  
    if (date) {
      // Aseguramos que la fecha seleccionada esté al inicio del día local (00:00 horas)
      const localDate = new Date(date.setHours(0, 0, 0, 0));
      setSelectedDate(localDate);
    }
  };
  
  
  

  const handleSessionSelect = (selectedSession) => {
    setSession(selectedSession);
  };

  const handleSaveAttendance = () => {
    if (!selectedDate || !session) {
      Alert.alert('Error', 'Please select a date and session.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigation.navigate('AttendanceListScreen', {
        date: selectedDate.toISOString().split('T')[0],
        session,
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
       {/* Encabezado */}
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 16, marginTop:30 }}>
              Asistencia
            </Text>

      {/* Paso 1: Fecha */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Selecciona la fecha:</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.datePickerText}>
            {selectedDate.toISOString().split('T')[0]}
          </Text>
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

      {/* Paso 2: Sesión */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Selecciona la sesión: </Text>
        <View style={styles.sessionContainer}>
          <TouchableOpacity
            style={[
              styles.sessionButton,
              session === 'AM' && styles.selectedSession,
            ]}
            onPress={() => handleSessionSelect('AM')}
          >
            <Text
              style={[
                styles.sessionText,
                session === 'AM' && styles.selectedSessionText,
              ]}
            >
              AM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sessionButton,
              session === 'PM' && styles.selectedSession,
            ]}
            onPress={() => handleSessionSelect('PM')}
          >
            <Text
              style={[
                styles.sessionText,
                session === 'PM' && styles.selectedSessionText,
              ]}
            >
              PM
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Guardar */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleSaveAttendance}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar asistencia</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginTop:10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1e1e1e',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1e1e1e',
  },
  datePickerButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerText: {
    fontSize: 16,
    color: '#1e1e1e',
  },
  sessionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  selectedSession: {
    backgroundColor: '#1e1e1e',
  },
  sessionText: {
    fontSize: 16,
    color: '#1e1e1e',
  },
  selectedSessionText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});
