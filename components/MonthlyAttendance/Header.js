// components/MonthlyAttendance/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const Header = ({ onBackPress }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <Icon name="arrow-back" size={24} color="#ffffff" />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text style={styles.header}>📈 Reporte Mensual</Text>
      <Text style={styles.subtitle}>Análisis de asistencia detallado</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#6366f1',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#c7d2fe',
    opacity: 0.9,
  },
});