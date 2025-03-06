// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Si usas autenticación

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBK_AUmbP45yQl5CzgL0qfvj4T1ylkRK2c",
    authDomain: "attendance-app-fa40b.firebaseapp.com",
    projectId: "attendance-app-fa40b",
    storageBucket: "attendance-app-fa40b.firebasestorage.app",
    messagingSenderId: "933329569605",
    appId: "1:933329569605:web:e71c3bc748ee33b6ab202c"
};

// Inicializa la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Obtiene Firestore y Auth (si los necesitas)
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
