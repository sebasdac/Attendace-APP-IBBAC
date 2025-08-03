import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

const MultiColorIcon = ({ name, size, focused, color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(0.8, { duration: 200 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Si está enfocado, usar el diseño con gradiente elegante
  if (focused) {
    return (
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#6366f1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            shadowColor: "#6366f1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name={name} size={22} color="white" />
        </LinearGradient>
      </Animated.View>
    );
  }

  // Si no está enfocado, diseño simple pero elegante
  return (
    <Animated.View style={animatedStyle}>
      <Animated.View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
          backgroundColor: "#f1f5f9",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Ionicons name={name} size={size} color={color || "#64748b"} />
      </Animated.View>
    </Animated.View>
  );
};

export default MultiColorIcon;