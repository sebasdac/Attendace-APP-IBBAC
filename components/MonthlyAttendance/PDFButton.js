import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { generateMonthlyReportPDF } from '../../utils/pdfGenerator';

export const PDFButton = ({ 
  monthlyReport, 
  selectedClass, 
  selectedMonth, 
  currentYear, 
  disabled = false 
}) => {
  const handleGeneratePDF = async () => {
    if (!monthlyReport || !selectedClass || !selectedMonth) {
      Alert.alert('Error', 'No hay datos suficientes para generar el PDF');
      return;
    }

    try {
      await generateMonthlyReportPDF(monthlyReport, selectedClass, selectedMonth, currentYear);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.pdfButton, disabled && styles.pdfButtonDisabled]}
      onPress={handleGeneratePDF}
      disabled={disabled}
    >
      <Icon 
        name="picture-as-pdf" 
        size={20} 
        color={disabled ? "#94a3b8" : "#ffffff"} 
      />
      <Text style={[styles.pdfButtonText, disabled && styles.pdfButtonTextDisabled]}>
        Generar PDF
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pdfButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  pdfButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  pdfButtonTextDisabled: {
    color: '#94a3b8',
  },
});