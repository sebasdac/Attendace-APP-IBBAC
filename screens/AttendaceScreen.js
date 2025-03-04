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

export default function AttendanceScreen() {
  const navigation = useNavigation(); // navegacion
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [message, setMessage] = useState("");
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]); // Lista filtrada de personas
  const [loading, setLoading] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Controla si estamos en modo de edición
  const [selectedPerson, setSelectedPerson] = useState(null); // Persona seleccionada para editar
  const [search, setSearch] = useState(""); // Estado para el texto de búsqueda
  const [dataLoaded, setDataLoaded] = useState(false);

  const phoneRegex = /^[0-9]{8}$/;

  const validateDate = (date) => {
    // Verifica que el formato sea dd/mm/yyyy
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
    // Validar la fecha de nacimiento
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
        createdAt: new Date(),
      });

      setMessage("Persona registrada con éxito");
      setName("");
      setPhone("");
      setBirthDay("");
      fetchPeople(); // Refrescar la lista después de registrar una persona
    } catch (error) {
      setMessage(`Error al registrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // confirmar si se quiere eliminar la persona
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
  //

  // Función para cargar la lista de personas
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
      setDataLoaded(true); // Marca que los datos se han cargado
    } catch (error) {
      console.error("Error al cargar personas:", error);
    } finally {
      setLoadingPeople(false);
    }
  };

  // Función para eliminar una persona
  const deletePerson = async (id) => {
    try {
      await deleteDoc(doc(db, "people", id));
      fetchPeople(); // Refrescar la lista después de eliminar
    } catch (error) {
      console.error("Error al eliminar persona:", error);
    }
  };

  const editPerson = (person) => {
    setSelectedPerson(person);
    setName(person.name);
    // Convertir phone a string si no lo es
    const phoneString = person.phone ? person.phone.toString() : "";
    setPhone(phoneString);
    setBirthDay(person.birthDay);
    console.log(phoneString);
    setIsEditing(true);
  };

  // Función para guardar los cambios de una persona editada
  const saveChanges = async () => {
    if (name.trim() === "" || phone.trim() === "") {
      setMessage("Por favor, ingresa todos los campos");
      return;
    }
    // Validar la fecha de nacimiento
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
      });

      setMessage("Persona actualizada con éxito");
      setIsEditing(false); // Regresa al modo de lista
      setName("");
      setPhone("");
      setBirthDay("");
      fetchPeople(); // Refrescar la lista después de la edición
    } catch (error) {
      setMessage(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar tildes de un texto
  const removeDiacritics = (text) => {
    return text
      .normalize("NFD") // Descompone los caracteres con tildes en sus componentes
      .replace(/[\u0300-\u036f]/g, ""); // Elimina los caracteres diacríticos
  };

  // Función para filtrar personas por nombre
  const filterPeople = (searchText) => {
    setSearch(searchText);

    // Elimina las tildes del texto de búsqueda
    const normalizedSearch = removeDiacritics(searchText.toLowerCase());

    // Filtra la lista de personas por nombre, ignorando tildes y mayúsculas/minúsculas
    const filtered = people.filter((person) => {
      const normalizedPersonName = removeDiacritics(person.name.toLowerCase());
      return normalizedPersonName.includes(normalizedSearch);
    });

    setFilteredPeople(filtered); // Actualiza la lista filtrada
  };

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#000",
            marginBottom: 16,
            marginTop: 30,
          }}
        >
          Registro de personas
        </Text>

        {/* Formulario de registro */}
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
              placeholder="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de nacimiento (dd/mm/aaaa)"
              value={birthDay}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />
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
              placeholder="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de nacimiento (dd/mm/aaaa)"
              value={birthDay}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />
            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={registerPerson}
                >
                  <Text style={styles.registerButtonText}>Registrar</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Personas Registradas</Text>
        {/* Botón para cargar personas */}
        {!dataLoaded && (
          <TouchableOpacity
            style={styles.loadButton}
            onPress={fetchPeople}
            disabled={loadingPeople} // Desactiva el botón mientras carga
          >
            {loadingPeople ? (
              <ActivityIndicator size="small" color="##111" />
            ) : (
              <Text style={styles.loadButtonText}>Cargar Personas</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Mostrar la lista de personas solo si ya se cargaron */}
        {dataLoaded && (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre"
              value={search}
              onChangeText={filterPeople}
            />
            {loadingPeople ? (
              <ActivityIndicator
                size="large"
                color="#111"
                style={styles.loader}
              />
            ) : (
              <FlatList
                data={filteredPeople}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.personItem}>
                    <Text style={styles.personName}>{item.name}</Text>
                    <Text style={styles.personPhone}>
                      Número de teléfono: {item.phone}
                    </Text>
                    <Text style={styles.personPhone}>
                      Fecha de nacimiento: {item.birthDay}
                    </Text>

                    {/* Contenedor para los botones */}
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => editPerson(item)}
                      >
                        <Text style={styles.optionText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => confirmDeletePerson(item.id)}
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
    backgroundColor: "#F5F5F5", // Fondo claro
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF", // Fondo blanco
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111", // Texto oscuro
    marginBottom: 20,
    textAlign: "center",
    marginTop: 40,
  },
  input: {
    height: 45,
    borderColor: "#DDD", // Borde gris claro
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF", // Fondo blanco
    color: "#111", // Texto oscuro
    fontSize: 16,
  },
  message: {
    marginTop: 10,
    textAlign: "center",
    color: "#007BFF", // Azul para mensajes destacados
    fontWeight: "bold",
  },
  listContainer: {
    flex: 15,
    marginTop: 5,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE", // Línea superior gris muy claro
    backgroundColor: "#FFFFFF", // Fondo blanco
    borderRadius: 8,
    width: "100%", // Usa todo el ancho disponible
  },

  listHeader: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#111", // Texto oscuro
  },
  searchInput: {
    height: 40,
    borderColor: "#DDD", // Borde gris claro
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF", // Fondo blanco
    color: "#111", // Texto oscuro
    fontSize: 16,
    marginVertical: 10, // Espaciado alrededor del campo de búsqueda
  },
  personItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE", // Línea inferior gris claro
    backgroundColor: "#FAFAFA", // Fondo ligeramente más claro
    borderRadius: 8,
    marginBottom: 8,
    width: "100%", // Usa todo el ancho disponible
  },
  personName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111", // Texto oscuro
  },
  personPhone: {
    fontSize: 16,
    color: "#555", // Texto gris medio
  },
  optionsContainer: {
    flexDirection: "row", // Coloca los elementos en fila
    justifyContent: "space-around", // Espacio igual entre los botones
    alignItems: "center", // Centrado vertical
    marginTop: 10,
  },
  optionButton: {
    flex: 1, // Hace que los botones compartan el espacio disponible
    paddingVertical: 10, // Más espacio vertical
    marginHorizontal: 5, // Espacio entre los botones
    backgroundColor: "#FFFFFF", // Fondo acorde a la paleta de colores
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
  },
  optionText: {
    color: "#111", // Texto blanco para contraste
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
  button: {
    padding: 10,
    backgroundColor: "#FFFFFF", // Fondo blanco
    borderWidth: 1,
    borderColor: "#DDD", // Borde gris claro
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#111", // Texto oscuro
    fontSize: 16,
    fontWeight: "bold",
  },
  registerButton: {
    paddingVertical: 12, // Espaciado vertical
    paddingHorizontal: 24, // Espaciado horizontal
    backgroundColor: "#FFFFFF", // Fondo blanco
    borderRadius: 8, // Bordes redondeados
    borderWidth: 1, // Borde sutil

    alignItems: "center", // Centrado horizontal
    shadowColor: "#000", // Sombra ligera

    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Sombra para Android
  },
  registerButtonText: {
    fontSize: 16, // Tamaño de fuente destacado
    fontWeight: "bold", // Texto en negrita
    color: "#111", // Texto oscuro
  },
  loadButton: {
    backgroundColor: "#FFFFFF", // Color principal de la paleta
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 8, // Bordes redondeados
    borderWidth: 1,
    alignItems: "center", // Centrado horizontal
    shadowColor: "#000", // Sombra ligera
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadButtonText: {
    color: "#111", // Contraste para el texto
    fontSize: 16,
    fontWeight: "bold",
  },
});
