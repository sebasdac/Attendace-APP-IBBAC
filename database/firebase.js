// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Si usas autenticación

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDgxYehUA61XDiQsP7wWKKLIaemU1zbD50",
    authDomain: "ibbac-attendance-ii.firebaseapp.com",
    projectId: "ibbac-attendance-ii",
    storageBucket: "ibbac-attendance-ii.firebasestorage.app",
    messagingSenderId: "740043364983",
    appId: "1:740043364983:web:3e8e6779354e68cec24472"
};

// Inicializa la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Obtiene Firestore y Auth (si los necesitas)
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
