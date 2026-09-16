import { Modal, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./CreatePostStyles";
import { IconClose, IconCommentOff, IconHeartOff } from "./Icons";

// ════════════════════════════════════════════════════════════════════════════
//  ADVANCED SETTINGS PANEL
// ════════════════════════════════════════════════════════════════════════════

export function AdvancedPanel({ visible, settings, onChange, onClose }) {
  const toggle = (key) => onChange({ ...settings, [key]: !settings[key] });
  const items = [
    {
      key: "comments_off",
      label: "Kommentlarni o'chirish",
      desc: "Bu postga hech kim komment yoza olmaydi",
      color: "#cf222e",
      Icon: IconCommentOff,
    },
    {
      key: "hide_likes",
      label: "Like sonini yashirish",
      desc: "Boshqalar like sonini ko'ra olmaydi",
      color: "#e36209",
      Icon: IconHeartOff,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Qo'shimcha sozlamalar</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <IconClose />
            </TouchableOpacity>
          </View>

          {items.map((item, i) => (
            <View key={item.key}>
              <TouchableOpacity onPress={() => toggle(item.key)} style={styles.advancedRow}>
                <View style={[styles.advancedIconWrap, { backgroundColor: `${item.color}1A` }]}>
                  <item.Icon color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.advancedLabel}>{item.label}</Text>
                  <Text style={styles.advancedDesc}>{item.desc}</Text>
                </View>
                <View
                  style={[
                    styles.toggleTrack,
                    { backgroundColor: settings[item.key] ? item.color : "#d0d7de" },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      { left: settings[item.key] ? 22 : 2 },
                    ]}
                  />
                </View>
              </TouchableOpacity>
              {i < items.length - 1 ? <View style={styles.advancedDivider} /> : null}
            </View>
          ))}

          <View style={{ padding: 16, paddingBottom: 24 }}>
            <TouchableOpacity onPress={onClose} style={styles.sheetDoneBtnOutline}>
              <Text style={styles.sheetDoneBtnOutlineText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}