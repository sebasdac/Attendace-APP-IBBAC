import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  FlatList,
  Button,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../database/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterKid({ navigation }) {
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [comments, setComments] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showFilterClassPicker, setShowFilterClassPicker] = useState(false);
  const [kids, setKids] = useState([]);
  const [filteredKids, setFilteredKids] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKid, setSelectedKid] = useState(null);
  const [loadingKids, setLoadingKids] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchClass, setSearchClass] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [showNewOptionNotice, setShowNewOptionNotice] = useState(false);

  useEffect(() => {
    const checkIfNoticeWasShown = async () => {
      const noticeShown = await AsyncStorage.getItem("newOptionNoticeShownKids");
      if (!noticeShown) {
        setShowNewOptionNotice(true);
      }
    };
    checkIfNoticeWasShown();
  }, []);

  // Función para validar la fecha de nacimiento
  const validateDate = (date) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(date)) {
      return false;
    }
    return true;
  };

  // Función para formatear la fecha de nacimiento
  const handleDateChange = (text) => {
    const formattedText = text.replace(/[^0-9]/g, "");
    if (formattedText.length > 10) return;

    let finalText = formattedText;
    if (formattedText.length >= 3) {
      finalText = `${formattedText.slice(0, 2)}/${formattedText.slice(2)}`;
    }
    if (formattedText.length >= 5) {
      finalText = `${finalText.slice(0, 5)}/${finalText.slice(5)}`;
    }
    setBirthDay(finalText);
  };

  // Función para cargar las clases desde Firestore
  const fetchClasses = async () => {
    try {
      const snapshot = await getDocs(collection(db, "classes"));
      const classesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesList);
    } catch (error) {
      console.error("Error al cargar clases:", error);
    }
  };

  // Función para cargar los niños desde Firestore
  const fetchKids = async () => {
    setLoadingKids(true);
    try {
      const snapshot = await getDocs(collection(db, "kids"));
      const kidsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setKids(kidsList);
      setFilteredKids(kidsList);
      setDataLoaded(true);
      setShowFilters(true);
    } catch (error) {
      console.error("Error al cargar niños:", error);
    } finally {
      setLoadingKids(false);
    }
  };

  // Función para seleccionar/deseleccionar una clase
  const toggleClassSelection = (classItem) => {
    setSelectedClasses((prev) => {
      if (prev.includes(classItem.name)) {
        return prev.filter((item) => item !== classItem.name);
      } else {
        return [...prev, classItem.name];
      }
    });
  };

  // Función para registrar o actualizar un niño
  const saveKid = async () => {
    if (name.trim() === "" || birthDay === "" || selectedClasses.length === 0) {
      Alert.alert("Error", "Por favor, ingresa todos los campos");
      return;
    }

    if (!validateDate(birthDay)) {
      Alert.alert("Error", "Por favor, ingresa una fecha válida en formato dd/mm/aaaa");
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await updateDoc(doc(db, "kids", selectedKid.id), {
          name,
          birthDay,
          isNew,
          classes: selectedClasses,
          comments,
        });
        Alert.alert("Éxito", "Niño actualizado con éxito");
      } else {
        await addDoc(collection(db, "kids"), {
          name,
          birthDay,
          classes: selectedClasses,
          isKid: true,
          isNew,
          comments,
          createdAt: new Date(),
        });
        Alert.alert("Éxito", "Niño registrado con éxito");
      }

      // Limpiar el formulario y recargar la lista de niños
      setName("");
      setBirthDay("");
      setComments("");
      setSelectedClasses([]);
      setIsEditing(false);
      setSelectedKid(null);
      setIsNew(false);
      fetchKids();
    } catch (error) {
      Alert.alert("Error", `Error al ${isEditing ? "actualizar" : "registrar"}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un niño
  const deleteKid = async (id) => {
    try {
      await deleteDoc(doc(db, "kids", id));
      Alert.alert("Éxito", "Niño eliminado con éxito");
      fetchKids();
    } catch (error) {
      Alert.alert("Error", `Error al eliminar: ${error.message}`);
    }
  };

  // Función para confirmar la eliminación de un niño
  const confirmDeleteKid = (id) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar este niño?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: () => deleteKid(id),
          style: "destructive",
        },
      ]
    );
  };

  // Función para editar un niño
  const editKid = (kid) => {
    setSelectedKid(kid);
    setName(kid.name);
    setBirthDay(kid.birthDay);
    setSelectedClasses(kid.classes);
    setComments(kid.comments || "");
    setIsNew(kid.isNew || false);
    setIsEditing(true);
  };

  // Función para filtrar la lista de niños por nombre y clase
  const filterKids = () => {
    let filtered = kids;

    if (searchName) {
      filtered = filtered.filter((kid) =>
        kid.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchClass) {
      filtered = filtered.filter((kid) =>
        kid.classes.includes(searchClass)
      );
    }

    setFilteredKids(filtered);
  };

  // Efecto para aplicar el filtro cada vez que cambia el nombre o la clase
  useEffect(() => {
    filterKids();
  }, [searchName, searchClass, kids]);

  // Cargar clases al iniciar la pantalla
  useEffect(() => {
    fetchClasses();
  }, []);

  const clearForm = () => {
    setName("");
    setBirthDay("");
    setComments("");
    setSelectedClasses([]);
    setIsEditing(false);
    setSelectedKid(null);
    setIsNew(false);
  };

  if (loadingKids && kids.length === 0 && dataLoaded === false) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/preloader.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loaderText}>Cargando niños...</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      {/* Header con gradiente */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>
          {isEditing ? "✏️ Editar Niño" : "👶 Registrar Niño"}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing ? "Modifica la información del niño" : "Agrega un nuevo niño a la base de datos"}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Estadísticas rápidas */}
        {dataLoaded && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{kids.length}</Text>
              <Text style={styles.statLabel}>Niños registrados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{filteredKids.length}</Text>
              <Text style={styles.statLabel}>Mostrando</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {kids.filter(kid => kid.isNew).length}
              </Text>
              <Text style={styles.statLabel}>Nuevos</Text>
            </View>
          </View>
        )}

        {/* Formulario */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>📝 Información del niño</Text>
          
          <View style={styles.formCard}>
            {/* Campo de nombre */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="person" size={20} color="#6366f1" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nombre del niño"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Campo de fecha de nacimiento */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="calendar" size={20} color="#6366f1" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Fecha de nacimiento (dd/mm/aaaa)"
                value={birthDay}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Campo de comentarios */}
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <View style={styles.inputIcon}>
                <Ionicons name="document-text" size={20} color="#6366f1" />
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Comentarios (opcional)"
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
              />
            </View>

            {/* Selector de clases */}
            <TouchableOpacity
              style={styles.classPickerContainer}
              onPress={() => setShowClassPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputIcon}>
                <Ionicons name="library" size={20} color="#6366f1" />
              </View>
              <View style={styles.classPickerContent}>
                <Text style={[
                  styles.classPickerText,
                  selectedClasses.length === 0 && styles.classPickerPlaceholder
                ]}>
                  {selectedClasses.length > 0
                    ? selectedClasses.join(", ")
                    : "Selecciona una o más clases"}
                </Text>
                {selectedClasses.length > 0 && (
                  <View style={styles.classesBadgeContainer}>
                    <Text style={styles.classesBadge}>
                      {selectedClasses.length} clase{selectedClasses.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {/* Switch para "¿Es nuevo?" */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Ionicons name="star" size={20} color="#f59e0b" style={styles.switchIcon} />
                <Text style={styles.switchLabel}>¿Es nuevo?</Text>
              </View>
              <Switch
                value={isNew}
                onValueChange={(value) => setIsNew(value)}
                trackColor={{ false: "#e2e8f0", true: "#10b981" }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e2e8f0"
              />
            </View>

            {/* Botones de acción */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveKid}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons 
                      name={isEditing ? "checkmark" : "add"} 
                      size={20} 
                      color="#ffffff" 
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>
                      {isEditing ? "Guardar Cambios" : "Registrar Niño"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={clearForm}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#64748b" style={styles.buttonIcon} />
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Botón para cargar niños */}
        {!dataLoaded && (
          <View style={styles.loadSection}>
            <TouchableOpacity
              style={styles.loadButton}
              onPress={fetchKids}
              disabled={loadingKids}
              activeOpacity={0.8}
            >
              {loadingKids ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="download" size={20} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Cargar Niños Registrados</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Filtros de búsqueda */}
        {showFilters && (
          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>🔍 Buscar niños</Text>
            
            <View style={styles.filtersCard}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="search" size={20} color="#6366f1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar por nombre..."
                  value={searchName}
                  onChangeText={setSearchName}
                  placeholderTextColor="#94a3b8"
                />
                {searchName.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchName('')}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.classPickerContainer}
                onPress={() => setShowFilterClassPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.inputIcon}>
                  <Ionicons name="filter" size={20} color="#6366f1" />
                </View>
                <Text style={[
                  styles.classPickerText,
                  !searchClass && styles.classPickerPlaceholder
                ]}>
                  {searchClass || "Filtrar por clase"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>

              {(searchName || searchClass) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchName('');
                    setSearchClass('');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color="#64748b" style={styles.buttonIcon} />
                  <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Lista de niños registrados */}
        {dataLoaded && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>
              👶 Niños registrados ({filteredKids.length})
            </Text>
            
            {filteredKids.length > 0 ? (
              <FlatList
                data={filteredKids}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={[
                    styles.kidCard,
                    index === filteredKids.length - 1 && styles.lastKidCard
                  ]}>
                    <View style={styles.kidHeader}>
                      <View style={styles.kidAvatar}>
                        <Text style={styles.kidInitial}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.kidInfo}>
                        <View style={styles.kidNameContainer}>
                          <Text style={styles.kidName}>{item.name}</Text>
                          {item.isNew && (
                            <View style={styles.newBadge}>
                              <Ionicons name="star" size={12} color="#ffffff" />
                              <Text style={styles.newBadgeText}>Nuevo</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.kidDetail}>
                          📅 {item.birthDay}
                        </Text>
                        <Text style={styles.kidDetail}>
                          🏫 {item.classes.join(", ")}
                        </Text>
                        {item.comments && (
                          <Text style={styles.kidComment}>
                            💬 {item.comments}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.kidActions}>
                      <TouchableOpacity
                        style={[styles.kidActionButton, styles.editActionButton]}
                        onPress={() => editKid(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={16} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.kidActionButton, styles.deleteActionButton]}
                        onPress={() => confirmDeleteKid(item.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateText}>
                  {searchName || searchClass ? "No se encontraron niños" : "No hay niños registrados"}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchName || searchClass 
                    ? "Intenta con otros términos de búsqueda" 
                    : "Agrega el primer niño usando el formulario"}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal para seleccionar clases en el formulario */}
      <Modal
        visible={showClassPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowClassPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecciona Clases</Text>
            <Text style={styles.modalSubtitle}>
              Elige una o más clases para el niño
            </Text>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.classesListContainer}>
              {classes.map((classItem, index) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={[
                    styles.classModalItem,
                    index === classes.length - 1 && styles.lastClassModalItem
                  ]}
                  onPress={() => toggleClassSelection(classItem)}
                  activeOpacity={0.7}
                >
                  <View style={styles.classModalContent}>
                    <View style={styles.classModalIcon}>
                      <Ionicons name="library" size={20} color="#6366f1" />
                    </View>
                    <Text style={styles.classModalText}>{classItem.name}</Text>
                  </View>
                  {selectedClasses.includes(classItem.name) && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para filtrar por clase */}
      <Modal
        visible={showFilterClassPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterClassPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilterClassPicker(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtrar por Clase</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona una clase para filtrar
            </Text>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.classesListContainer}>
              <TouchableOpacity
                style={styles.classModalItem}
                onPress={() => {
                  setSearchClass('');
                  setShowFilterClassPicker(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.classModalContent}>
                  <View style={styles.classModalIcon}>
                    <Ionicons name="refresh" size={20} color="#64748b" />
                  </View>
                  <Text style={styles.classModalText}>Todas las clases</Text>
                </View>
                {!searchClass && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>

              {classes.map((classItem, index) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={[
                    styles.classModalItem,
                    index === classes.length - 1 && styles.lastClassModalItem
                  ]}
                  onPress={() => {
                    setSearchClass(classItem.name);
                    setShowFilterClassPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.classModalContent}>
                    <View style={styles.classModalIcon}>
                      <Ionicons name="library" size={20} color="#6366f1" />
                    </View>
                    <Text style={styles.classModalText}>{classItem.name}</Text>
                  </View>
                  {searchClass === classItem.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de aviso para nueva opción */}
      <Modal
        visible={showNewOptionNotice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewOptionNotice(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNewOptionNotice(false)}>
          <View style={styles.noticeModalOverlay}>
            <View style={styles.noticeModalContent}>
              <View style={styles.noticeIcon}>
                <Ionicons name="star" size={32} color="#f59e0b" />
              </View>
              <Text style={styles.noticeTitle}>¡Nueva Función!</Text>
              <Text style={styles.noticeText}>
                Ahora puedes marcar a los niños como "nuevos" usando la opción "¿Es nuevo?".
              </Text>
              <TouchableOpacity
                style={styles.noticeButton}
                onPress={() => {
                  AsyncStorage.setItem("newOptionNoticeShownKids", "true");
                  setShowNewOptionNotice(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.noticeButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  classPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  classPickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classPickerText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  classPickerPlaceholder: {
    color: '#94a3b8',
  },
  classesBadgeContainer: {
    marginLeft: 8,
  },
  classesBadge: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchIcon: {
    marginRight: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButtonText: {
    color: '#64748b',
  },
  loadSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  filtersSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  filtersCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  kidCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lastKidCard: {
    marginBottom: 0,
  },
  kidHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kidAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kidInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  kidInfo: {
    flex: 1,
  },
  kidNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  kidName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 8,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 2,
  },
  kidDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  kidComment: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  kidActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  kidActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionButton: {
    backgroundColor: '#dcfce7',
  },
  deleteActionButton: {
    backgroundColor: '#fee2e2',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  modalScrollView: {
    maxHeight: 400,
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
  noticeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noticeModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  noticeIcon: {
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  noticeText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  noticeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  noticeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
