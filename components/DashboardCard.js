import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const DashboardCard = ({ title, top3Data, cardStyle }) => (
  <LinearGradient
    colors={['#4A90E2', '#1E62D0']}
    style={[styles.card, cardStyle]}
  >
    <Text style={[styles.title, styles.top3Title]}>{title}</Text>
    {top3Data && top3Data.length > 0 ? (
      top3Data.map((person, index) => (
        <View key={index} style={styles.top3Item}>
          <Ionicons
            name={
              index === 0
                ? 'trophy' // Trofeo para el primer lugar
                : index === 1
                ? 'medal-outline' // Medalla para el segundo lugar
                : 'ribbon-outline' // Cinta para el tercer lugar
            }
            size={24}
            color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} // Oro, plata, bronce
          />
          <Text style={styles.personName}>{person.name}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noDataText}>No data available</Text>
    )}
  </LinearGradient>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  top3Title: {
    fontSize: 18,
    color: '#fff',
  },
  top3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  personName: {
    fontSize: 16,
    marginLeft: 12,
    color: '#fff',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default DashboardCard;
