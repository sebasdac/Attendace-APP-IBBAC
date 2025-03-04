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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Para los gradientes
import Icon from "react-native-vector-icons/MaterialIcons"; // Para los íconos
import { db } from "../database/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function RegisterKid({ navigation }) {
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [classRoom, setClassRoom] = useState(""); // Clase seleccionada
  const [classes, setClasses] = useState([]); // Lista de clases desde Firestore
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false); // Modal para seleccionar clase
  const [kids, setKids] = useState([]); // Lista de niños
  const [isEditing, setIsEditing] = useState(false); // Modo edición
  const [selectedKid, setSelectedKid] = useState(null); // Niño seleccionado para editar
  const [loadingKids, setLoadingKids] = useState(false); // Estado de carga de niños
  const [dataLoaded, setDataLoaded] = useState(false); // Indica si los niños ya se cargaron

  // Función para validar la fecha de nacimiento
  const validateDate = (date) => {
    // Verifica que el formato sea dd/mm/yyyy
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(date)) {
      return false;
    }
    return true;
  };

  // Función para formatear la fecha de nacimiento
  const handleDateChange = (text) => {
    // Permite solo números
    const formattedText = text.replace(/[^0-9]/g, "");

    // Si la longitud del texto es mayor que 10, no hacer nada
    if (formattedText.length > 10) return;

    let finalText = formattedText;

    // Insertar los separadores '/'
    if (formattedText.length >= 3) {
      finalText = `${formattedText.slice(0, 2)}/${formattedText.slice(2)}`;
    }
    if (formattedText.length >= 5) {
      finalText = `${finalText.slice(0, 5)}/${finalText.slice(5)}`;
    }

    // Actualizar el estado con el texto formateado
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
      setDataLoaded(true); // Marcar que los datos se han cargado
    } catch (error) {
      console.error("Error al cargar niños:", error);
    } finally {
      setLoadingKids(false);
    }
  };

  // Función para registrar o actualizar un niño
  const saveKid = async () => {
    if (name.trim() === "" || birthDay === "" || classRoom === "") {
      Alert.alert("Error", "Por favor, ingresa todos los campos");
      return;
    }

    // Validar la fecha de nacimiento
    if (!validateDate(birthDay)) {
      Alert.alert("Error", "Por favor, ingresa una fecha válida en formato dd/mm/aaaa");
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        // Actualizar niño existente
        await updateDoc(doc(db, "kids", selectedKid.id), {
          name,
          birthDay,
          class: classRoom,
        });
        Alert.alert("Éxito", "Niño actualizado con éxito");
      } else {
        // Registrar nuevo niño
        await addDoc(collection(db, "kids"), {
          name,
          birthDay,
          class: classRoom,
          isKid: true,
          createdAt: new Date(),
        });
        Alert.alert("Éxito", "Niño registrado con éxito");
      }

      // Limpiar el formulario y recargar la lista de niños
      setName("");
      setBirthDay("");
      setClassRoom("");
      setIsEditing(false);
      setSelectedKid(null);
      fetchKids(); // Recargar la lista después de guardar
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
      fetchKids(); // Recargar la lista de niños
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
    setClassRoom(kid.class);
    setIsEditing(true);
  };

  // Cargar clases al iniciar la pantalla
  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Título de la pantalla */}
        <Text style={styles.title}>{isEditing ? "Editar Niño" : "Registrar Nuevo Niño"}</Text>

        {/* Campo de nombre */}
        <View style={styles.inputContainer}>
          <Icon name="person" size={24} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre del niño"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Campo de fecha de nacimiento */}
        <View style={styles.inputContainer}>
          <Icon name="cake" size={24} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Fecha de nacimiento (dd/mm/aaaa)"
            value={birthDay}
            onChangeText={handleDateChange} // Usar handleDateChange para formatear la fecha
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Selector de clase */}
        <TouchableOpacity
          style={styles.classPickerButton}
          onPress={() => setShowClassPicker(true)}
        >
          <Icon name="class" size={24} color="#666" style={styles.icon} />
          <Text style={styles.classPickerText}>
            {classRoom || "Selecciona una clase"}
          </Text>
        </TouchableOpacity>

        {/* Botón de registro o actualización */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={saveKid}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.registerButtonText}>
              {isEditing ? "Guardar Cambios" : "Registrar Niño"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Botón para cargar niños */}
        {!dataLoaded && (
          <TouchableOpacity
            style={styles.loadButton}
            onPress={fetchKids}
            disabled={loadingKids}
          >
            {loadingKids ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.loadButtonText}>Cargar Niños</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Lista de niños registrados */}
        {dataLoaded && (
          <>
            <Text style={styles.listHeader}>Niños Registrados</Text>
            <FlatList
              data={kids}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.kidItem}>
                  <Text style={styles.kidName}>{item.name}</Text>
                  <Text style={styles.kidDetails}>Fecha de nacimiento: {item.birthDay}</Text>
                  <Text style={styles.kidDetails}>Clase: {item.class}</Text>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => editKid(item)}
                    >
                      <Icon name="edit" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => confirmDeleteKid(item.id)}
                    >
                      <Icon name="delete" size={20} color="#FF5722" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </>
        )}
      </ScrollView>

      {/* Modal para seleccionar clase */}
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
          <Text style={styles.modalTitle}>Selecciona una Clase</Text>
          <ScrollView>
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={styles.classItem}
                onPress={() => {
                  setClassRoom(classItem.name);
                  setShowClassPicker(false);
                }}
              >
                <Text style={styles.classItemText}>{classItem.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  classPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  classPickerText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  registerButton: {
    backgroundColor: "#6a11cb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  loadButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  loadButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: "auto",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  classItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  classItemText: {
    fontSize: 16,
    color: "#333",
  },
  listHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  kidItem: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  kidName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  kidDetails: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    marginLeft: 10,
  },
});