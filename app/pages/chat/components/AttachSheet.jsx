import React from "react";
import { Modal, TouchableOpacity, View, Text } from "react-native";
import { IconImageIcon, IconMovie, IconCamera, IconMusicNote, IconDocument } from "../constants/icons";
import { styles } from "../constants/styles";

export default function AttachSheet({ visible, onClose, theme, onPickImage, onPickVideo, onPickDocument, onSendMusicFile, onOpenCamera }) {
  const options = [
    { label: "Rasm", icon: <IconImageIcon />, bg: "#8B5CF6", action: onPickImage },
    { label: "Video", icon: <IconMovie size={22} color="#fff" />, bg: "#EC4899", action: onPickVideo },
    { label: "Kamera", icon: <IconCamera />, bg: "#10B981", action: onOpenCamera },
    { label: "Musiqa", icon: <IconMusicNote color="#fff" />, bg: "#0EA5E9", action: onSendMusicFile },
    { label: "Fayl", icon: <IconDocument color="#fff" />, bg: "#F59E0B", action: onPickDocument },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheetCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, marginBottom: 14 }}>Biriktirish</Text>
          <View style={styles.sheetGrid}>
            {options.map((o, i) => (
              <TouchableOpacity key={i} style={styles.sheetItem} onPress={() => { o.action(); onClose(); }}>
                <View style={[styles.sheetIconCircle, { backgroundColor: o.bg }]}>{o.icon}</View>
                <Text style={{ fontSize: 12, color: theme.text, marginTop: 6, fontWeight: "500" }}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}