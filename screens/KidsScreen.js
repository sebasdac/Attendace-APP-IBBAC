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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Para los gradientes
import Icon from "react-native-vector-icons/MaterialIcons"; // Para los íconos
import { db } from "../database/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function KidsScreen({ navigation }) {
  const [classes, setClasses] = useState([]); // Lista de clases desde Firestore
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false); // Modal para seleccionar clase

  // Función para cargar las clases desde Firestore
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "classes"));
      const classesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesList);
    } catch (error) {
      console.error("Error al cargar clases:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar clases al iniciar la pantalla
  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Kids</Text>
      {/* Card de Registro */}
      <TouchableOpacity onPress={() => navigation.navigate("RegisterKid")}>
        <LinearGradient
          colors={["#6a11cb", "#2575fc"]} // Gradiente morado a azul
          style={styles.card}
        >
          <Icon name="person-add" size={40} color="#FFF" />
          <Text style={styles.cardTitle}>Registrar Niño</Text>
          <Text style={styles.cardSubtitle}>Agrega nuevos niños a la base de datos.</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Card de Asistencia */}
      <TouchableOpacity onPress={() => setShowClassPicker(true)}>
        <LinearGradient
          colors={["#ff7e5f", "#feb47b"]} // Gradiente naranja a rosa
          style={styles.card}
        >
          <Icon name="list-alt" size={40} color="#FFF" />
          <Text style={styles.cardTitle}>Pasar Lista</Text>
          <Text style={styles.cardSubtitle}>Marca la asistencia de los niños.</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal para seleccionar clase (solo para pasar lista) */}
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
          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : (
            <ScrollView>
              {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={styles.classItem}
                  onPress={() => {
                    setShowClassPicker(false);
                    navigation.navigate("SelectDateAndSessionScreen", { classRoom: classItem.name });
                  }}
                >
                  <Text style={styles.classItemText}>{classItem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
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
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
    
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
    textAlign: "center",
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