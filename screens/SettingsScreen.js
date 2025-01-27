import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { db } from '../database/firebase'; // Asegúrate de importar tu configuración de Firebase
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import * as DocumentPicker from 'expo-document-picker';
import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore'; // Importa correctamente writeBatch

// Función para convertir ArrayBuffer a base64//
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const length = bytes.length;
  for (let i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const SettingsScreen = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función para convertir Timestamp a formato dd/mm/aaaa
const formatDate = (timestamp) => {
  if (timestamp?.seconds) {
    const date = new Date(timestamp.seconds * 1000); // Convertir de Timestamp a Date
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  }
  return ''; // Devolver vacío si no es un timestamp válido
};

  const exportarPersonas = async () => {
    setIsExporting(true);

    try {
      const personasCollection = collection(db, 'people');
      const snapshot = await getDocs(personasCollection);

      if (snapshot.empty) {
        Alert.alert('No hay personas registradas', 'No se encontraron registros de personas.');
        setIsExporting(false);
        return;
      }

      const personas = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Datos de persona:', data); // Verificar los datos obtenidos
        return {
          name: data.name || '', // Nombre de la persona
          phone: data.phone || '', // Teléfono de la persona
          birthDay: data.birthDay || '', // Fecha de nacimiento sin modificar
        };
      });

      const ws = XLSX.utils.json_to_sheet(personas, {
        header: ['name', 'phone', 'birthDay'],
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Personas');

      const excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const buffer = new ArrayBuffer(excelBinary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < excelBinary.length; i++) {
        view[i] = excelBinary.charCodeAt(i) & 0xff;
      }

      const base64Data = arrayBufferToBase64(buffer);
      const uri = FileSystem.documentDirectory + 'personas.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri);

      Alert.alert('Éxito', 'Archivo exportado correctamente');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un error al intentar exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };



  // Función para convertir una fecha de Excel (número de serie) a formato dd/mm/yyyy
const excelDateToJSDate = (excelDate) => {
    if (excelDate instanceof Date) {
      return excelDate;
    }
    
    // Si el valor es un número (fecha de Excel)
    if (!isNaN(excelDate)) {
      const tempDate = new Date((excelDate - (25567 + 2)) * 86400 * 1000); // Ajuste para fechas de Excel
      return tempDate;
    }
  
    return null; // Si no es un número ni una fecha válida, devolver null
  };
  
  // Función para convertir una fecha a formato dd/mm/yyyy
  const formatDateToDDMMYYYY = (date) => {
    if (date instanceof Date && !isNaN(date)) {
      const day = String(date.getDate()).padStart(2, '0'); // Asegura que el día tenga dos dígitos
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses en JavaScript van de 0 a 11, así que sumamos 1
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return ''; // Si no es una fecha válida, retornamos una cadena vacía
  };
  
  const handleImport = async () => {
    setLoading(true);
  
    try {
      // Seleccionar el archivo Excel
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });
  
      if (result.canceled) {
        Alert.alert('Cancelado', 'No seleccionaste ningún archivo.');
        setLoading(false);
        return;
      }
  
      const fileUri = result.assets[0]?.uri;
      if (!fileUri) throw new Error('No se pudo obtener el URI del archivo seleccionado.');
  
      // Leer el archivo como cadena base64
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Leer y convertir el archivo Excel
      const workbook = XLSX.read(fileData, { type: 'base64' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
  
      // Validar la estructura del archivo
      const requiredColumns = ['name', 'phone', 'birthDay'];
      const hasAllColumns = data.every((row) =>
        requiredColumns.every((col) => col in row)
      );
  
      if (!hasAllColumns) {
        throw new Error(
          `El archivo no contiene todas las columnas requeridas: ${requiredColumns.join(', ')}`
        );
      }
  
      if (!data || data.length === 0) {
        throw new Error('El archivo está vacío o no contiene datos válidos.');
      }
  
      // Convertir fechas al formato `dd/mm/aaaa`
      const parseExcelDate = (excelDate) => {
        const date = new Date((excelDate - 25569) * 86400 * 1000); // Convierte desde número de serie
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
  
      const formatBirthDay = (birthDay) => {
        if (typeof birthDay === 'number') {
          return parseExcelDate(birthDay); // Manejar números de serie de Excel
        } else if (typeof birthDay === 'string') {
          const [day, month, year] = birthDay.split('/');
          if (!day || !month || !year) throw new Error(`Fecha inválida: ${birthDay}`);
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        } else {
          throw new Error(`Formato de fecha no reconocido: ${birthDay}`);
        }
      };
  
      // Procesar y validar los datos
      const processedData = data.map((row) => ({
        ...row,
        birthDay: formatBirthDay(row.birthDay), // Formatear fecha
      }));
  
      // Eliminar registros existentes
      const personasCollection = collection(db, 'people');
      const snapshot = await getDocs(personasCollection);
  
      if (!snapshot.empty) {
        const batchDelete = writeBatch(db);
        snapshot.forEach((doc) => batchDelete.delete(doc.ref));
        await batchDelete.commit();
      }
  
      // Insertar nuevos datos
      const batchInsert = writeBatch(db);
      processedData.forEach((person) => {
        const docRef = doc(collection(db, 'people'));
        batchInsert.set(docRef, {
          ...person,
          createdAt: Timestamp.now(),
        });
      });
      await batchInsert.commit();
  
      Alert.alert('Éxito', 'Los datos han sido actualizados correctamente.');
    } catch (error) {
      console.error('Error al importar:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al importar el archivo.');
    } finally {
      setLoading(false);
    }
  };
  
  
  
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>
  
      <View style={styles.buttonContainer}>
        <Button
          title={isExporting ? 'Exportando...' : 'Exportar Personas a Excel'}
          onPress={exportarPersonas}
          disabled={isExporting}
        />
      </View>
  
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Cargando...' : 'Importar desde Excel'}
          onPress={handleImport}
          disabled={loading}
        />
      </View>

      <Text style={infoStyle}>Version : 2.2.0v Iglesia Biblica Bautista Agua Caliente. Attendance App</Text> 
      
    </View>
  );
  
  
  
}  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Alinea los elementos al inicio del contenedor
    padding: 20, // Espacio alrededor del contenedor
  },
  title: {
    fontSize: 24,
    marginBottom: 10, // Espacio debajo del título
    marginTop:30,
  },
  buttonContainer: {
    marginBottom: 8, // Espacio entre los botones

  },
 
});

const infoStyle = StyleSheet.create({
  position: 'absolute', 
  bottom : 0,
});


export default SettingsScreen;
