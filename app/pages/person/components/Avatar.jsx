import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { AVATAR_COLORS } from "../constants/theme";
import { getInitials } from "../utils/helpers";

export default function Avatar({ src, name, size = 36, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name || "");
  const [a, b] = AVATAR_COLORS[index % AVATAR_COLORS.length];

  if (src && !imgError) {
    return (
      <Image
        source={{ uri: src }}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.7)",
        }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: a, alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: size / 2.8, fontWeight: "700", color: "#fff" }}>{initials}</Text>
    </View>
  );
}