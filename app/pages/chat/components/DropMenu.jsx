import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

export default function DropMenu({ visible, onClose, theme, items = [] }) {
  if (!visible) return null;

  const surface = theme?.surface || "#111827";
  const card = theme?.card || "#1F2937";
  const border = theme?.border || "rgba(255,255,255,0.08)";
  const text = theme?.text || "#F3F4F6";
  const sub = theme?.sub || "#9CA3AF";
  const danger = "#EF4444";

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.container} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: card, borderColor: border, shadowColor: theme?.shadow || "#000" }]}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={`${item.label}-${index}`}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                if (item.action) item.action();
              }}
              style={[styles.row, index !== items.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}
            >
              <View style={styles.iconWrap}>{item.icon || null}</View>
              <Text style={[styles.label, { color: item.danger ? danger : text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.24)" },
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  card: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});