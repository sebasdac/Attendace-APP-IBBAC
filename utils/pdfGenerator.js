// utils/pdfGenerator.js
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const generateMonthlyReportPDF = async (monthlyReport, selectedClass, selectedMonth, currentYear) => {
  try {
    // Verificar que la librería esté disponible
    if (!RNHTMLtoPDF || !RNHTMLtoPDF.convert) {
      throw new Error('RNHTMLtoPDF no está disponible. Verifica la instalación de la librería.');
    }

    const htmlContent = generateHTMLContent(monthlyReport, selectedClass, selectedMonth, currentYear);
    console.log('Año actual:', currentYear);
    
    const fileName = `Reporte_${selectedClass}_${selectedMonth}_${currentYear}`;
    
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 595, // A4 width in points
      height: 842, // A4 height in points
      padding: 20,
      base64: true, // Cambiar a true para obtener base64
    };

    console.log('Generando PDF con opciones:', options.fileName);

    const file = await RNHTMLtoPDF.convert(options);
    
    if (file && (file.filePath || file.base64)) {
      console.log('PDF generado exitosamente');
      
      // Usar la lógica de tu función de Excel
      const pdfFileName = `${fileName}.pdf`;
      const uri = FileSystem.documentDirectory + pdfFileName;
      
      if (file.base64) {
        // Si tenemos base64, escribir directamente
        await FileSystem.writeAsStringAsync(uri, file.base64, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      } else {
        // Si tenemos filePath, leer el archivo y convertir a base64
        const fileContent = await FileSystem.readAsStringAsync(file.filePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(uri, fileContent, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      }
      
      console.log('Archivo guardado en:', uri);
      
      // Usar expo-sharing para compartir (igual que tu función de Excel)
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte ${selectedClass} - ${selectedMonth} ${currentYear}`,
      });
      
      Alert.alert('Éxito', 'PDF generado y compartido correctamente');
      
      return uri;
    } else {
      throw new Error('No se pudo generar el archivo PDF');
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    
    // Mostrar error más específico
    let errorMessage = 'No se pudo generar el PDF';
    if (error.message.includes('RNHTMLtoPDF no está disponible')) {
      errorMessage = 'La librería PDF no está configurada correctamente. Contacta al desarrollador.';
    } else if (error.message.includes('Permission')) {
      errorMessage = 'No hay permisos para guardar archivos. Verifica los permisos de la app.';
    } else if (error.message.includes('HTML string is required')) {
      errorMessage = 'Error en el contenido del reporte. Verifica los datos.';
    }
    
    Alert.alert('Error', errorMessage);
    throw error;
  }
};

// Función alternativa: solo generar sin compartir inmediatamente
export const generatePDFAndShowLocation = async (monthlyReport, selectedClass, selectedMonth, currentYear) => {
  try {
    const htmlContent = generateHTMLContent(monthlyReport, selectedClass, selectedMonth, currentYear);
    const fileName = `Reporte_${selectedClass}_${selectedMonth}_${currentYear}`;
    
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 595,
      height: 842,
      padding: 20,
      base64: true,
    };

    const file = await RNHTMLtoPDF.convert(options);
    
    if (file && (file.filePath || file.base64)) {
      const pdfFileName = `${fileName}.pdf`;
      const uri = FileSystem.documentDirectory + pdfFileName;
      
      if (file.base64) {
        await FileSystem.writeAsStringAsync(uri, file.base64, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      } else {
        const fileContent = await FileSystem.readAsStringAsync(file.filePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(uri, fileContent, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      }
      
      // Mostrar opciones al usuario
      Alert.alert(
        'PDF Generado Exitosamente',
        `Archivo: ${pdfFileName}`,
        [
          { text: 'Solo Guardar', style: 'cancel' },
          { 
            text: 'Compartir', 
            onPress: async () => {
              try {
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Reporte ${selectedClass} - ${selectedMonth} ${currentYear}`,
                });
              } catch (shareError) {
                console.error('Error compartiendo:', shareError);
                Alert.alert('Error', 'No se pudo compartir el archivo');
              }
            }
          }
        ]
      );
      
      return uri;
    } else {
      throw new Error('No se pudo generar el archivo PDF');
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    Alert.alert('Error', 'No se pudo generar el PDF');
    throw error;
  }
};

// Función para verificar si expo-sharing está disponible
export const isSharingAvailable = async () => {
  return await Sharing.isAvailableAsync();
};

