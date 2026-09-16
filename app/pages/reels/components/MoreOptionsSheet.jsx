import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { BASE_SHARE_URL } from "../constants/ReelsConstants";
import { showToast } from "../utils/toast";
import { styles } from "../styles/ReelsStyles";


// ═══════════════════════════════════════════════════════════════════════
//  UCH NUQTALI (...) QO'SHIMCHA MENYU
// ═══════════════════════════════════════════════════════════════════════
export function MoreOptionsSheet({ visible, onClose, video }) {
  const handleOption = async (key) => {
    switch (key) {
      case "not_interested":
        showToast("Bunday videolar kamroq ko'rsatiladi");
        break;
      case "report":
        showToast("Shikoyatingiz uchun rahmat");
        break;
      case "copy_link":
        await Clipboard.setStringAsync(`${video?.video || video?.id || video?.video_id}`);
        showToast("Havola nusxalandi");
        break;
      case "mute_notifications":
        showToast("Bildirishnomalar o'chirildi");
        break;
      case "save":
        showToast("Video saqlandi");
        break;
      default:
        break;
    }
    onClose();
  };

  const options = [
    { key: "save", label: "Saqlash", icon: <Feather name="bookmark" size={22} color="#fff" /> },
    { key: "copy_link", label: "Havolani nusxalash", icon: <Ionicons name="link" size={22} color="#fff" /> },
    {
      key: "not_interested",
      label: "Bu meni qiziqtirmaydi",
      icon: <MaterialCommunityIcons name="eye-off-outline" size={22} color="#fff" />,
    },
    {
      key: "mute_notifications",
      label: "Bildirishnomalarni o'chirish",
      icon: <Ionicons name="notifications-off-outline" size={22} color="#fff" />,
    },
    {
      key: "report",
      label: "Shikoyat qilish",
      icon: <Ionicons name="flag-outline" size={22} color="#ff4d4d" />,
      danger: true,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {options.map((opt) => (
            <TouchableOpacity key={opt.key} style={styles.row} onPress={() => handleOption(opt.key)}>
              {opt.icon}
              <Text style={[styles.rowLabel, opt.danger && { color: "#ff4d4d" }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}