import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const DetailedViewToggle = ({ detailedView, onViewChange }) => (
  <View style={styles.detailedOptions}>
    <TouchableOpacity
      style={[
        styles.detailOption,
        detailedView === 'calendar' && styles.detailOptionActive
      ]}
      onPress={() => onViewChange('calendar')}
    >
      <Text style={[
        styles.detailOptionText,
        detailedView === 'calendar' && styles.detailOptionTextActive
      ]}>
        📅 Calendario
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.detailOption,
        detailedView === 'individual' && styles.detailOptionActive
      ]}
      onPress={() => onViewChange('individual')}
    >
      <Text style={[
        styles.detailOptionText,
        detailedView === 'individual' && styles.detailOptionTextActive
      ]}>
        👥 Individual
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  detailedOptions: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailOptionActive: {
    backgroundColor: '#6366f1',
  },
  detailOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  detailOptionTextActive: {
    color: '#ffffff',
  },
});
