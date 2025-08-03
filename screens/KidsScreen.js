import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../database/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function KidsScreen({ navigation }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true); // Empezar con true
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [modalLoading, setModalLoading] = useState(false); // Loading separado para el modal

  // Función para cargar las clases desde Firestore
  const fetchClasses = async () => {
    try {
      console.log("Cargando clases...");
      const snapshot = await getDocs(collection(db, "classes"));
      const classesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Clases cargadas:", classesList);
      setClasses(classesList);
    } catch (error) {
      console.error("Error al cargar clases:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de clases
  const handleOpenClassPicker = () => {
    console.log("Abriendo modal, clases disponibles:", classes.length);
    setShowClassPicker(true);
  };

  // Cargar clases al iniciar la pantalla
  useEffect(() => {
    fetchClasses();
  }, []);

  // Recargar clases cuando la pantalla recibe el foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Pantalla recibió foco, recargando clases...");
      fetchClasses();
    });

    return unsubscribe;
  }, [navigation]);

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
        <Text style={styles.loaderText}>Cargando clases...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>👶 Kids</Text>
        <Text style={styles.subtitle}>Gestión de niños y clases</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{classes.length}</Text>
            <Text style={styles.statLabel}>Clases registradas</Text>
          </View>
        </View>

        {/* Sección de acciones principales */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>🎯 Acciones principales</Text>
          
          <View style={styles.actionCards}>
            {/* Card de Registro */}
            <TouchableOpacity
              style={[styles.actionCard, styles.registerCard]}
              onPress={() => navigation.navigate("RegisterKid")}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, styles.registerIconContainer]}>
                  <Ionicons name="person-add" size={24} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Registrar Niño</Text>
              <Text style={styles.cardSubtitle}>
                Agrega nuevos niños a la base de datos
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="chevron-forward" size={20} color="#6366f1" />
              </View>
            </TouchableOpacity>

            {/* Card de Asistencia */}
            <TouchableOpacity
              style={[styles.actionCard, styles.attendanceCard]}
              onPress={handleOpenClassPicker}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, styles.attendanceIconContainer]}>
                  <Ionicons name="list" size={24} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Pasar Lista</Text>
              <Text style={styles.cardSubtitle}>
                Marca la asistencia de los niños por clase
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
              </View>
            </TouchableOpacity>

            {/* Card de Asistencia Mensual */}
            <TouchableOpacity
              style={[styles.actionCard, styles.monthlyCard]}
              onPress={() => navigation.navigate("MonthlyAttendanceScreen")}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, styles.monthlyIconContainer]}>
                  <Ionicons name="calendar" size={24} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Asistencia Mensual</Text>
              <Text style={styles.cardSubtitle}>
                Revisa la asistencia de los niños por mes
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="chevron-forward" size={20} color="#10b981" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de clases registradas */}
        {classes.length > 0 && (
          <View style={styles.classesSection}>
            <Text style={styles.sectionTitle}>🏫 Clases registradas</Text>
            <View style={styles.classesGrid}>
              {classes.map((classItem, index) => (
                <View
                  key={classItem.id}
                  style={[
                    styles.classChip,
                    index % 2 === 0 ? styles.classChipPrimary : styles.classChipSecondary
                  ]}
                >
                  <Ionicons 
                    name="school" 
                    size={16} 
                    color={index % 2 === 0 ? "#6366f1" : "#f59e0b"} 
                    style={styles.classChipIcon}
                  />
                  <Text style={[
                    styles.classChipText,
                    { color: index % 2 === 0 ? "#6366f1" : "#f59e0b" }
                  ]}>
                    {classItem.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mensaje cuando no hay clases */}
        {!loading && classes.length === 0 && (
          <View style={styles.noClassesSection}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏫</Text>
              <Text style={styles.emptyStateText}>No hay clases registradas</Text>
              <Text style={styles.emptyStateSubtext}>
                Necesitas registrar clases antes de poder gestionar niños
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchClasses}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#6366f1" style={styles.refreshIcon} />
                <Text style={styles.refreshText}>Recargar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal para seleccionar clase */}
      <Modal
        visible={showClassPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log("Modal cerrado por hardware back");
          setShowClassPicker(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {
            console.log("Tocado fuera del modal");
            setShowClassPicker(false);
          }}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Selecciona una Clase</Text>
              <Text style={styles.modalSubtitle}>
                Elige la clase para registrar asistencia
              </Text>
            </View>

            {loading || modalLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.modalLoadingText}>Cargando clases...</Text>
              </View>
            ) : (
              <>
                {console.log("Renderizando modal - Clases:", classes.length)}
                {classes.length > 0 ? (
                  <ScrollView 
                    style={styles.modalScrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalScrollContent}
                  >
                    <View style={styles.classesListContainer}>
                      {classes.map((classItem, index) => (
                        <TouchableOpacity
                          key={classItem.id}
                          style={[
                            styles.classModalItem,
                            index === classes.length - 1 && styles.lastClassModalItem
                          ]}
                          onPress={() => {
                            console.log("Navegando con clase:", classItem.name);
                            setShowClassPicker(false);
                            navigation.navigate("SelectDateAndSessionScreen", { 
                              classRoom: classItem.name 
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.classModalContent}>
                            <View style={styles.classModalIcon}>
                              <Ionicons name="school" size={20} color="#6366f1" />
                            </View>
                            <Text style={styles.classModalText}>{classItem.name}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>🏫</Text>
                    <Text style={styles.emptyStateText}>No hay clases registradas</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Agrega clases para poder registrar asistencia
                    </Text>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={() => {
                        console.log("Recargando clases desde modal...");
                        fetchClasses();
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={16} color="#6366f1" style={styles.refreshIcon} />
                      <Text style={styles.refreshText}>Recargar clases</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statCard: {
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
  actionsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  actionCards: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerIconContainer: {
    backgroundColor: '#6366f1',
  },
  attendanceIconContainer: {
    backgroundColor: '#f59e0b',
  },
  monthlyIconContainer: {
    backgroundColor: '#10b981',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardArrow: {
    alignSelf: 'flex-end',
  },
  classesSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  noClassesSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  classChipPrimary: {
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
  classChipSecondary: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  classChipIcon: {
    marginRight: 6,
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  classesListContainer: {
    padding: 24,
    paddingTop: 16,
  },
  classModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastClassModalItem: {
    borderBottomWidth: 0,
  },
  classModalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classModalIcon: {
    marginRight: 12,
  },
  classModalText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
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