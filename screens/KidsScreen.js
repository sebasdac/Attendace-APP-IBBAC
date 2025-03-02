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
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function KidsScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [classRoom, setClassRoom] = useState(""); // Clase seleccionada
  const [classes, setClasses] = useState([]); // Lista de clases desde Firestore
  const [message, setMessage] = useState("");
  const [kids, setKids] = useState([]);
  const [filteredKids, setFilteredKids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingKids, setLoadingKids] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKid, setSelectedKid] = useState(null);
  const [search, setSearch] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false); // Estado para mostrar/ocultar el selector de clases

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

  // Función para validar la fecha de nacimiento
  const validateDate = (date) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(date)) {
      return false;
    }
    return true;
  };

  // Función para registrar un niño
  const registerKid = async () => {
    if (name.trim() === "" || birthDay === "" || classRoom === "") {
      setMessage("Por favor, ingresa todos los campos");
      return;
    }

    if (!validateDate(birthDay)) {
      setMessage("Por favor, ingresa una fecha válida en formato dd/mm/aaaa");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "kids"), {
        name,
        birthDay,
        class: classRoom, // Guardar la clase seleccionada
        isKid: true, // Siempre será true para niños
        createdAt: new Date(),
      });

      setMessage("Niño registrado con éxito");
      setName("");
      setBirthDay("");
      setClassRoom("");
      fetchKids(); // Refrescar la lista después de registrar
    } catch (error) {
      setMessage(`Error al registrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar la lista de niños desde Firestore
  const fetchKids = async () => {
    setLoadingKids(true);
    try {
      const snapshot = await getDocs(collection(db, "kids"));
      const kidsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedKids = kidsList.sort((a, b) => a.name.localeCompare(b.name));
      setKids(sortedKids);
      setFilteredKids(sortedKids);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error al cargar niños:", error);
    } finally {
      setLoadingKids(false);
    }
  };

  // Función para eliminar un niño
  const deleteKid = async (id) => {
    try {
      await deleteDoc(doc(db, "kids", id));
      fetchKids(); // Refrescar la lista después de eliminar
    } catch (error) {
      console.error("Error al eliminar niño:", error);
    }
  };

  // Función para editar un niño
  const editKid = (kid) => {
    setSelectedKid(kid);
    setName(kid.name);
    setBirthDay(kid.birthDay);
    setClassRoom(kid.class);
    setIsEditing(true);
  };

  // Función para guardar los cambios de un niño editado
  const saveChanges = async () => {
    if (name.trim() === "" || birthDay === "" || classRoom === "") {
      setMessage("Por favor, ingresa todos los campos");
      return;
    }

    if (!validateDate(birthDay)) {
      setMessage("Por favor, ingresa una fecha válida en formato dd/mm/aaaa");
      return;
    }

    try {
      setLoading(true);

      const kidRef = doc(db, "kids", selectedKid.id);
      await updateDoc(kidRef, {
        name,
        birthDay,
        class: classRoom,
      });

      setMessage("Niño actualizado con éxito");
      setIsEditing(false);
      setName("");
      setBirthDay("");
      setClassRoom("");
      fetchKids(); // Refrescar la lista después de la edición
    } catch (error) {
      setMessage(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar niños por nombre
  const filterKids = (searchText) => {
    setSearch(searchText);
    const normalizedSearch = searchText.toLowerCase();
    const filtered = kids.filter((kid) =>
      kid.name.toLowerCase().includes(normalizedSearch)
    );
    setFilteredKids(filtered);
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

  // Cargar clases y niños al iniciar la pantalla
  useEffect(() => {
    fetchClasses();
    fetchKids();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Registro de Niños</Text>

        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de nacimiento (dd/mm/aaaa)"
              value={birthDay}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowClassPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {classRoom || "Selecciona una clase"}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <Button
                  title="Guardar Cambios"
                  onPress={saveChanges}
                  color="#28a745"
                />
              )}
            </View>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de nacimiento (dd/mm/aaaa)"
              value={birthDay}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowClassPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {classRoom || "Selecciona una clase"}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={registerKid}
                >
                  <Text style={styles.registerButtonText}>Registrar</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      {/* Modal para el selector de clases */}
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
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.classItem}
                onPress={() => {
                  setClassRoom(item.name);
                  setShowClassPicker(false);
                }}
              >
                <Text style={styles.classItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Niños Registrados</Text>
        {!dataLoaded && (
          <TouchableOpacity
            style={styles.loadButton}
            onPress={fetchKids}
            disabled={loadingKids}
          >
            {loadingKids ? (
              <ActivityIndicator size="small" color="#111" />
            ) : (
              <Text style={styles.loadButtonText}>Cargar Niños</Text>
            )}
          </TouchableOpacity>
        )}

        {dataLoaded && (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre"
              value={search}
              onChangeText={filterKids}
            />
            {loadingKids ? (
              <ActivityIndicator size="large" color="#111" style={styles.loader} />
            ) : (
              <FlatList
                data={filteredKids}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.personItem}>
                    <Text style={styles.personName}>{item.name}</Text>
                    <Text style={styles.personPhone}>
                      Fecha de nacimiento: {item.birthDay}
                    </Text>
                    <Text style={styles.personPhone}>Clase: {item.class}</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => editKid(item)}
                      >
                        <Text style={styles.optionText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => deleteKid(item.id)}
                      >
                        <Text style={styles.optionText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 40,
  },
  input: {
    height: 45,
    borderColor: "#DDD",
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#111",
    fontSize: 16,
  },
  pickerButton: {
    height: 45,
    borderColor: "#DDD",
    borderWidth: 1,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingLeft: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#111",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  classItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  classItemText: {
    fontSize: 16,
    color: "#111",
  },
  message: {
    marginTop: 10,
    textAlign: "center",
    color: "#007BFF",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 15,
    marginTop: 5,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: "100%",
  },
  listHeader: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#111",
  },
  searchInput: {
    height: 40,
    borderColor: "#DDD",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#111",
    fontSize: 16,
    marginVertical: 10,
  },
  personItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginBottom: 8,
    width: "100%",
  },
  personName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  personPhone: {
    fontSize: 16,
    color: "#555",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
  },
  optionText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loader: {
    marginTop: 10,
  },
  registerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  loadButton: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "bold",
  },
});