// database/attendance.js
import { db } from './firebase'; // Importa la instancia de Firestore
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Función para registrar una persona
export const registrarPersona = async (nombre, telefono) => {
  try {
    const docRef = await addDoc(collection(db, "personas"), {
      nombre: nombre,
      telefono: telefono,
    });
    console.log("Persona registrada con ID:", docRef.id);
  } catch (error) {
    console.error("Error al registrar persona:", error);
  }
};

// Función para obtener la lista de personas
export const obtenerPersonas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "personas"));
    const personas = [];
    querySnapshot.forEach((doc) => {
      personas.push({ id: doc.id, ...doc.data() });
    });
    return personas;
  } catch (error) {
    console.error("Error al obtener personas:", error);
  }
};
