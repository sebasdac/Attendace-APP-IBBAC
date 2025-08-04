import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const IndividualView = ({ monthlyReport, allKids }) => {
  if (allKids.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataEmoji}>📭</Text>
        <Text style={styles.noDataText}>No hay datos de asistencia</Text>
        <Text style={styles.noDataDesc}>
          No se encontraron registros para el mes seleccionado
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.individualContainer}>
      <Text style={styles.individualTitle}>👥 Asistencia individual</Text>
      
      {allKids.map((kidName, index) => {
        const kidData = monthlyReport.attendanceByKid[kidName];
        const attendanceRate = ((kidData.total / (monthlyReport.weeklyStats.length * 2)) * 100).toFixed(1);
        
        return (
          <KidCard 
            key={index}
            kidName={kidName}
            kidData={kidData}
            attendanceRate={attendanceRate}
            weeklyStats={monthlyReport.weeklyStats}
          />
        );
      })}
    </View>
  );
};

const KidCard = ({ kidName, kidData, attendanceRate, weeklyStats }) => (
  <View style={styles.kidCard}>
    <View style={styles.kidHeader}>
      <View style={styles.kidInfo}>
        <Text style={styles.kidName}>{kidName}</Text>
        <Text style={styles.kidStats}>
          {kidData.total} de {weeklyStats.length * 2} sesiones ({attendanceRate}%)
        </Text>
      </View>
      <View style={styles.attendanceRing}>
        <Text style={styles.attendancePercent}>{attendanceRate}%</Text>
      </View>
    </View>

    <View style={styles.sessionsGrid}>
      {weeklyStats.map((week, weekIndex) => {
        const morningAttended = kidData.sessions.some(s => 
          s.date.getTime() === week.date.getTime() && s.session === 'AM'
        );
        const afternoonAttended = kidData.sessions.some(s => 
          s.date.getTime() === week.date.getTime() && s.session === 'PM'
        );

        return (
          <View key={weekIndex} style={styles.weekColumn}>
            <Text style={styles.weekNumber}>S{weekIndex + 1}</Text>
            <View style={styles.sessionDots}>
              <View style={[
                styles.sessionDot,
                morningAttended ? styles.sessionDotPresent : styles.sessionDotAbsent
              ]} />
              <View style={[
                styles.sessionDot,
                afternoonAttended ? styles.sessionDotPresent : styles.sessionDotAbsent
              ]} />
            </View>
          </View>
        );
      })}
    </View>

    <View style={styles.attendancePattern}>
      <Text style={styles.patternTitle}>Patrón de asistencia:</Text>
      <View style={styles.patternLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.sessionDot, styles.sessionDotPresent]} />
          <Text style={styles.legendText}>Presente</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.sessionDot, styles.sessionDotAbsent]} />
          <Text style={styles.legendText}>Ausente</Text>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  individualContainer: {
    gap: 20,
  },
  individualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  kidCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  kidStats: {
    fontSize: 12,
    color: '#64748b',
  },
  attendanceRing: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendancePercent: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sessionsGrid: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  weekColumn: {
    alignItems: 'center',
  },
  weekNumber: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  sessionDots: {
    flexDirection: 'column',
    gap: 4,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionDotPresent: {
    backgroundColor: '#22c55e',
  },
  sessionDotAbsent: {
    backgroundColor: '#e5e7eb',
  },
  attendancePattern: {
    marginTop: 16,
  },
  patternTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#334155',
  },
  patternLegend: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  noDataContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  noDataEmoji: {
    fontSize: 48,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
  },
  noDataDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
});