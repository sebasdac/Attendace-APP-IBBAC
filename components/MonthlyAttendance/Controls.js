// Controls.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const Controls = ({
  selectedClass,
  selectedMonth,
  reportType,
  onClassPress,
  onMonthPress,
  onReportTypeChange,
  onDownloadTemplate, // Nueva prop
  currentYear
}) => {
  return (
    <View style={styles.container}>
      {/* Selectores de clase y mes */}
      <View style={styles.selectorsRow}>
        <TouchableOpacity style={styles.selector} onPress={onClassPress}>
          <View style={styles.selectorHeader}>
            <Icon name="school" size={16} color="#6366f1" />
            <Text style={styles.selectorLabel}>Clase</Text>
          </View>
          <Text style={styles.selectorValue}>
            {selectedClass || 'Seleccionar'}
          </Text>
          <Icon name="keyboard-arrow-down" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.selector} onPress={onMonthPress}>
          <View style={styles.selectorHeader}>
            <Icon name="calendar-today" size={16} color="#6366f1" />
            <Text style={styles.selectorLabel}>Mes</Text>
          </View>
          <Text style={styles.selectorValue}>
            {selectedMonth ? `${selectedMonth} ${currentYear}` : 'Seleccionar'}
          </Text>
          <Icon name="keyboard-arrow-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Botón de plantilla - solo visible si hay clase y mes seleccionados */}
      {selectedClass && selectedMonth && (
        <TouchableOpacity 
          style={styles.templateButton}
          onPress={() => onDownloadTemplate(selectedMonth, selectedClass)}
        >
          <Icon name="file-download" size={18} color="#10b981" />
          <Text style={styles.templateButtonText}>Descargar Plantilla</Text>
        </TouchableOpacity>
      )}

      {/* Toggles de tipo de reporte */}
      <View style={styles.reportTypeContainer}>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            reportType === 'overview' && styles.reportTypeButtonActive
          ]}
          onPress={() => onReportTypeChange('overview')}
        >
          <View style={styles.reportTypeContent}>
            <Icon 
              name="assessment" 
              size={16} 
              color={reportType === 'overview' ? '#334155' : '#64748b'} 
            />
            <Text style={[
              styles.reportTypeText,
              reportType === 'overview' && styles.reportTypeTextActive
            ]}>
              Resumen
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            reportType === 'detailed' && styles.reportTypeButtonActive
          ]}
          onPress={() => onReportTypeChange('detailed')}
        >
          <View style={styles.reportTypeContent}>
            <Icon 
              name="list-alt" 
              size={16} 
              color={reportType === 'detailed' ? '#334155' : '#64748b'} 
            />
            <Text style={[
              styles.reportTypeText,
              reportType === 'detailed' && styles.reportTypeTextActive
            ]}>
              Detallado
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selector: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  selectorValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  templateButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  reportTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  reportTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  reportTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportTypeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportTypeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  reportTypeTextActive: {
    color: '#334155',
    fontWeight: '600',
  },
});