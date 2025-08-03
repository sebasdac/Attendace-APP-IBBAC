import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { db } from "../database/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { DateTimePicker } from "@react-native-community/datetimepicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AttendanceScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [message, setMessage] = useState("");
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [search, setSearch] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [showNewOptionNotice, setShowNewOptionNotice] = useState(false);

  useEffect(() => {
    const checkIfNoticeWasShown = async () => {
      const noticeShown = await AsyncStorage.getItem("newOptionNoticeShown");
      if (!noticeShown) {
        setShowNewOptionNotice(true);
      }
    };

    checkIfNoticeWasShown();
  }, []);

  const phoneRegex = /^[0-9]{8}$/;

  const validateDate = (date) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(date)) {
      return false;
    }
    return true;
  };

  const registerPerson = async () => {
    if (name.trim() === "" || phone.trim() === "" || birthDay === "") {
      setMessage("Por favor, ingresa todos los campos");
      return;
    }

    if (!phoneRegex.test(phone)) {
      setMessage("Por favor, ingresa un número de teléfono válido (8 dígitos)");
      return;
    }

    if (!validateDate(birthDay)) {
      setMessage("Por favor, ingresa una fecha válida en formato dd/mm/aaaa");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "people"), {
        name,
        phone,
        birthDay,
        isNew,
        createdAt: new Date(),
      });

      setMessage("Persona registrada con éxito");
      setName("");
      setPhone("");
      setIsNew(false);
      setBirthDay("");
      fetchPeople();
    } catch (error) {
      setMessage(`Error al registrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeletePerson = (personId) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar esta persona?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: () => deletePerson(personId),
          style: "destructive",
        },
      ]
    );
  };

  const fetchPeople = async () => {
    setLoadingPeople(true);
    try {
      const snapshot = await getDocs(collection(db, "people"));
      const peopleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedPeople = peopleList.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setPeople(sortedPeople);
      setFilteredPeople(sortedPeople);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error al cargar personas:", error);
    } finally {
      setLoadingPeople(false);
    }
  };

  const deletePerson = async (id) => {
    try {
      await deleteDoc(doc(db, "people", id));
      fetchPeople();
    } catch (error) {
      console.error("Error al eliminar persona:", error);
    }
  };

  const editPerson = (person) => {
    setSelectedPerson(person);
    setName(person.name);
    const phoneString = person.phone ? person.phone.toString() : "";
    setPhone(phoneString);
    setBirthDay(person.birthDay);
    setIsNew(person.isNew || false);
    setIsEditing(true);
  };

  const saveChanges = async () => {
    if (name.trim() === "" || phone.trim() === "") {
      setMessage("Por favor, ingresa todos los campos");
      return;
    }

    if (!validateDate(birthDay)) {
      setMessage("Por favor, ingresa una fecha válida en formato dd/mm/aaaa");
      return;
    }

    if (!phoneRegex.test(phone)) {
      setMessage("Por favor, ingresa un número de teléfono válido (8 dígitos)");
      return;
    }

    try {
      setLoading(true);

      const personRef = doc(db, "people", selectedPerson.id);
      await updateDoc(personRef, {
        name,
        phone,
        birthDay,
        isNew,
      });

      setMessage("Persona actualizada con éxito");
      setIsEditing(false);
      setName("");
      setPhone("");
      setBirthDay("");
      setIsNew(false);
      fetchPeople();
    } catch (error) {
      setMessage(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeDiacritics = (text) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filterPeople = (searchText) => {
    setSearch(searchText);
    const normalizedSearch = removeDiacritics(searchText.toLowerCase());
    const filtered = people.filter((person) => {
      const normalizedPersonName = removeDiacritics(person.name.toLowerCase());
      return normalizedPersonName.includes(normalizedSearch);
    });
    setFilteredPeople(filtered);
  };

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

  const cancelEdit = () => {
    setIsEditing(false);
    setName("");
    setPhone("");
    setBirthDay("");
    setIsNew(false);
    setSelectedPerson(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con gradiente */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>
            {isEditing ? "✏️ Editar Persona" : "👥 Registro de Personas"}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing ? "Modifica la información" : "Agregar nueva persona"}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>👤 Nombre completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa el nombre"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📱 Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de 8 dígitos"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={8}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🎂 Fecha de nacimiento</Text>
              <TextInput
                style={styles.input}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#94a3b8"
                value={birthDay}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.switchGroup}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>⭐ ¿Es nuevo?</Text>
                <Text style={styles.switchSubtitle}>
                  Marca si es la primera vez que asiste
                </Text>
              </View>
              <Switch
                value={isNew}
                onValueChange={(value) => setIsNew(value)}
                trackColor={{ false: "#e2e8f0", true: "#6366f1" }}
                thumbColor={isNew ? "#ffffff" : "#94a3b8"}
              />
            </View>

            {/* Mensaje de estado */}
            {message ? (
              <View style={styles.messageContainer}>
                <Text style={[
                  styles.message,
                  message.includes('éxito') ? styles.successMessage : styles.errorMessage
                ]}>
                  {message}
                </Text>
              </View>
            ) : null}

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={cancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={saveChanges}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.registerButton]}
                  onPress={registerPerson}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.registerButtonText}>Registrar Persona</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Lista de personas */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>📋 Personas Registradas</Text>
          
          {!dataLoaded ? (
            <TouchableOpacity
              style={styles.loadButton}
              onPress={fetchPeople}
              disabled={loadingPeople}
            >
              {loadingPeople ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <>
                  <Text style={styles.loadButtonText}>Cargar lista de personas</Text>
                  <Text style={styles.loadButtonSubtext}>Toca para ver todas las personas</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* Buscador */}
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Buscar por nombre..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={filterPeople}
              />

              {/* Lista */}
              {loadingPeople ? (
                <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
              ) : filteredPeople.length > 0 ? (
                <FlatList
                  data={filteredPeople}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.personCard}>
                      <View style={styles.personHeader}>
                        <View style={styles.personInfo}>
                          <Text style={styles.personName}>{item.name}</Text>
                          {item.isNew && (
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>NUEVO</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.personDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailIcon}>📱</Text>
                          <Text style={styles.detailText}>{item.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailIcon}>🎂</Text>
                          <Text style={styles.detailText}>{item.birthDay}</Text>
                        </View>
                      </View>

                      <View style={styles.personActions}>
                        <TouchableOpacity
                          style={[styles.personActionButton, styles.editButton]}
                          onPress={() => editPerson(item)}
                        >
                          <Text style={styles.editButtonText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.personActionButton, styles.deleteButton]}
                          onPress={() => confirmDeletePerson(item.id)}
                        >
                          <Text style={styles.deleteButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>👤</Text>
                  <Text style={styles.emptyStateText}>No se encontraron personas</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {search ? 'Intenta con otro término de búsqueda' : 'Registra la primera persona'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Modal de nueva característica */}
        <Modal
          visible={showNewOptionNotice}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNewOptionNotice(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowNewOptionNotice(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalIcon}>⭐</Text>
                <Text style={styles.modalTitle}>¡Nueva Característica!</Text>
                <Text style={styles.modalText}>
                  Ahora puedes marcar a las personas como "nuevos" usando la opción "¿Es nuevo?".
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    AsyncStorage.setItem("newOptionNoticeShown", "true");
                    setShowNewOptionNotice(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Entendido</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flex: 1,
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
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#334155',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  messageContainer: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  successMessage: {
    color: '#059669',
    backgroundColor: '#d1fae5',
  },
  errorMessage: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: '#6366f1',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  loadButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  loadButtonSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#334155',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personHeader: {
    marginBottom: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  personDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  personActions: {
    flexDirection: 'row',
    gap: 12,
  },
  personActionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#334155",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#64748b",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});