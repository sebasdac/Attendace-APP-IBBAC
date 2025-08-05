// utils/sundayAttendanceTemplate.js
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { Asset } from 'expo-asset';

export class SundayAttendanceTemplate {
  constructor() {
    this.monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
  }

  // Obtener todos los domingos del mes
  getSundaysInMonth(year, monthIndex) {
    const sundays = [];
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      if (date.getDay() === 0) { // 0 = Domingo
        sundays.push({
          day: day,
          date: `${day}/${monthIndex + 1}/${year}`,
          fullDate: date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return sundays;
  }

  // Convertir imagen a base64
  async getLogoBase64() {
    try {
      // Cargar el asset de la imagen
      const asset = Asset.fromModule(require('../assets/icon.png'));
      await asset.downloadAsync();
      
      // Leer el archivo como base64
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error cargando logo:', error);
      return null;
    }
  }

  // Generar el HTML de la plantilla
  async generateHTML(className, month, year, students) {
    const monthIndex = this.monthNames.indexOf(month);
    const sundays = this.getSundaysInMonth(year, monthIndex);
    const logoBase64 = await this.getLogoBase64();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Control de Asistencia Dominical - ${className}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            color: #334155;
            background: white;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .header {
            position: relative;
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 15px;
          }
          
          .logo {
            position: absolute;
            top: -10px;
            right: 0;
            width: 60px;
            height: 60px;
            opacity: 0.9;
          }
          
          .title {
            font-size: 22px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 8px;
            margin-top: 10px;
          }
          
          .subtitle {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 5px;
          }
          
          .date-info {
            font-size: 14px;
            color: #10b981;
            font-weight: 600;
          }
          
          .sundays-info {
            background: #f0f4ff;
            border: 1px solid #c7d2fe;
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
            text-align: center;
          }
          
          .sundays-list {
            color: #3730a3;
            font-weight: 600;
            font-size: 12px;
          }
          
          .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          
          .table-header {
            background: linear-gradient(135deg, #6366f1 0%, #5856eb 100%);
            color: white;
          }
          
          .table-header th {
            padding: 14px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            border-right: 1px solid #5856eb;
          }
          
          .table-header th:last-child {
            border-right: none;
          }
          
          .student-name {
            text-align: left !important;
            min-width: 140px;
            padding-left: 12px !important;
          }
          
          .sunday-column {
            min-width: 55px;
            font-size: 9px;
            writing-mode: vertical-lr;
            text-orientation: mixed;
          }
          
          .total-column {
            min-width: 50px;
            background: rgba(255,255,255,0.1) !important;
            font-weight: bold;
          }
          
          .attendance-row {
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s;
          }
          
          .attendance-row:nth-child(even) {
            background: #f8fafc;
          }
          
          .attendance-row:hover {
            background: #f0f4ff;
          }
          
          .attendance-row td {
            padding: 12px 8px;
            border-right: 1px solid #e2e8f0;
            text-align: center;
            vertical-align: middle;
          }
          
          .attendance-row td:last-child {
            border-right: none;
          }
          
          .student-cell {
            text-align: left !important;
            font-weight: 500;
            color: #1e293b;
            padding-left: 12px !important;
            border-right: 2px solid #d1d5db !important;
          }
          
          .checkbox-cell {
            position: relative;
            padding: 10px 8px;
          }
          
          .attendance-checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #6b7280;
            border-radius: 4px;
            margin: 0 auto;
            background: white;
            display: block;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .total-cell {
            background: #f0f4ff !important;
            border: 2px solid #c7d2fe !important;
          }
          
          .total-cell .attendance-checkbox {
            border-color: #6366f1;
            background: #fefefe;
          }
          
          .summary-row {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%) !important;
            font-weight: bold;
            border-top: 3px solid #6366f1;
          }
          
          .summary-row td {
            padding: 14px 8px !important;
            font-weight: bold;
            color: #3730a3;
            border-right: 1px solid #a5b4fc !important;
          }
          
          .summary-row .student-cell {
            font-size: 12px;
            color: #1e1b4b !important;
          }
          
          .notes-section {
            margin-top: 25px;
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
          }
          
          .notes-title {
            font-size: 14px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .notes-container {
            border: 2px solid #d1d5db;
            border-radius: 8px;
            padding: 15px;
            min-height: 80px;
            background: linear-gradient(45deg, #f9fafb 0%, #ffffff 100%);
          }
          
          .notes-line {
            border-bottom: 1px dotted #9ca3af;
            height: 18px;
            margin-bottom: 3px;
          }
          
          .notes-line:last-child {
            border-bottom: none;
          }
          
          .footer {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            font-size: 10px;
            color: #64748b;
          }
          
          .stats-section {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #bbf7d0;
            min-width: 200px;
          }
          
          .stats-title {
            font-weight: bold;
            color: #15803d;
            margin-bottom: 8px;
            font-size: 11px;
          }
          
          .stats-item {
            margin-bottom: 4px;
            color: #166534;
          }
          
          .signature-section {
            text-align: center;
            min-width: 180px;
          }
          
          .signature-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
          }
          
          .signature-line {
            border-bottom: 2px solid #9ca3af;
            width: 160px;
            margin: 0 auto 8px;
            height: 25px;
          }
          
          .signature-label {
            font-size: 9px;
            color: #6b7280;
          }
          
          .generation-info {
            margin-top: 15px;
            text-align: center;
            font-size: 8px;
            color: #9ca3af;
            border-top: 1px dotted #d1d5db;
            padding-top: 10px;
          }
          
          .week-divider {
            background: #f1f5f9 !important;
            border-top: 2px solid #cbd5e1 !important;
          }

          @media print {
            body { 
              padding: 15px; 
              font-size: 10px;
            }
            .page-break { 
              page-break-before: always; 
            }
            .logo {
              width: 50px;
              height: 50px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ''}
          <div class="title">Control de Asistencia Dominical</div>
          <div class="subtitle">Clase: <strong>${className}</strong></div>
          <div class="date-info">${month} ${year}</div>
        </div>

        <div class="sundays-info">
          <div class="sundays-list">
            <strong>Domingos del mes:</strong> 
            ${sundays.map(sunday => `${sunday.day}`).join(' • ')}
            ${sundays.length === 0 ? '<em>No hay domingos en este mes</em>' : ''}
          </div>
        </div>

        ${sundays.length > 0 ? `
        <table class="attendance-table">
          <thead class="table-header">
            <tr>
              <th class="student-name">Estudiante</th>
              ${sundays.map(sunday => 
                `<th class="sunday-column">Dom<br>${sunday.day}</th>`
              ).join('')}
              <th class="total-column">Total</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((student, index) => `
              <tr class="attendance-row ${index % 5 === 4 ? 'week-divider' : ''}">
                <td class="student-cell">${student}</td>
                ${sundays.map(() => 
                  `<td class="checkbox-cell">
                    <div class="attendance-checkbox"></div>
                  </td>`
                ).join('')}
                <td class="checkbox-cell total-cell">
                  <div class="attendance-checkbox"></div>
                </td>
              </tr>
            `).join('')}
            
            <tr class="summary-row">
              <td class="student-cell">TOTAL ASISTENTES POR DOMINGO</td>
              ${sundays.map(() => 
                `<td class="checkbox-cell">
                  <div class="attendance-checkbox"></div>
                </td>`
              ).join('')}
              <td class="checkbox-cell total-cell">
                <div class="attendance-checkbox"></div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="notes-section">
          <div class="notes-title">
            📝 Observaciones y Notas del Mes:
          </div>
          <div class="notes-container">
            ${Array(5).fill(0).map(() => '<div class="notes-line"></div>').join('')}
          </div>
        </div>

        <div class="footer">
          <div class="stats-section">
            <div class="stats-title">📊 Resumen:</div>
            <div class="stats-item"><strong>Total Domingos:</strong> ${sundays.length}</div>
            <div class="stats-item"><strong>Total Estudiantes:</strong> ${students.length}</div>
            <div class="stats-item"><strong>Clase:</strong> ${className}</div>
            <div class="stats-item"><strong>Período:</strong> ${month} ${year}</div>
          </div>
          
          <div class="signature-section">
            <div class="signature-title">Maestro/a Responsable:</div>
            <div class="signature-line"></div>
            <div class="signature-label">Firma y Fecha</div>
          </div>
        </div>

        <div class="generation-info">
          Generado el ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} • Sistema de Asistencia Dominical
        </div>
        ` : `
        <div style="text-align: center; padding: 40px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;">
          <h3>⚠️ No hay domingos en este mes</h3>
          <p>Selecciona un mes diferente para generar la plantilla.</p>
        </div>
        `}
      </body>
      </html>
    `;
  }

  // Generar y guardar el PDF usando la misma lógica que tu función existente
  async generatePDF(className, month, year, students) {
    try {
      // Verificar que la librería esté disponible
      if (!RNHTMLtoPDF || !RNHTMLtoPDF.convert) {
        throw new Error('RNHTMLtoPDF no está disponible. Verifica la instalación de la librería.');
      }

      const htmlContent = await this.generateHTML(className, month, year, students);
      console.log('Generando plantilla para:', { className, month, year, studentsCount: students.length });
      
      // Crear nombre de archivo limpio
      const cleanClassName = className.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileName = `Plantilla_Asistencia_${cleanClassName}_${month}_${year}`;
      
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
        
        // Usar la lógica de tu función existente
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
        
        // Usar expo-sharing para compartir (igual que tu función existente)
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Plantilla de Asistencia Dominical - ${className} - ${month} ${year}`,
        });
        
        const monthIndex = this.monthNames.indexOf(month);
        const sundaysCount = this.getSundaysInMonth(year, monthIndex).length;
        
        Alert.alert(
          '✅ Plantilla Generada',
          `La plantilla de asistencia dominical ha sido generada exitosamente.\n\n📋 Clase: ${className}\n📅 Mes: ${month} ${year}\n👥 Estudiantes: ${students.length}\n🗓️ Domingos: ${sundaysCount}\n\nYa puedes compartir el archivo.`
        );
        
        return uri;
      } else {
        throw new Error('No se pudo generar el archivo PDF');
      }
    } catch (error) {
      console.error('Error generando plantilla PDF:', error);
      
      // Mostrar error más específico (igual que tu función)
      let errorMessage = 'No se pudo generar la plantilla PDF';
      if (error.message.includes('RNHTMLtoPDF no está disponible')) {
        errorMessage = 'La librería PDF no está configurada correctamente. Contacta al desarrollador.';
      } else if (error.message.includes('Permission')) {
        errorMessage = 'No hay permisos para guardar archivos. Verifica los permisos de la app.';
      } else if (error.message.includes('HTML string is required')) {
        errorMessage = 'Error en el contenido de la plantilla. Verifica los datos.';
      } else if (error.message.includes('Asset')) {
        errorMessage = 'Error cargando el logo. La plantilla se generará sin logo.';
        // Intentar generar sin logo
        return await this.generatePDFWithoutLogo(className, month, year, students);
      }
      
      Alert.alert('Error', errorMessage);
      throw error;
    }
  }

  // Método auxiliar para generar PDF sin logo en caso de error
  async generatePDFWithoutLogo(className, month, year, students) {
    const originalGenerateHTML = this.generateHTML;
    this.generateHTML = async (className, month, year, students) => {
      const monthIndex = this.monthNames.indexOf(month);
      const sundays = this.getSundaysInMonth(year, monthIndex);
      // Llamar al HTML sin logo
      return originalGenerateHTML.call(this, className, month, year, students).replace(
        /\$\{logoBase64 \? .*? : ''\}/,
        "''"
      );
    };
    
    return await this.generatePDF(className, month, year, students);
  }
}

// Función helper para usar en el componente (usando la misma lógica que tu función existente)
export const generateSundayAttendanceTemplate = async (className, month, year, students) => {
  const generator = new SundayAttendanceTemplate();
  return await generator.generatePDF(className, month, year, students);
};