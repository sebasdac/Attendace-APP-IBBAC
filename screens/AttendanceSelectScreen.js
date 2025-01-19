import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';

export default function AttendanceSelectScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('');
  const [session, setSession] = useState('');
  const [loading, setLoading] = useState(false);  // Estado para el indicador de carga

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
  };

  const handleSessionSelect = (selectedSession) => {
    setSession(selectedSession);
  };

  const handleSaveAttendance = () => {
    if (!selectedDate || !session) {
      Alert.alert('Error', 'Por favor, selecciona una fecha y una sesión.');
      return;
    }
    
    // Inicia el indicador de carga
    setLoading(true);
    
    // Simula un retraso para mostrar el indicador de carga
    setTimeout(() => {
      setLoading(false);  // Detiene el indicador de carga
      navigation.navigate('AttendanceListScreen', { date: selectedDate, session });
    }, 2000);  // 2 segundos de retraso simulado
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Paso 1: Selecciona un Domingo</Text>

      <Calendar
        markedDates={{ [selectedDate]: { selected: true, selectedColor: '#007bff', selectedTextColor: 'white' } }}
        onDayPress={handleDateSelect}
        monthFormat={'yyyy MM'}
        hideExtraDays
        markingType={'simple'}
        style={styles.calendar}
      />

      <Text style={styles.subHeader}>Paso 2: Selecciona el formato</Text>

      <View style={styles.sessionContainer}>
        <TouchableOpacity
          style={[styles.sessionButton, session === 'AM' && styles.selectedSession]}
          onPress={() => handleSessionSelect('AM')}
        >
          <Text style={styles.sessionText}>AM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sessionButton, session === 'PM' && styles.selectedSession]}
          onPress={() => handleSessionSelect('PM')}
        >
          <Text style={styles.sessionText}>PM</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAttendance} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Asistencia</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  subHeader: {
    fontSize: 18,
    marginVertical: 15,
    textAlign: 'center',
    color: '#555',
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 3, // Shadow for Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sessionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  sessionButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSession: {
    backgroundColor: '#007bff',
    opacity: 0.5,
  },
  sessionText: {
    fontSize: 18,
    color: '#007bff',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
