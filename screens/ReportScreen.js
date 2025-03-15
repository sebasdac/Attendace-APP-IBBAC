import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, TextInput} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker"; // Instala con `expo install @react-native-community/datetimepicker`
import { db } from '../database/firebase';
import { collection, query, where, getDocs } from "firebase/firestore";


const AnalyticsScreen = () => {
  const [attendanceCounts, setAttendanceCounts] = useState({ AM: 0, PM: 0 }); // Asistencias por sesión
  const [selectedDate, setSelectedDate] = useState(new Date()); // Fecha seleccionada
  const [showDatePicker, setShowDatePicker] = useState(false); // Mostrar selector de fecha
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [filteredPeople, setFilteredPeople] = useState([]); // Lista filtrada
  const [search, setSearch] = useState(''); // Texto de búsqueda
  const [loadingPeople, setLoadingPeople] = useState(false); 
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      let q = collection(db, "attendance");
    
      // Formatear la fecha seleccionada en la zona horaria local
      const localDate = new Date(selectedDate.getTime() + Math.abs(selectedDate.getTimezoneOffset() * 60000));
      const dateString = localDate.toISOString().split("T")[0];
  
      // Filtrar por la fecha seleccionada
      q = query(q, where("date", "==", dateString));
  
      const snapshot = await getDocs(q);

      console.log(dateString);
  
      if (snapshot.empty) {
        console.log("No se encontraron datos para la fecha seleccionada.");
        setAttendanceCounts({ AM: 0, PM: 0 });
        return;
      }
  
      // Contar asistencias por sesión
      let amCount = 0;
      let pmCount = 0;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Verificar si el campo "attended" es true
        if (data.attended) {
          if (data.session === "AM") amCount++;
          if (data.session === "PM") pmCount++;
        }
      });
  
      setAttendanceCounts({ AM: amCount, PM: pmCount });
    } catch (error) {
      console.error("Error al obtener los datos de Firestore: ", error);
    }
  };
  
  const handleViewAttendance = (personId) => {
    navigation.navigate('AttendanceReport', { personId }); // Navega a la pantalla del reporte
  };
  
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      // Ajustar la fecha al inicio del día local para evitar desajustes
      const localDate = new Date(date.setHours(0, 0, 0, 0));
      setSelectedDate(localDate);
    }
  };

  const fetchPeople = async () => {
    setLoadingPeople(true); // Inicia el indicador de carga
    try {
      const snapshot = await getDocs(collection(db, 'people'));
      const peopleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPeople(peopleList);
      setFilteredPeople(peopleList); // Inicialmente, mostrar toda la lista
      setDataLoaded(true); // Marca que los datos se han cargado
    
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoadingPeople(false); // Detén el indicador de carga
    }
  };

const normalizeText = (text) => {
  return text
    .normalize('NFD') // Descompone los caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Elimina los caracteres diacríticos
    .toLowerCase(); // Convierte todo a minúsculas
};

const filterByName = (text) => {
  setSearch(text);
  const filtered = people.filter((person) =>
    normalizeText(person.name).includes(normalizeText(text))
  );
  setFilteredPeople(filtered);
};


if (loading) {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

  

return (
  <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
    {/* Encabezado */}
    <Text style={styles.header}>Estadísticas</Text>

    {/* Selección de Fecha */}
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
        <Text style={styles.dateText}>
          Fecha: {selectedDate.toISOString().split('T')[0]}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Mostrar el selector de fecha */}
    {showDatePicker && (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={handleDateChange}
      />
    )}

    {/* Tarjetas de estadísticas */}
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statTitle}>Asistencia AM</Text>
        <Text style={styles.statValue}>{attendanceCounts.AM}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statTitle}>Asistencia PM</Text>
        <Text style={styles.statValue}>{attendanceCounts.PM}</Text>
      </View>
    </View>
     {/* Gráfico de Barras */}
     <BarChart
      data={{
        labels: ['AM', 'PM'], // Etiquetas del gráfico
        datasets: [
          {
            data: [attendanceCounts.AM, attendanceCounts.PM], // Cantidades de asistencia
          },
        ],
      }}
      width={Dimensions.get('window').width - 32}
      height={220}
      chartConfig={{
        backgroundColor: '#fff',
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color negro para las barras
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color negro para las etiquetas

        propsForBackgroundLines: {
          stroke: '#ddd', // Líneas de fondo en gris claro
        },
      }}
      style={{
        marginVertical: 8,
        borderRadius: 8,
      }}
      fromZero // Las barras comienzan desde 0
      showValuesOnTopOfBars // Mostrar los valores en la parte superior de las barras
    />
    



    {/* Botón para cargar personas */}
    {!dataLoaded && (
      <TouchableOpacity
        style={styles.loadButton}
        onPress={fetchPeople}
        disabled={loadingPeople}
      >
        {loadingPeople ? (
          <ActivityIndicator size="small" color="#111" />
        ) : (
          <Text style={styles.loadButtonText}>Cargar Personas</Text>
        )}
      </TouchableOpacity>
    )}

    {/* Lista de Personas */}
    {dataLoaded && (
      <View style={styles.container}>
        <Text style={styles.subHeader}>Reporte por persona</Text>
        {/* Filtro de búsqueda */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre"
          placeholderTextColor="#888"
          value={search}
          onChangeText={filterByName}
        />
        {filteredPeople.length > 0 ? (
          <FlatList
            data={filteredPeople}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.personItem}>
                <Text style={styles.personName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewAttendance(item.id)}
                >
                  <Text style={styles.buttonText}>Ver Asistencia</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>No hay personas registradas</Text>
        )}
      </View>
    )}
  </ScrollView>
);

}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    marginTop: 30,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePicker: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5', // Gris claro
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 16,
    color: '#000', // Negro
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5', // Gris claro
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000', // Sombra negra
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2, // Elevación para Android
  },
  statTitle: {
    fontSize: 14,
    color: '#888', // Gris oscuro
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000', // Negro
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
    justifyContent: 'flex-start',
    
  },
  personItem: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9', // Gris muy claro
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Gris oscuro
  },
  personDetail: {
    fontSize: 16,
    color: '#555', // Gris medio
    marginVertical: 2,
  },
  viewButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff', // Blanco
    borderWidth: 1,
    borderColor: '#000', // Borde negro
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000', // Texto negro
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#888', // Gris oscuro
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth:1,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  loadButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



export default AnalyticsScreen;
