import { View } from "react-native";
import { styles } from "../styles/FeedStyles";

export function Skeleton({ w, h = 14, r = 6, style: sx }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: "#e9ecef" }, sx]} />;
}

export function StorySkeleton() {
  return (
    <View style={{ alignItems: "center", gap: 6, marginRight: 12 }}>
      <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: "#e9ecef" }} />
      <Skeleton w={48} h={10} r={4} />
    </View>
  );
}

export function PostSkeleton() {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#e9ecef" }} />
        <View style={{ gap: 6 }}>
          <Skeleton w={120} h={13} />
          <Skeleton w={72} h={11} />
        </View>
      </View>
      <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#e9ecef" }} />
      <View style={{ padding: 14, gap: 8 }}>
        <Skeleton w={80} h={13} />
        <Skeleton w="90%" h={12} />
        <Skeleton w="60%" h={12} />
      </View>
    </View>
  );
}