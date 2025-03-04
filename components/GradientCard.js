import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";

const GradientCard = ({ colors, iconName, title, subtitle, onPress, showSaetas = false }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient colors={colors} style={styles.card}>
        <Icon name={iconName} size={40} color="#FFF" />
        
        {/* Renderiza "SAETAS" solo si showSaetas es true */}
        {showSaetas && (
          <Text style={styles.saetas}>
            <Text style={[styles.letter, { color: "#36B150" }]}>S</Text>
            <Text style={[styles.letter, { color: "#F7931E" }]}>A</Text>
            <Text style={[styles.letter, { color: "#80469B" }]}>E</Text>
            <Text style={[styles.letter, { color: "#36B150" }]}>T</Text>
            <Text style={[styles.letter, { color: "#2377D6" }]}>A</Text>
            <Text style={[styles.letter, { color: "#2377D6" }]}>S</Text>
          </Text>
        )}

        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  saetas: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 10,
  },
  letter: {
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
    textAlign: "center",
  },
});

export default GradientCard;
