import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const WeeklyChart = ({ weeklyStats }) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>📊 Asistencia por semana</Text>
    {weeklyStats.map((week, index) => (
      <View key={index} style={styles.weekBar}>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>Semana {week.week}</Text>
          <Text style={styles.weekDate}>
            {week.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={styles.weekStats}>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionLabel}>🌅 {week.morning}</Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionLabel}>🌆 {week.afternoon}</Text>
          </View>
          <View style={styles.totalStat}>
            <Text style={styles.totalLabel}>{week.total}</Text>
          </View>
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekInfo: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  weekDate: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  weekStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionStat: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  totalStat: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
