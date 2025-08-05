// utils/studentsHelper.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../database/firebase';
// Función para obtener estudiantes de una clase específica desde Firebase
export const getStudentsForClass = async (className, monthlyReport = null) => {
  try {
    // Opción 1: Si tienes el monthlyReport disponible, obtener de ahí (más rápido)
    if (monthlyReport && monthlyReport.attendanceByKid) {
      const students = Object.keys(monthlyReport.attendanceByKid).sort();
      return students;
    }
    
    // Opción 2: Obtener desde Firebase (misma lógica que usas en tu otra pantalla)
    const kidsSnapshot = await getDocs(collection(db, "kids"));
    const kidsList = kidsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filtrar los niños que pertenecen a la clase seleccionada
    const filteredKids = kidsList.filter((kid) =>
      kid.classes.includes(className)
    );

    // Extraer solo los nombres y ordenar
    const studentNames = filteredKids.map(kid => kid.name).sort();
    
    return studentNames;
    
  } catch (error) {
    console.error('Error obteniendo estudiantes desde Firebase:', error);
    
    // Fallback: usar datos mock si falla Firebase
    console.log('Usando datos mock como fallback...');
    return getMockStudents(className);
  }
};

// Función para obtener estudiantes desde el reporte mensual existente
export const getStudentsFromMonthlyReport = (monthlyReport) => {
  if (!monthlyReport || !monthlyReport.attendanceByKid) {
    return [];
  }
  
  return Object.keys(monthlyReport.attendanceByKid).sort();
};

// Datos mock para testing (como fallback si falla Firebase)
const getMockStudents = (className) => {
  const studentsByClass = {
    'Pequeños': [
      'Ana Sofía Rodríguez',
      'Carlos Andrés López',
      'María Fernanda García',
      'José Manuel Castro',
      'Valentina Morales',
      'Diego Alejandro Ruiz',
      'Isabella Jiménez',
      'Sebastián Vargas'
    ],
    'Medianos': [
      'Camila Andreina Soto',
      'Mateo Esteban Flores',
      'Sophia Nicole Herrera',
      'Gabriel Ignacio Méndez',
      'Emma Valentina Cruz',
      'Lucas Emilio Ramírez',
      'Mía Alejandra Torres',
      'Noah Santiago Vega',
      'Olivia Esperanza Silva',
      'Ethan Maximiliano Rojas'
    ],
    'Grandes': [
      'Alejandra Beatriz Campos',
      'Adrián Mauricio Espinoza',
      'Natalia Esperanza Guerrero',
      'Damián Sebastián Molina',
      'Andrea Cristina Navarro',
      'Rodrigo Emanuel Peña',
      'Valeria Antonieta Sandoval',
      'Benjamín Nicolás Aguilar',
      'Francesca Isabella Cordero',
      'Maximiliano José Delgado',
      'Renata Gabriela Montenegro',
      'Leonardo Daniel Valverde'
    ],
    'Jóvenes': [
      'Antonella María Fernández',
      'Cristopher Alexander Mora',
      'Bianca Alejandra Quesada',
      'Emmanuel Josué Solano',
      'Priscilla Nicole Vargas',
      'Esteban Andrés Zamora',
      'Jimena Sofía Araya',
      'Kevin Javier Chinchilla',
      'Melanie Estefanía Gómez',
      'Bryan Esteban Madrigal',
      'Stephanie Paola Núñez',
      'Javier Antonio Picado',
      'Carolina Beatriz Ramírez',
      'Álvaro Sebastián Trejos'
    ]
  };
  
  return studentsByClass[className] || [
    'Estudiante 1',
    'Estudiante 2',
    'Estudiante 3',
    'Estudiante 4',
    'Estudiante 5'
  ];
};