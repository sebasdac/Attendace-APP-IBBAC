import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const MultiColorIcon = ({ name, size, focused }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(focused ? 360 : 0, { duration: 500 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={["#ff7f50", "#ff6347", "#ff1493", "#1e90ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size + 4,
          height: size + 4,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: (size + 8) / 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name={name} size={size - 5} color="white" />
      </LinearGradient>
    </Animated.View>
  );
};

export default MultiColorIcon;
