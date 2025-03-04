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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Para los gradientes
import Icon from "react-native-vector-icons/MaterialIcons"; // Para los íconos
import { db } from "../database/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function RegisterKid({ navigation }) {
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [classRoom, setClassRoom] = useState(""); // Clase seleccionada
  const [classes, setClasses] = useState([]); // Lista de clases desde Firestore
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false); // Modal para seleccionar clase

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

  // Función para registrar un niño
  const registerKid = async () => {
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

      await addDoc(collection(db, "kids"), {
        name,
        birthDay,
        class: classRoom,
        isKid: true,
        createdAt: new Date(),
      });

      Alert.alert("Éxito", "Niño registrado con éxito");
      setName("");
      setBirthDay("");
      setClassRoom("");
      navigation.goBack(); // Regresar a la pantalla anterior
    } catch (error) {
      Alert.alert("Error", `Error al registrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Registrar Nuevo Niño</Text>

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

        {/* Botón de registro */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={registerKid}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.registerButtonText}>Registrar Niño</Text>
          )}
        </TouchableOpacity>
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
});