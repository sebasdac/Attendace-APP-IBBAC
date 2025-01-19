import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, FlatList, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { db } from '../database/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { DateTimePicker } from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';




export default function AttendanceScreen() {
  const navigation = useNavigation();// navegacion
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDay, setBirthDay] = useState('');  
  const [message, setMessage] = useState('');
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]); // Lista filtrada de personas
  const [loading, setLoading] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Controla si estamos en modo de edición
  const [selectedPerson, setSelectedPerson] = useState(null); // Persona seleccionada para editar
  const [search, setSearch] = useState(''); // Estado para el texto de búsqueda

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
    if (name.trim() === '' || phone.trim() === '' || birthDay ==='') {
      setMessage('Por favor, ingresa todos los campos');
      return;
    }

    if (!phoneRegex.test(phone)) {
      setMessage('Por favor, ingresa un número de teléfono válido (8 dígitos)');
      return;
    }
      // Validar la fecha de nacimiento
    if (!validateDate(birthDay)) {
      setMessage('Por favor, ingresa una fecha válida en formato dd/mm/aaaa');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'people'), {
        name,
        phone,
        birthDay,
        createdAt: new Date(),
      });

      setMessage('Persona registrada con éxito');
      setName('');
      setPhone('');
      setBirthDay('');
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
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta persona?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: () => deletePerson(personId),
          style: 'destructive',
        },
      ]
    );
  };
  

  // Función para cargar la lista de personas
  const fetchPeople = async () => {
    setLoadingPeople(true); // Inicia el indicador de carga para la lista

    try {
      const snapshot = await getDocs(collection(db, 'people'));
      const peopleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPeople(peopleList);
      setFilteredPeople(peopleList); // Inicia la lista filtrada con todos los registros
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoadingPeople(false); // Finaliza la carga de la lista
    }
  };

  // Función para eliminar una persona
  const deletePerson = async (id) => {
    try {
      await deleteDoc(doc(db, 'people', id));
      fetchPeople(); // Refrescar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar persona:', error);
    }
  };

  const editPerson = (person) => {
    setSelectedPerson(person);
    setName(person.name);
    // Convertir phone a string si no lo es
    const phoneString = person.phone ? person.phone.toString() : '';
    setPhone(phoneString);
    setBirthDay(person.birthDay);
    console.log(phoneString);
    setIsEditing(true);
};


  // Función para guardar los cambios de una persona editada
  const saveChanges = async () => {
    if (name.trim() === '' || phone.trim() === '') {
      setMessage('Por favor, ingresa todos los campos');
      return;
    }
    // Validar la fecha de nacimiento
    if (!validateDate(birthDay)) {
      setMessage('Por favor, ingresa una fecha válida en formato dd/mm/aaaa');
      return;
    }

    if (!phoneRegex.test(phone)) {
      setMessage('Por favor, ingresa un número de teléfono válido (8 dígitos)');
      return;
    }

    try {
      setLoading(true);

      const personRef = doc(db, 'people', selectedPerson.id);
      await updateDoc(personRef, {
        name,
        phone,
        birthDay,
      });

      setMessage('Persona actualizada con éxito');
      setIsEditing(false); // Regresa al modo de lista
      setName('');
      setPhone('');
      setBirthDay('');
      fetchPeople(); // Refrescar la lista después de la edición
    } catch (error) {
      setMessage(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar personas por nombre
  const filterPeople = (searchText) => {
    setSearch(searchText);

    // Filtra la lista de personas por nombre, ignorando mayúsculas/minúsculas
    const filtered = people.filter((person) =>
      person.name.toLowerCase().includes(searchText.toLowerCase())
    );

    setFilteredPeople(filtered); // Actualiza la lista filtrada
  };
  const handleDateChange = (text) => {
    // Permite solo números
    const formattedText = text.replace(/[^0-9]/g, '');
  
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
  const handleViewAttendance = (personId) => {
    navigation.navigate('AttendanceReport', { personId }); // Navega a la pantalla del reporte
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPeople();  // Llama solo una vez cuando la pantalla se enfoque
    }, [])
  );


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Registro de Personas</Text>

        {/* Formulario de registro */}
        {isEditing ? (
          <>
            <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Fecha de nacimiento (dd/mm/aaaa)" value={birthDay} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10} />
            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Button title="Guardar Cambios" onPress={saveChanges} color="#28a745" />
              )}
            </View>
          </>
        ) : (
          <>
           
            <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Fecha de nacimiento (dd/mm/aaaa)" value={birthDay} onChangeText={handleDateChange} keyboardType="numeric" maxLength={10} />
            
            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Button title="Registrar" onPress={registerPerson} color="#007bff" />
              )}
            </View>
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Personas Registradas</Text>

        {/* Filtro de búsqueda */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre"
          value={search}
          onChangeText={filterPeople} // Filtra las personas al cambiar el texto
        />

        {/* Mostrar ActivityIndicator mientras se carga la lista de personas */}
        {loadingPeople ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredPeople} // Muestra la lista filtrada
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.personItem}>
                <Text style={styles.personName}>{item.name}</Text>
                <Text style={styles.personPhone}>Numero de teléfono: {item.phone}</Text>
                <Text style={styles.personPhone}>Fecha de nacimiento: {item.birthDay}</Text>

                {/* Opciones de Editar y Eliminar */}
                <View style={styles.optionsContainer}>
                  <TouchableOpacity style={styles.optionButton} onPress={() => editPerson(item)}>
                    <Text style={styles.optionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionButton} onPress={() => confirmDeletePerson(item.id)}>
                    <Text style={styles.optionText}>Eliminar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.optionButton} onPress={() => handleViewAttendance(item.id)}>
                    <Text style={styles.optionText}>Ver Asistencia</Text>
                  </TouchableOpacity>
                  
                </View>
              </View>
            )}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 20,
      textAlign: 'center',
      marginTop: 40,
    },
    input: {
      height: 45,
      borderColor: '#ddd',
      borderWidth: 1,
      marginBottom: 16,
      paddingLeft: 12,
      borderRadius: 8,
      backgroundColor: '#fff',
      fontSize: 16,
    },
    message: {
      marginTop: 10,
      textAlign: 'center',
      color: 'green',
      fontWeight: 'bold',
    },
    listContainer: {
      flex: 15,
      marginTop: 5,
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      backgroundColor: '#fff',
      borderRadius: 8,
    },
    listHeader: {
      fontSize: 20,
      marginBottom: 10,
      fontWeight: 'bold',
      color: '#333',
    },
    searchInput: {
      height: 40,
      borderColor: '#ddd',
      borderWidth: 1,
      marginBottom: 10,
      paddingLeft: 12,
      borderRadius: 8,
      backgroundColor: '#fff',
      fontSize: 16,
      marginVertical: 10, // Espaciado alrededor del campo de búsqueda
    },
    personItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      backgroundColor: '#fafafa',
      borderRadius: 8,
      marginBottom: 8,
    },
    personName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    personPhone: {
      fontSize: 16,
      color: '#555',
    },
    optionsContainer: {
      marginTop: 10,
      paddingVertical: 5,
    },
    optionButton: {
      paddingVertical: 6, // Reducir el padding para hacer los botones más pequeños
      paddingHorizontal: 12, // Ajustar el tamaño de los botones
      backgroundColor: '#007bff', // Cambia el color si es necesario
      borderRadius: 20,  // Bordes redondeados
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row', // Para incluir el ícono y el texto
      opacity: 0.9,  // No tan opacos, pero aún sutiles
      elevation: 3,  // Para agregar sombra
    },
    optionText: {
      color: '#fff',
      fontSize: 14, // Texto pequeño
      fontWeight: 'bold',
      marginLeft: 6, // Separación con el icono
    },
    
    
    buttonContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    loader: {
      marginTop: 10,
    },
    button: {
      padding: 10,
      backgroundColor: '#007bff',
      borderRadius: 5,
      alignItems: 'center',
      opacity: 0.8,  // Baja la opacidad para que no se vea tan fuerte
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
  