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
}) => (
  <View style={styles.controlsSection}>
    <View style={styles.controlsRow}>
      <TouchableOpacity
        style={[styles.selectorCard, { flex: 1, marginRight: 8 }]}
        onPress={onClassPress}
      >
        <Text style={styles.selectorLabel}>Clase</Text>
        <Text style={styles.selectorValue}>
          {selectedClass || "Seleccionar"}
        </Text>
        <Icon name="keyboard-arrow-down" size={20} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectorCard, { flex: 1, marginLeft: 8 }]}
        onPress={onMonthPress}
      >
        <Text style={styles.selectorLabel}>Mes</Text>
        <Text style={styles.selectorValue}>{selectedMonth}</Text>
        <Icon name="keyboard-arrow-down" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>

    <View style={styles.reportTypeToggle}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          reportType === 'overview' && styles.toggleButtonActive
        ]}
        onPress={() => onReportTypeChange('overview')}
      >
        <Text style={[
          styles.toggleText,
          reportType === 'overview' && styles.toggleTextActive
        ]}>
          📊 Resumen
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          reportType === 'detailed' && styles.toggleButtonActive
        ]}
        onPress={() => onReportTypeChange('detailed')}
      >
        <Text style={[
          styles.toggleText,
          reportType === 'detailed' && styles.toggleTextActive
        ]}>
          📋 Detallado
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  controlsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#64748b',
    position: 'absolute',
    top: 8,
    left: 16,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
  },
  reportTypeToggle: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
});
