import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CalendarView = ({ monthlyReport, getAttendeesForSession }) => (
  <View style={styles.calendarContainer}>
    <Text style={styles.calendarTitle}>🗓️ Asistencia por fecha</Text>
    
    {monthlyReport.weeklyStats.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.dateCard}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>
            {week.date.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          <View style={styles.dateStats}>
            <Text style={styles.dateTotal}>
              Total: {week.total} asistencias
            </Text>
          </View>
        </View>

        <View style={styles.sessionsRow}>
          <SessionBlock 
            title="🌅 Mañana"
            count={week.morning}
            attendees={getAttendeesForSession(week.date, 'AM')}
          />
          <SessionBlock 
            title="🌆 Tarde"
            count={week.afternoon}
            attendees={getAttendeesForSession(week.date, 'PM')}
          />
        </View>
      </View>
    ))}
  </View>
);

const SessionBlock = ({ title, count, attendees }) => (
  <View style={styles.sessionBlock}>
    <View style={styles.sessionHeader}>
      <Text style={styles.sessionTitle}>{title}</Text>
      <Text style={styles.sessionCount}>{count}</Text>
    </View>
    
    <View style={styles.attendeesList}>
      {attendees.map((attendee, index) => (
        <View key={index} style={styles.attendeeChip}>
          <Text style={styles.attendeeChipText}>{attendee}</Text>
        </View>
      ))}
      {count === 0 && (
        <Text style={styles.noAttendees}>Sin asistencia</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  calendarContainer: {
    gap: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#334155',
  },
  dateCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateHeader: {
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textTransform: 'capitalize',
  },
  dateStats: {
    marginTop: 4,
  },
  dateTotal: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionBlock: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  sessionCount: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  attendeesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attendeeChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendeeChipText: {
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '500',
  },
  noAttendees: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});