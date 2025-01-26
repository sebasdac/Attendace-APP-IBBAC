import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';



const DashboardCard = ({ title, top3Data, cardStyle }) => (
    <View style={[styles.card, cardStyle]}>
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
      <Text style={styles.noDataText}>No hay datos disponibles</Text>
    )}
  </View>
  
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
      },
      card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      title: {
        fontSize: 14,
        color: '#888',
        marginVertical: 8,
      },
      top3Title: {
        textAlign: 'center',
        fontSize: 18,
        marginBottom: 16,
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
      },
      noDataText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 16,
      },
});

export default DashboardCard;
