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
        <p>Reporte generado automáticamente por el Sistema de Asistencia de la IBBAC</p>
        <p>© ${currentYear} - Todos los derechos reservados</p>
      </div>
    </body>
    </html>
  `;
};