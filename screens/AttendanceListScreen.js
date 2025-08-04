import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../database/firebase';
import { getDocs, collection, addDoc, query, where, updateDoc, doc, getDoc, setDoc} from 'firebase/firestore';

export default function AttendanceListScreen({ route }) {
  const { date, session } = route.params;
  const [people, setPeople] = useState([]); // Lista de adultos
  const [attendance, setAttendance] = useState({}); // Estado de asistencia
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ FUNCIÓN CORREGIDA: Parsear fecha de forma segura
  const parseDateString = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
  };

  const updatePersonAttendanceCount = async (personId, personName, increment) => {
    try {
      const countRef = doc(db, 'attendanceCounts', personId);
      const countSnap = await getDoc(countRef);

      if (countSnap.exists()) {
        const data = countSnap.data();
        const newCount = Math.max(0, (data.count || 0) + increment);
        await updateDoc(countRef, { count: newCount });
      } else if (increment > 0) {
        await setDoc(countRef, { count: 1, name: personName });
      }
    } catch (error) {
      console.error(`Error actualizando attendanceCounts para ${personId}:`, error);
    }
  };

  // Función para cargar personas (adultos) desde Firestore
  const fetchPeople = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'people'));
      const peopleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar por nombre en orden alfabético
      const sortedPeople = peopleList.sort((a, b) => a.name.localeCompare(b.name));
      setPeople(sortedPeople);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    }
  };

  // Función para verificar la asistencia de las personas ya registradas en esa fecha y sesión
  const fetchAttendance = async () => {
    try {
      const attendanceSnapshot = await getDocs(
        query(collection(db, 'attendance'), where('date', '==', date), where('session', '==', session))
      );

      const attendanceData = {};
      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceData[data.personId] = data.attended;
      });

      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error al cargar la asistencia:', error);
    }
  };

  useEffect(() => {
    fetchPeople();
    fetchAttendance();
  }, []);

  // Manejo del cambio de asistencia (sin guardar en Firestore todavía)
  const handleAttendanceChange = (id, attended) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: attended,
    }));
  };

  // Función para guardar la asistencia en Firestore
  const handleSaveAttendance = async () => {
    setLoading(true);

    try {
      for (const personId in attendance) {
        const attendanceRef = collection(db, 'attendance');
        const attendanceQuery = query(
          attendanceRef,
          where('personId', '==', personId),
          where('date', '==', date),
          where('session', '==', session)
        );

        const existingAttendance = await getDocs(attendanceQuery);
        const isAttended = attendance[personId];

        if (existingAttendance.empty) {
          // 1. Crear nuevo registro
          await addDoc(attendanceRef, {
            personId,
            date,
            session,
            attended: isAttended,
          });

          // 2. Si asistió, actualizar el resumen
          if (isAttended) {
            await updateMonthlySummary(date);
            const person = people.find((p) => p.id === personId);
            await updatePersonAttendanceCount(personId, person?.name || "Desconocido", +1);
          }

        } else {
          // 3. Actualizar si cambia el estado
          const docSnapshot = existingAttendance.docs[0];
          const docRef = docSnapshot.ref;
          const prevAttended = docSnapshot.data().attended;

          if (prevAttended !== isAttended) {
            await updateDoc(docRef, {
              attended: isAttended,
            });

            const person = people.find((p) => p.id === personId);

            if (!prevAttended && isAttended) {
              // Asistencia marcada → aumentar resumen mensual y conteo individual
              await updateMonthlySummary(date, +1);
              await updatePersonAttendanceCount(personId, person?.name || "Desconocido", +1);
            }

            if (prevAttended && !isAttended) {
              // Asistencia desmarcada → restar resumen mensual y conteo individual
              await updateMonthlySummary(date, -1);
              await updatePersonAttendanceCount(personId, person?.name || "Desconocido", -1);
            }
          }
        }
      }

      alert('Asistencia guardada correctamente.');
    } catch (error) {
      alert('Error al guardar la asistencia.');
      console.error('Error al guardar la asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN CORREGIDA: updateMonthlySummary
  const updateMonthlySummary = async (dateStr, incremento = 1) => {
    try {
      // Usar la función segura para parsear la fecha
      const dateObj = parseDateString(dateStr);
      const year = dateObj.getFullYear().toString();
      const month = dateObj.toLocaleString('es-ES', { month: 'short' }).toLowerCase(); // ej: "ago"

      const summaryRef = doc(db, 'attendanceSummary', year);
      const summarySnap = await getDoc(summaryRef);

      if (summarySnap.exists()) {
        const data = summarySnap.data();
        const currentCount = data[month] || 0;
        const newCount = Math.max(0, currentCount + incremento); // evita negativos
        await updateDoc(summaryRef, {
          [month]: newCount,
        });
      } else if (incremento > 0) {
        // Solo creamos el documento si es para sumar
        await setDoc(summaryRef, {
          [month]: 1,
        });
      }
    } catch (error) {
      console.error('Error actualizando el resumen mensual:', error);
    }
  };

  // Función para normalizar texto (elimina tildes y convierte a minúsculas)
  const normalizeText = (text) => {
    return text
      .normalize('NFD') // Descompone caracteres con tildes
      .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, etc.)
      .toLowerCase(); // Convierte a minúsculas
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

  // Filtrar personas según el texto de búsqueda
  const filteredPeople = people.filter((person) =>
    normalizeText(person.name).includes(normalizeText(searchText))
  );

  // Contar asistentes
  const attendedCount = Object.values(attendance).filter(Boolean).length;
  const totalPeople = filteredPeople.length;

  // ✅ AGREGAR DEBUG para verificar la fecha
  console.log('Fecha recibida (string):', date);
  console.log('Fecha parseada:', parseDateString(date));
  console.log('Fecha formateada:', formatDate(date));

  if (loading && people.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/preloader.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loaderText}>Cargando asistencia...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>
          {getSessionEmoji(session)} Registro de Asistencia
        </Text>
        <Text style={styles.subtitle}>
          {formatDate(date)} • {session === 'AM' ? 'Mañana' : 'Tarde'}
        </Text>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{attendedCount}</Text>
          <Text style={styles.statLabel}>Asistentes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPeople}</Text>
          <Text style={styles.statLabel}>Total personas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {totalPeople > 0 ? Math.round((attendedCount / totalPeople) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Asistencia</Text>
        </View>
      </View>

      {/* Campo de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            placeholderTextColor="#94a3b8"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de personas */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={[
              styles.personItem,
              index === filteredPeople.length - 1 && styles.lastPersonItem
            ]}>
              <View style={styles.personInfo}>
                <View style={[
                  styles.personAvatar,
                  { backgroundColor: attendance[item.id] ? '#10b981' : '#64748b' }
                ]}>
                  <Text style={styles.personInitial}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.personDetails}>
                  <Text style={styles.personName}>{item.name}</Text>
                  <Text style={[
                    styles.attendanceStatus,
                    { color: attendance[item.id] ? '#10b981' : '#64748b' }
                  ]}>
                    {attendance[item.id] ? '✓ Asistió' : '○ No asistió'}
                  </Text>
                </View>
              </View>
              
              <Switch
                value={attendance[item.id] || false}
                onValueChange={(value) => handleAttendanceChange(item.id, value)}
                thumbColor={attendance[item.id] ? '#ffffff' : '#ffffff'}
                trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          )}
          ListEmptyComponent={() => (
            searchText ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateText}>No se encontraron personas</Text>
                <Text style={styles.emptyStateSubtext}>
                  Intenta con otro término de búsqueda
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateText}>No hay personas registradas</Text>
                <Text style={styles.emptyStateSubtext}>
                  Agrega personas para poder registrar asistencia
                </Text>
              </View>
            )
          )}
        />
      </View>

      {/* Botón para guardar la asistencia */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            loading && styles.saveButtonDisabled
          ]}
          onPress={handleSaveAttendance}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.saveButtonContent}>
              <ActivityIndicator size="small" color="#ffffff" style={styles.saveButtonLoader} />
              <Text style={styles.saveButtonText}>Guardando...</Text>
            </View>
          ) : (
            <View style={styles.saveButtonContent}>
              <Ionicons name="save" size={20} color="#ffffff" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Guardar Asistencia</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  personItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastPersonItem: {
    marginBottom: 0,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  attendanceStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    backgroundColor: '#f8fafc',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.1,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonLoader: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});