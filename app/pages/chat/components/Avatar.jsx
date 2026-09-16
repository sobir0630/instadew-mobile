import React from "react";
import { View, Text, Image } from "react-native";
import { getInitials, getPalette } from "../utils/helpers";

export default function Avatar({ name = "", size = 40, showRing = false, src = null, online = null, accentColor, bgColor }) {
  const [c1] = getPalette(name);
  return (
    <View style={{ position: "relative", width: size, height: size }}>
      <View
        style={[
          {
            width: size, height: size, borderRadius: size * 0.28,
            backgroundColor: c1, alignItems: "center", justifyContent: "center", overflow: "hidden",
          },
          showRing && { borderWidth: 2, borderColor: accentColor },
        ]}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Text style={{ fontSize: size * 0.36, fontWeight: "700", color: "#545353" }}>{getInitials(name)}</Text>
        )}
      </View>
      {online !== null ? (
        <View
          style={{
            position: "absolute", bottom: -1, right: -1,
            width: Math.max(9, size * 0.22), height: Math.max(9, size * 0.22),
            borderRadius: 999, backgroundColor: online ? "#22C55E" : "#94A3B8",
            borderWidth: 2, borderColor: bgColor,
          }}
        />
      ) : null}
    </View>
  );
}