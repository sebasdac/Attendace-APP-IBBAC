import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StatsCards = ({ monthlyReport }) => (
  <View style={styles.statsGrid}>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{monthlyReport.totalAttendance}</Text>
      <Text style={styles.statLabel}>Total asistencias</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{monthlyReport.averagePerSession}</Text>
      <Text style={styles.statLabel}>Promedio por sesión</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

