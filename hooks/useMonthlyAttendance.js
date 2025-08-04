import { useState, useEffect } from 'react';
import { db } from '../database/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Alert } from 'react-native';

export const useMonthlyAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [kids, setKids] = useState({});
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Cargar clases
  useEffect(() => {
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

    fetchClasses();
  }, []);

  // Cargar niños
  useEffect(() => {
    const fetchKids = async () => {
      try {
        const snapshot = await getDocs(collection(db, "kids"));
        const kidsMap = {};
        snapshot.docs.forEach((doc) => {
          const kidData = doc.data();
          if (kidData.name) {
            kidsMap[doc.id] = kidData.name;
          }
        });
        setKids(kidsMap);
      } catch (error) {
        console.error("Error al cargar los niños:", error);
      }
    };

    fetchKids();
  }, []);

  const getSundaysInMonth = (monthIndex, year) => {
    const sundays = [];
    const date = new Date(year, monthIndex, 1);

    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }

    while (date.getMonth() === monthIndex) {
      sundays.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }

    return sundays;
  };

  const processMonthlyData = (weeklyData) => {
    const attendanceByKid = {};
    const weeklyStats = [];
    let totalSessions = 0;
    let totalAttendance = 0;

    weeklyData.forEach((week, index) => {
      const weekStats = {
        week: index + 1,
        date: week.date,
        morning: week.morning.length,
        afternoon: week.afternoon.length,
        total: week.morning.length + week.afternoon.length
      };
      
      weeklyStats.push(weekStats);
      totalSessions += 2; // AM y PM
      totalAttendance += weekStats.total;

      // Procesar asistencia individual
      [...week.morning, ...week.afternoon].forEach(record => {
        if (record.attended) {
          const kidName = kids[record.kidId] || "Desconocido";
          if (!attendanceByKid[kidName]) {
            attendanceByKid[kidName] = { total: 0, sessions: [] };
          }
          attendanceByKid[kidName].total++;
          attendanceByKid[kidName].sessions.push({
            date: week.date,
            session: record.session
          });
        }
      });
    });

    // Top asistentes del mes
    const topAttendees = Object.entries(attendanceByKid)
      .map(([name, data]) => ({ name, count: data.total, sessions: data.sessions }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      weeklyStats,
      topAttendees,
      totalSessions,
      totalAttendance,
      averagePerSession: totalSessions > 0 ? (totalAttendance / totalSessions).toFixed(1) : 0,
      attendanceByKid
    };
  };

  const generateMonthlyReport = async (selectedClass, selectedMonth) => {
    if (!selectedClass) {
      Alert.alert("Selección requerida", "Por favor, selecciona una clase.");
      return;
    }

    setLoading(true);
    try {
      const monthIndex = months.indexOf(selectedMonth);
      const year = currentYear;
      
      // Obtener todos los domingos del mes
      const sundays = getSundaysInMonth(monthIndex, year);
      
      // Consultar toda la asistencia del mes para la clase seleccionada
      const attendancePromises = sundays.map(async (sunday) => {
        const formattedDate = sunday.toISOString().split("T")[0];
        
        const morningQuery = query(
          collection(db, "attendance"),
          where("class", "==", selectedClass),
          where("date", "==", formattedDate),
          where("session", "==", "AM")
        );
        
        const afternoonQuery = query(
          collection(db, "attendance"),
          where("class", "==", selectedClass),
          where("date", "==", formattedDate),
          where("session", "==", "PM")
        );

        const [morningSnapshot, afternoonSnapshot] = await Promise.all([
          getDocs(morningQuery),
          getDocs(afternoonQuery)
        ]);

        return {
          date: sunday,
          morning: morningSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          afternoon: afternoonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };
      });

      const weeklyData = await Promise.all(attendancePromises);
      
      // Procesar datos para estadísticas
      const report = processMonthlyData(weeklyData);
      setMonthlyReport(report);
      
    } catch (error) {
      console.error("Error al generar reporte:", error);
      Alert.alert("Error", "No se pudo generar el reporte mensual.");
    } finally {
      setLoading(false);
    }
  };

  const getAttendeesForSession = (date, session) => {
    if (!monthlyReport) return [];
    
    const attendees = [];
    Object.entries(monthlyReport.attendanceByKid).forEach(([kidName, data]) => {
      const hasSession = data.sessions.some(s => 
        s.date.getTime() === date.getTime() && s.session === session
      );
      if (hasSession) {
        attendees.push(kidName);
      }
    });
    return attendees.sort();
  };

  return {
    classes,
    kids,
    monthlyReport,
    loading,
    months,
    currentMonth,
    currentYear,
    generateMonthlyReport,
    getAttendeesForSession
  };
};