// Función para verificar si la librería está disponible
export const isPDFGenerationAvailable = () => {
  return RNHTMLtoPDF && typeof RNHTMLtoPDF.convert === 'function';
};

// Función auxiliar para convertir ArrayBuffer a Base64 (por si la necesitas)
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const generateHTMLContent = (monthlyReport, selectedClass, selectedMonth, currentYear) => {
  const { weeklyStats, topAttendees, totalAttendance, averagePerSession, attendanceByKid } = monthlyReport;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #ffffff;
          line-height: 1.4;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #6366f1;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #6366f1;
          margin: 0;
          font-size: 28px;
        }
        
        .header h2 {
          color: #64748b;
          margin: 5px 0 0 0;
          font-weight: normal;
          font-size: 18px;
        }
        
        .info-section {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #6366f1;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .info-label {
          font-weight: bold;
          color: #334155;
        }
        
        .info-value {
          color: #64748b;
        }
        
        .stats-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .stat-card {
          text-align: center;
          background-color: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
          min-width: 150px;
          margin: 5px;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 5px;
        }
        
        .stat-label {
          color: #64748b;
          font-size: 14px;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #334155;
          margin-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
        }
        
        .weekly-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .weekly-table th,
        .weekly-table td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          text-align: center;
        }
        
        .weekly-table th {
          background-color: #6366f1;
          color: white;
          font-weight: bold;
        }
        
        .weekly-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .attendee-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .attendee-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background-color: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #6366f1;
        }
        
        .attendee-name {
          font-weight: bold;
          color: #334155;
        }
        
        .attendee-count {
          color: #6366f1;
          font-weight: bold;
        }
        
        .individual-attendance {
          margin-top: 30px;
        }
        
        .kid-section {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        
        .kid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .kid-name {
          font-size: 16px;
          font-weight: bold;
          color: #334155;
        }
        
        .kid-percentage {
          background-color: #6366f1;
          color: white;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .attendance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .week-item {
          text-align: center;
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        
        .week-label {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 5px;
        }
        
        .session-dots {
          display: flex;
          justify-content: center;
          gap: 4px;
        }
        
        .session-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .present {
          background-color: #22c55e;
        }
        
        .absent {
          background-color: #e5e7eb;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>📈 Reporte Mensual de Asistencia</h1>
        <h2>Análisis detallado de participación</h2>
      </div>
      
      <!-- Información General -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Clase:</span>
          <span class="info-value">${selectedClass}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Período:</span>
          <span class="info-value">${selectedMonth} ${currentYear}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fecha de generación:</span>
          <span class="info-value">${new Date().toLocaleDateString('es-ES')}</span>
        </div>
      </div>
      
      <!-- Estadísticas Generales -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">${totalAttendance}</div>
          <div class="stat-label">Total Asistencias</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${averagePerSession}</div>
          <div class="stat-label">Promedio por Sesión</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${weeklyStats.length}</div>
          <div class="stat-label">Domingos del Mes</div>
        </div>
      </div>
      
      <!-- Asistencia Semanal -->
      <div class="section">
        <h3 class="section-title">📊 Asistencia por Semana</h3>
        <table class="weekly-table">
          <thead>
            <tr>
              <th>Semana</th>
              <th>Fecha</th>
              <th>Mañana 🌅</th>
              <th>Tarde 🌆</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${weeklyStats.map(week => `
              <tr>
                <td>Semana ${week.week}</td>
                <td>${week.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</td>
                <td>${week.morning}</td>
                <td>${week.afternoon}</td>
                <td><strong>${week.total}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Top Asistentes -->
      ${topAttendees.length > 0 ? `
        <div class="section">
          <h3 class="section-title">🏆 Top Asistentes del Mes</h3>
          <div class="attendee-list">
            ${topAttendees.map((attendee, index) => `
              <div class="attendee-item">
                <span class="attendee-name">${index + 1}. ${attendee.name}</span>
                <span class="attendee-count">${attendee.count} asistencias</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Asistencia Individual -->
      <div class="section individual-attendance">
        <h3 class="section-title">👥 Asistencia Individual Detallada</h3>
        ${Object.entries(attendanceByKid).map(([kidName, kidData]) => {
          const attendanceRate = ((kidData.total / (weeklyStats.length * 2)) * 100).toFixed(1);
          return `
            <div class="kid-section">
              <div class="kid-header">
                <span class="kid-name">${kidName}</span>
                <span class="kid-percentage">${attendanceRate}%</span>
              </div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">
                ${kidData.total} de ${weeklyStats.length * 2} sesiones
              </p>
              
              <div class="attendance-grid">
                ${weeklyStats.map((week, weekIndex) => {
                  const morningAttended = kidData.sessions.some(s => 
                    s.date.getTime() === week.date.getTime() && s.session === 'AM'
                  );
                  const afternoonAttended = kidData.sessions.some(s => 
                    s.date.getTime() === week.date.getTime() && s.session === 'PM'
                  );
                  
                  return `
                    <div class="week-item">
                      <div class="week-label">S${weekIndex + 1}</div>
                      <div class="session-dots">
                        <div class="session-dot ${morningAttended ? 'present' : 'absent'}"></div>
                        <div class="session-dot ${afternoonAttended ? 'present' : 'absent'}"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                <span style="display: inline-flex; align-items: center; margin-right: 15px;">
                  <span class="session-dot present" style="margin-right: 5px;"></span>
                  Presente
                </span>
                <span style="display: inline-flex; align-items: center;">
                  <span class="session-dot absent" style="margin-right: 5px;"></span>
                  Ausente
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>Reporte generado automáticamente por el Sistema de Asistencia</p>
        <p>© ${currentYear} - Todos los derechos reservados</p>
      </div>
    </body>
    </html>
  `;
};

export const generateDailyReportPDF = async (reportData) => {
  try {
    if (!RNHTMLtoPDF || !RNHTMLtoPDF.convert) {
      throw new Error('RNHTMLtoPDF no está disponible.');
    }

    const htmlContent = generateDailyHTMLContent(reportData);
    const formattedDate = reportData.date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
    
    const fileName = `Reporte_Diario_${formattedDate}`;
    
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 595,
      height: 842,
      padding: 20,
      base64: true,
    };

    const file = await RNHTMLtoPDF.convert(options);
    
    if (file && (file.filePath || file.base64)) {
      const pdfFileName = `${fileName}.pdf`;
      const uri = FileSystem.documentDirectory + pdfFileName;
      
      if (file.base64) {
        await FileSystem.writeAsStringAsync(uri, file.base64, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      } else {
        const fileContent = await FileSystem.readAsStringAsync(file.filePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(uri, fileContent, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte Diario - ${formattedDate}`,
      });
      
      Alert.alert('Éxito', 'Reporte diario exportado correctamente');
      return uri;
    }
  } catch (error) {
    console.error('Error generando PDF diario:', error);
    Alert.alert('Error', 'No se pudo generar el reporte PDF');
    throw error;
  }
};

const generateDailyHTMLContent = (reportData) => {
  const { date, attendanceCounts, totalAM, totalPM, totalDay } = reportData;
  
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #6366f1; margin: 0; font-size: 28px; }
        .date-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center; }
        .stats-grid { display: flex; justify-content: space-around; margin: 30px 0; }
        .stat-card { text-align: center; background: #f1f5f9; padding: 20px; border-radius: 8px; min-width: 120px; }
        .stat-number { font-size: 32px; font-weight: bold; color: #6366f1; }
        .stat-label { color: #64748b; font-size: 14px; margin-top: 5px; }
        .session-section { margin: 30px 0; }
        .session-title { font-size: 20px; font-weight: bold; color: #334155; margin-bottom: 15px; }
        .session-details { display: flex; justify-content: space-around; background: #f8fafc; padding: 20px; border-radius: 8px; }
        .detail-item { text-align: center; }
        .detail-number { font-size: 24px; font-weight: bold; color: #6366f1; }
        .detail-label { color: #64748b; margin-top: 5px; }
        .total-section { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; }
        .total-number { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Reporte Diario de Asistencia</h1>
      </div>
      
      <div class="date-info">
        <h2 style="margin: 0; color: #334155; text-transform: capitalize;">${formattedDate}</h2>
      </div>
      
      <div class="total-section">
        <h3 style="margin: 0; font-size: 18px;">Total del Día</h3>
        <div class="total-number">${totalDay}</div>
        <p style="margin: 0; opacity: 0.9;">personas asistieron</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${totalAM}</div>
          <div class="stat-label">🌅 Mañana</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${totalPM}</div>
          <div class="stat-label">🌆 Tarde</div>
        </div>
      </div>
      
      <div class="session-section">
        <div class="session-title">🌅 Sesión de la Mañana</div>
        <div class="session-details">
          <div class="detail-item">
            <div class="detail-number">${attendanceCounts.AM.kids}</div>
            <div class="detail-label">Niños</div>
          </div>
          <div class="detail-item">
            <div class="detail-number">${attendanceCounts.AM.adults}</div>
            <div class="detail-label">Adultos</div>
          </div>
          <div class="detail-item">
            <div class="detail-number">${totalAM}</div>
            <div class="detail-label">Total</div>
          </div>
        </div>
      </div>
      
      <div class="session-section">
        <div class="session-title">🌆 Sesión de la Tarde</div>
        <div class="session-details">
          <div class="detail-item">
            <div class="detail-number">${attendanceCounts.PM.kids}</div>
            <div class="detail-label">Niños</div>
          </div>
          <div class="detail-item">
            <div class="detail-number">${attendanceCounts.PM.adults}</div>
            <div class="detail-label">Adultos</div>
          </div>
          <div class="detail-item">
            <div class="detail-number">${totalPM}</div>
            <div class="detail-label">Total</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>Reporte generado automáticamente - ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </body>
    </html>
  `;
};

// Función principal para generar el reporte de cumpleañeros
export const generateBirthdayReportPDF = async () => {
  try {
    if (!RNHTMLtoPDF || !RNHTMLtoPDF.convert) {
      throw new Error('RNHTMLtoPDF no está disponible.');
    }

    // Obtener datos de cumpleañeros
    const birthdayData = await fetchBirthdayData();
    console.log(birthdayData)
    
    if (birthdayData.totalBirthdays === 0) {
      Alert.alert('Sin cumpleañeros', 'No hay cumpleañeros este mes.');
      return;
    }

    const htmlContent = generateBirthdayHTMLContent(birthdayData);
    const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const fileName = `Cumpleañeros_${currentMonth}_${currentYear}`;
    
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
      width: 595,
      height: 842,
      padding: 20,
      base64: true,
    }; 
    

    const file = await RNHTMLtoPDF.convert(options);
    
    if (file && (file.filePath || file.base64)) {
      const pdfFileName = `${fileName}.pdf`;
      const uri = FileSystem.documentDirectory + pdfFileName;
      
      if (file.base64) {
        await FileSystem.writeAsStringAsync(uri, file.base64, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      } else {
        const fileContent = await FileSystem.readAsStringAsync(file.filePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(uri, fileContent, { 
          encoding: FileSystem.EncodingType.Base64 
        });
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Cumpleañeros de ${currentMonth} ${currentYear}`,
      });
      
      Alert.alert('Éxito', 'Reporte de cumpleañeros exportado correctamente');
      return uri;
    }
  } catch (error) {
    console.error('Error generando PDF de cumpleañeros:', error);
    Alert.alert('Error', 'No se pudo generar el reporte de cumpleañeros');
    throw error;
  }
};

// Función para obtener datos de cumpleañeros desde Firebase
const fetchBirthdayData = async () => {
  try {
    const currentMonth = new Date().getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    
    // Obtener datos de adultos
    const peopleRef = collection(db, 'people');
    const peopleSnapshot = await getDocs(peopleRef);
    const adults = [];
    
    peopleSnapshot.forEach((doc) => {
      const person = doc.data();
      if (person.birthDay && isBirthdayThisMonth(person.birthDay, currentMonth)) {
        adults.push({
          name: person.name || 'Nombre no disponible',
          birthDay: person.birthDay,
          age: calculateAge(person.birthDay),
          type: 'adult'
        });
      }
    });

    // Obtener datos de niños
    const kidsRef = collection(db, 'kids');
    const kidsSnapshot = await getDocs(kidsRef);
    const kids = [];
    
    kidsSnapshot.forEach((doc) => {
      const kid = doc.data();
      if (kid.birthDay && isBirthdayThisMonth(kid.birthDay, currentMonth)) {
        kids.push({
          name: kid.name || 'Nombre no disponible',
          birthDay: kid.birthDay,
          age: calculateAge(kid.birthDay),
          type: 'kid'
        });
      }
    });

    // Combinar y ordenar por fecha de cumpleaños
    const allBirthdays = [...adults, ...kids].sort((a, b) => {
      const dayA = parseInt(a.birthDay.split('/')[0]);
      const dayB = parseInt(b.birthDay.split('/')[0]);
      return dayA - dayB;
    });

    return {
      adults,
      kids,
      allBirthdays,
      totalBirthdays: allBirthdays.length,
      totalAdults: adults.length,
      totalKids: kids.length,
      currentMonth: new Date().toLocaleDateString('es-ES', { month: 'long' }),
      currentYear: new Date().getFullYear()
    };
  } catch (error) {
    console.error('Error fetching birthday data:', error);
    throw error;
  }
};

// Función para verificar si un cumpleaños es este mes
const isBirthdayThisMonth = (birthDayString, currentMonth) => {
  try {
    // Formato esperado: DD/MM/YYYY
    const [day, month, year] = birthDayString.split('/').map(Number);
    return month === currentMonth;
  } catch (error) {
    console.error('Error parsing birthday:', birthDayString, error);
    return false;
  }
};

// Función para calcular la edad
const calculateAge = (birthDayString) => {
  try {
    const [day, month, year] = birthDayString.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'N/A';
  }
};

// Función para generar el contenido HTML del reporte
const generateBirthdayHTMLContent = (birthdayData) => {
  const { 
    allBirthdays, 
    totalBirthdays, 
    totalAdults, 
    totalKids, 
    currentMonth, 
    currentYear 
  } = birthdayData;

  const birthdayRows = allBirthdays.map(person => {
    const ageText = person.age !== 'N/A' ? `${person.age} años` : 'Edad no disponible';
    const typeIcon = person.type === 'kid' ? '👶' : '👤';
    const typeText = person.type === 'kid' ? 'Niño/a' : 'Adulto';
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          ${typeIcon} ${person.name}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${person.birthDay}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${ageText}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${typeText}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: #ffffff;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #6366f1; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 { 
          color: #6366f1; 
          margin: 0; 
          font-size: 28px; 
        }
        .month-info { 
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 20px; 
          border-radius: 12px; 
          margin-bottom: 25px; 
          text-align: center; 
        }
        .month-info h2 {
          margin: 0;
          font-size: 24px;
          text-transform: capitalize;
        }
        .stats-grid { 
          display: flex; 
          justify-content: space-around; 
          margin: 30px 0; 
        }
        .stat-card { 
          text-align: center; 
          background: #f8fafc; 
          padding: 20px; 
          border-radius: 12px; 
          min-width: 120px;
          border: 2px solid #e2e8f0;
        }
        .stat-number { 
          font-size: 32px; 
          font-weight: bold; 
          color: #6366f1; 
        }
        .stat-label { 
          color: #64748b; 
          font-size: 14px; 
          margin-top: 5px; 
        }
        .birthday-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 30px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .birthday-table th { 
          background: #6366f1; 
          color: white; 
          padding: 15px; 
          text-align: left; 
          font-weight: bold;
        }
        .birthday-table td { 
          padding: 12px; 
          border-bottom: 1px solid #e2e8f0; 
        }
        .birthday-table tr:hover { 
          background-color: #f8fafc; 
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #334155;
          margin: 30px 0 15px 0;
          border-left: 4px solid #6366f1;
          padding-left: 15px;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #64748b;
          background: #f8fafc;
          border-radius: 8px;
          margin: 20px 0;
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #64748b; 
          font-size: 12px; 
          border-top: 2px solid #e2e8f0; 
          padding-top: 20px; 
        }
        .celebration-banner {
          background: linear-gradient(45deg, #fbbf24, #f59e0b);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎂 Cumpleañeros del Mes</h1>
      </div>
      
      <div class="month-info">
        <h2>🗓️ ${currentMonth} ${currentYear}</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">
          ${totalBirthdays} ${totalBirthdays === 1 ? 'persona celebra' : 'personas celebran'} su cumpleaños este mes
        </p>
      </div>
      
      ${totalBirthdays > 0 ? `
        <div class="celebration-banner">
          🎉 ¡Celebremos juntos estos cumpleaños especiales! 🎉
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${totalBirthdays}</div>
            <div class="stat-label">🎂 Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalAdults}</div>
            <div class="stat-label">👤 Adultos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalKids}</div>
            <div class="stat-label">👶 Niños</div>
          </div>
        </div>
        
        <div class="section-title">📋 Lista de Cumpleañeros</div>
        
        <table class="birthday-table">
          <thead>
            <tr>
              <th>👤 Nombre</th>
              <th>📅 Fecha de Nacimiento</th>
              <th>🎂 Edad</th>
              <th>👥 Categoría</th>
            </tr>
          </thead>
          <tbody>
            ${birthdayRows}
          </tbody>
        </table>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">🎂</div>
          <h3>No hay cumpleañeros este mes</h3>
          <p>¡Pero siempre hay motivos para celebrar!</p>
        </div>
      `}
      
      <div class="footer">
        <p>🎉 Reporte de cumpleañeros generado automáticamente</p>
        <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
    </body>
    </html>
  `;
};