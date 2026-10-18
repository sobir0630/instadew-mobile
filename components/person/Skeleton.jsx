import React from "react";
import { View } from "react-native";

export function Skeleton({ w, h = 14, r = 6 }) {
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: "#e9ecef" }} />;
}

export function ProfileSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#e9ecef" }} />
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ alignItems: "center", gap: 6 }}>
              <Skeleton w={40} h={18} /><Skeleton w={56} h={12} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 8, marginBottom: 20 }}>
        <Skeleton w={140} h={16} /><Skeleton w={200} h={13} />
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        <View style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: "#e9ecef" }} />
        <View style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: "#e9ecef" }} />
      </View>
    </View>
  );
}