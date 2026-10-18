import Animated, { FadeInDown } from "react-native-reanimated";

// Har bir PostCard'ni tartibli fade+slide animatsiyasi bilan o'raydi.
export function AnimatedPostWrapper({ children, index = 0 }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(280).springify()}>
      {children}
    </Animated.View>
  );
}