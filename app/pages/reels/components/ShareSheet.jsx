import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { buildRoomName } from "../../../pages/message";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import API from "../../../api/server";
import { getUsers } from "../constants/ReelsConstants";
import { styles } from "../styles/ReelsStyles";
import { showToast } from "../utils/toast";

// ═══════════════════════════════════════════════════════════════════════
//  ULASHISH PANELI
// ═══════════════════════════════════════════════════════════════════════
export function ShareSheet({ visible, onClose, video }) {
  const [sentTo, setSentTo] = useState([]);
  const link = video?.video || video?.id || video?.video_id; // serverdan kelgan video URL yoki ID
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(null); // sending state uchun

  // Kontaktlar ro'yxatini olish
  useEffect(() => {
    if (visible) {
      getUsers().then(setContacts).catch((err) => console.log("Kontaktlarni olishda xatolik:", err?.message));
    }
  }, [visible]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(link);
    showToast("Havola nusxalandi");
  };

  const authHeader = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return { Authorization: `Bearer ${token?.trim()}` };
    } catch (err) {
      console.error("[authHeader] error:", err);
      return {};
    }
  };


  const sendToContact = async (contact) => {
    try {
      setLoading(contact.id);
      const myUsername = await AsyncStorage.getItem("username");
      const roomName = buildRoomName(myUsername, contact.username);
      const headers = await authHeader();
      
      const videoMessage = `🎥 Video: ${link}`;
      
      await API.post(
        `/messages/message/`,
        { room: roomName, sender: myUsername, receiver: contact.id, content: videoMessage.trim() },
        { headers }
      );
      
      setSentTo((prev) => [...prev, contact.id]);
      showToast(`${contact.username} ga video yuborildi ✓`);
    } catch (err) {
      console.error("Video yuborishda xatolik:", err?.response?.data || err.message);
      showToast("Video yuborilmadi, qayta urinib ko'ring");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Ulashish</Text>

          <FlatList
            horizontal
            data={contacts}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.contact, sentTo.includes(item.id) && styles.contactSent]} 
                onPress={() => !sentTo.includes(item.id) && sendToContact(item)}
                disabled={sentTo.includes(item.id) || loading === item.id}
              >
                <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
                <Text style={styles.contactName} numberOfLines={1}>
                  {item.username}
                </Text>
                <View style={styles.sentLabelContainer}>
                  {loading === item.id ? (
                    <ActivityIndicator size={14} color="#fff" />
                  ) : (
                    <Text style={styles.sentLabel}>
                      {sentTo.includes(item.id) ? "✓ Yuborildi" : "Yuborish"}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={copyLink}>
              <View style={styles.actionIcon}>
                <Ionicons name="link" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Havolani nusxalash</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}