import React, { useState } from "react";
import { Modal, TouchableOpacity, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconImageIcon } from "../constants/icons";
import { WALLPAPER_CATEGORIES, WALLPAPER_PRESETS } from "../constants/config";
import { styles } from "../constants/styles";

export default function WallpaperSheet({ visible, onClose, theme, onSelectGradient, onSelectCustom, onReset }) {
  const [cat, setCat] = useState("love");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.wallpaperCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 12 }}>Suhbat foni</Text>

          <View style={styles.catTabsRow}>
            {WALLPAPER_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCat(c.key)}
                style={[
                  styles.catTab, { borderColor: theme.border },
                  cat === c.key && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
              >
                <Text style={{ fontSize: 12, color: cat === c.key ? "#fff" : theme.sub, fontWeight: "600" }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {cat === "none" ? (
            <TouchableOpacity onPress={() => { onReset(); onClose(); }} style={[styles.resetWallBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: "600" }}>Standart fonni tiklash</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.wallGrid}>
              {(WALLPAPER_PRESETS[cat] || []).map((colors, i) => (
                <TouchableOpacity key={i} onPress={() => { onSelectGradient(colors); onClose(); }} style={styles.wallSwatchWrap}>
                  <LinearGradient colors={colors} style={styles.wallSwatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={() => { onSelectCustom(); onClose(); }} style={[styles.customWallBtn, { borderColor: theme.accent }]}>
            <IconImageIcon size={18} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>Galereyadan rasm tanlash</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}