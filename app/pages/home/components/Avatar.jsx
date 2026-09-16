import { useState } from "react";
import { Image, Text, View } from "react-native";
import { AVATAR_COLORS } from "../constants/FeedConstants";

export function Avatar({ src, initials, size = 36, gradA, gradB, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [a] = gradA && gradB ? [gradA, gradB] : AVATAR_COLORS[index % AVATAR_COLORS.length];

  if (src && !imgError) {
    return (
      <Image
        source={{ uri: src }}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: size * 0.3,
          borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
        }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: a, alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: size / 2.8, fontWeight: "700", color: "#fff" }}>
        {initials || "??"}
      </Text>
    </View>
  );
}