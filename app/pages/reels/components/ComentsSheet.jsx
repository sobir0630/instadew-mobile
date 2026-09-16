import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView,
  Modal, Platform, Text, TextInput, TouchableOpacity, View, Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchVideoComments, submitVideoComment } from "../api/ReelsApi";
import { styles } from "../styles/ReelsStyles";

// ═══════════════════════════════════════════════════════════════════════
//  KOMMENTLAR PANELI
// ═══════════════════════════════════════════════════════════════════════
export function CommentsSheet({ visible, onClose, videoId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const router = useRouter()

  const loadComments = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const data = await fetchVideoComments(videoId);
      setComments(data);
    } catch (err) {
      console.log("Kommentlarni olishda xatolik:", err?.message);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (visible) loadComments();
  }, [visible, loadComments]);

  const sendComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const newComment = await submitVideoComment(videoId, text);
      setComments((prev) => [newComment, ...prev]);
      setText("");
      onCommentAdded?.();
    } catch (err) {
      console.log("Komment yuborishda xatolik:", err?.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Comments</Text>

          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 10 }}
              ListEmptyComponent={
                <Text style={styles.empty}>Hali kommentlar yo'q. Birinchi bo'lib yozing!</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Image
                    source={{ uri: item.avatar || "https://api.dicebear.com/9.x/personas/png?size=40&seed=user1" }}
                    style={styles.commentAvatar}
                  />
                  <View     
                    style={{
                      flex: 1,
                      marginLeft: 5,
                      justifyContent: "center",
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        router.push(`/pages/userAccount?username=${encodeURIComponent(item.username)}`)
                      }}
                    >

                      <Text style={styles.commentUser}>{item.username}</Text>
                  
                    </Pressable>
                    
                    <Text style={styles.commentText}>{item.text}</Text>

                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Komment qoldiring..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity onPress={sendComment} disabled={sending || !text.trim()}>
              <Ionicons name="send" size={24} color={text.trim() ? "#0af" : "#555"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}