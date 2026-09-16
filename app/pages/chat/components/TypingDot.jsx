import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

export default function TypingDot({ delay = 0, color = "#6B7280" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <Animated.View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginHorizontal: 2, transform: [{ translateY }] }}
    />
  );
}