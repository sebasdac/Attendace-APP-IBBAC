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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Para los gradientes
import Icon from "react-native-vector-icons/MaterialIcons"; // Para los íconos
import { db } from "../database/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Switch } from "react-native"; // Importa el Switch
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterKid({ navigation }) {
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]); // Array de clases seleccionadas
  const [classes, setClasses] = useState([]); // Lista de clases desde Firestore
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false); // Modal para seleccionar clase en el formulario
  const [showFilterClassPicker, setShowFilterClassPicker] = useState(false); // Modal para seleccionar clase en el filtro
  const [kids, setKids] = useState([]); // Lista de niños
  const [filteredKids, setFilteredKids] = useState([]); // Lista de niños filtrados
  const [isEditing, setIsEditing] = useState(false); // Modo edición
  const [selectedKid, setSelectedKid] = useState(null); // Niño seleccionado para editar
  const [loadingKids, setLoadingKids] = useState(false); // Estado de carga de niños
  const [dataLoaded, setDataLoaded] = useState(false); // Indica si los niños ya se cargaron
  const [searchName, setSearchName] = useState(""); // Filtro por nombre
  const [searchClass, setSearchClass] = useState(""); // Filtro por clase
  const [showFilters, setShowFilters] = useState(false); // Mostrar campos de búsqueda
  const [isNew, setIsNew] = useState(false); // Estado para "¿Es nuevo?"
  const [showNewOptionNotice, setShowNewOptionNotice] = useState(false);//para mostral modal

  const [showSpecialNeedsModal, setShowSpecialNeedsModal] = useState(false); // Estado para mostrar/ocultar el modal
  const [allergies, setAllergies] = useState(""); // Alergias
  const [parentName, setParentName] = useState(""); // Nombre del padre
  const [parentPhone, setParentPhone] = useState(""); // Teléfono del padre
  const [specialCondition, setSpecialCondition] = useState(""); // Condición especial



  useEffect(() => {
    const checkIfNoticeWasShown = async () => {
      const noticeShown = await AsyncStorage.getItem("newOptionNoticeShownKids");
      if (!noticeShown) {
        setShowNewOptionNotice(true); // Mostrar el aviso si no se ha mostrado antes
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
      setFilteredKids(kidsList); // Inicializar la lista filtrada con todos los niños
      setDataLoaded(true);
      setShowFilters(true); // Mostrar los campos de búsqueda después de cargar los niños
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
        return prev.filter((item) => item !== classItem.name); // Deseleccionar
      } else {
        return [...prev, classItem.name]; // Seleccionar
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
  
      const kidData = {
        name,
        birthDay,
        isNew,
        classes: selectedClasses,
        allergies,
        parentName,
        parentPhone,
        specialCondition,
        isKid: true,
        createdAt: new Date(),
      };
  
      if (isEditing) {
        // Actualizar niño existente
        await updateDoc(doc(db, "kids", selectedKid.id), kidData);
        Alert.alert("Éxito", "Niño actualizado con éxito");
      } else {
        // Registrar nuevo niño
        await addDoc(collection(db, "kids"), kidData);
        Alert.alert("Éxito", "Niño registrado con éxito");
      }
  
      // Limpiar el formulario y recargar la lista de niños
      setName("");
      setBirthDay("");
      setSelectedClasses([]);
      setIsEditing(false);
      setSelectedKid(null);
      setIsNew(false);
      setAllergies("");
      setParentName("");
      setParentPhone("");
      setSpecialCondition("");
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
    setSelectedClasses(kid.classes); // Cargar las clases seleccionadas
    setIsNew(kid.isNew || false); // Cargar el valor de isNew
    setIsEditing(true);
  };

  // Función para filtrar la lista de niños por nombre y clase
  const filterKids = () => {
    let filtered = kids;

    // Filtrar por nombre
    if (searchName) {
      filtered = filtered.filter((kid) =>
        kid.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filtrar por clase
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
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        

        {/* Selector de clases */}
        <TouchableOpacity
          style={styles.classPickerButton}
          onPress={() => setShowClassPicker(true)}
        >
          <Icon name="class" size={24} color="#666" style={styles.icon} />
          <Text style={styles.classPickerText}>
            {selectedClasses.length > 0
              ? selectedClasses.join(", ")
              : "Selecciona una o más clases"}
          </Text>
        </TouchableOpacity>
         {/* Switch para "¿Es nuevo?" */}
         <View style={styles.switchContainer}>
          <Text>¿Es nuevo?</Text>
          <Switch
            value={isNew} // El valor del Switch está vinculado al estado isNew
            onValueChange={(value) => setIsNew(value)} // Actualiza el estado isNew cuando el usuario cambia el Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isNew ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={styles.specialNeedsButton}
          onPress={() => setShowSpecialNeedsModal(true)} // Abrir el modal
        >
          <Icon name="accessible" size={24} color="#FFF" style={styles.icon} />
          <Text style={styles.specialNeedsButtonText}>Necesidades Especiales</Text>
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

        {/* Campos de búsqueda (solo se muestran después de cargar los niños) */}
        {showFilters && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre"
              value={searchName}
              onChangeText={setSearchName}
            />
            <TouchableOpacity
              style={styles.classPickerButton}
              onPress={() => setShowFilterClassPicker(true)}
            >
              <Icon name="class" size={24} color="#666" style={styles.icon} />
              <Text style={styles.classPickerText}>
                {searchClass || "Buscar por clase"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de niños registrados */}
        {dataLoaded && (
          <>
            <Text style={styles.listHeader}>Niños Registrados</Text>
            <FlatList
              data={filteredKids}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.kidItem}>
                  <Text style={styles.kidName}>{item.name}</Text>
                  <Text style={styles.kidDetails}>Fecha de nacimiento: {item.birthDay}</Text>
                  <Text style={styles.kidDetails}>Clases: {item.classes.join(", ")}</Text>
                  {item.isNew && <Text style={styles.isNew}>Es nuevo</Text>}
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
          <Text style={styles.modalTitle}>Selecciona una o más Clases</Text>
          <ScrollView>
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={styles.classItem}
                onPress={() => {
                  toggleClassSelection(classItem); // Seleccionar clase para registro
                  setShowClassPicker(false);
                }}
              >
                <Text style={styles.classItemText}>{classItem.name}</Text>
                {selectedClasses.includes(classItem.name) && (
                  <Icon name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal para seleccionar clases en el filtro */}
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
          <Text style={styles.modalTitle}>Selecciona una Clase para Filtrar</Text>
          <ScrollView>
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={styles.classItem}
                onPress={() => {
                  setSearchClass(classItem.name); // Seleccionar clase para filtrar
                  setShowFilterClassPicker(false);
                }}
              >
                <Text style={styles.classItemText}>{classItem.name}</Text>
                {searchClass === classItem.name && (
                  <Icon name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>


     {/* modal de condiciones especiales*/}
     {/* Modal para Necesidades Especiales */}
<Modal
  visible={showSpecialNeedsModal}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowSpecialNeedsModal(false)}
>
  <TouchableWithoutFeedback onPress={() => setShowSpecialNeedsModal(false)}>
    <View style={styles.modalOverlayCondiciones} />
  </TouchableWithoutFeedback>
  <View style={styles.modalContentCondiciones}>
    <Text style={styles.modalTitleCondiciones}>Necesidades Especiales</Text>

    {/* Campo para alergias */}
    <TextInput
      style={styles.inputCondiciones}
      placeholder="Alergias"
      value={allergies}
      onChangeText={setAllergies}
    />

    {/* Campo para nombre del padre */}
    <TextInput
      style={styles.inputCondiciones}
      placeholder="Nombre del padre"
      value={parentName}
      onChangeText={setParentName}
    />

    {/* Campo para teléfono del padre */}
    <TextInput
      style={styles.inputCondiciones}
      placeholder="Teléfono del padre"
      value={parentPhone}
      onChangeText={setParentPhone}
      keyboardType="phone-pad"
    />

    {/* Campo para condición especial */}
    <TextInput
      style={styles.inputCondiciones}
      placeholder="Condición especial"
      value={specialCondition}
      onChangeText={setSpecialCondition}
    />

    {/* Botón para guardar los datos */}
    <TouchableOpacity
      style={styles.registerButton}
      onPress={() => setShowSpecialNeedsModal(false)}
    >
      <Text style={styles.registerButtonText}>Guardar</Text>
    </TouchableOpacity>
  </View>
</Modal>

     {/* Fin Modal para Necesidades Especiales */}












      <Modal
        visible={showNewOptionNotice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewOptionNotice(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNewOptionNotice(false)}>
          <View style={styles.modalOverlayAviso}>
            <View style={styles.modalContentAviso}>
              <Text style={styles.modalTitleAviso}>¡Nueva Opción!</Text>
              <Text style={styles.modalText}>
                Ahora puedes marcar a las personas como "nuevos" usando la opción "¿Es nuevo?".
              </Text>
              <Button
                title="Entendido"
                onPress={() => {
                  AsyncStorage.setItem("newOptionNoticeShownKids", "true"); // Marcar que el aviso fue mostrado
                  setShowNewOptionNotice(false);
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>;
    </KeyboardAvoidingView>
  );
}

// Estilos
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
    marginBottom: 15,
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
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  isNew: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008f39",
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

    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      height : 50,
    },
    modalOverlayAviso: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContentAviso: {
      backgroundColor: "#FFF",
      borderRadius: 10,
      padding: 20,
      width: "80%",
      alignItems: "center",
    },
    modalTitleAviso: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 10,
      color: "#333",
    },
    modalText: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 20,
      color: "#666",
    },
    specialNeedsButton: {
      backgroundColor: "#FF0000", // Color rojo
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    specialNeedsButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFF",
      marginLeft: 10,
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



modalContentCondiciones: {
  backgroundColor: "#FFF",
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  marginTop: "auto",
},
modalTitleCondiciones: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 16,
  textAlign: "center",
},
inputCondiciones: {
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

});