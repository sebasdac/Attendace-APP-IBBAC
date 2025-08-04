import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TopAttendees = ({ topAttendees }) => {
  if (topAttendees.length === 0) return null;

  return (
    <View style={styles.topAttendeesContainer}>
      <Text style={styles.sectionTitle}>🏆 Top 5 del mes</Text>
      {topAttendees.map((attendee, index) => (
        <View key={index} style={styles.attendeeItem}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <View style={styles.attendeeInfo}>
            <Text style={styles.attendeeName}>{attendee.name}</Text>
            <Text style={styles.attendeeCount}>{attendee.count} asistencias</Text>
          </View>
          <View style={styles.attendeeProgress}>
            <View 
              style={[
                styles.progressBar,
                { width: `${(attendee.count / topAttendees[0].count) * 100}%` }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  topAttendeesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  attendeeCount: {
    fontSize: 12,
    color: '#64748b',
  },
  attendeeProgress: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    width: 80,
    marginLeft: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#6366f1',
  },
});
