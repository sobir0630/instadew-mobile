import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

// Skeleton'lar uchun ixtiyoriy animatsion "shimmer" bloki.
export function Shimmer({ width, height, borderRadius = 8, style }) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#e9ecef" }, animatedStyle, style]}
    />
  );
}