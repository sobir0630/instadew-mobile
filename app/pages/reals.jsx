import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/server";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// O'zingizning domeningizga almashtiring (havolani nusxalash / ulashish uchun)
const BASE_SHARE_URL = "https://yourapp.com/reels";

// Namuna kontaktlar ro'yxati — real kontaktlar/chat API bilan almashtiring
const MOCK_CONTACTS = [
  { id: 1, username: "aziz_dev", avatar: "https://via.placeholder.com/50" },
  { id: 2, username: "dilnoza99", avatar: "https://via.placeholder.com/50" },
  { id: 3, username: "javlon_uz", avatar: "https://via.placeholder.com/50" },
];

function formatCount(num) {
  if (!num) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1000000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

function showToast(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("", message);
  }
}

/* ------------------------------------------------------------------ */
/*  Kommentlar paneli                                                  */
/* ------------------------------------------------------------------ */
function CommentsSheet({ visible, onClose, videoId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.get(`/comments/comments/?video=${videoId}`, 
        { headers: { Authorization: `Bearer ${token?.trim()}` } }
      );
      const data = res.data;
      setComments(data.results || data);
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

    const token = await AsyncStorage.getItem("token");

    try {
      const res = await API.post(`/comments/comments/`, 
      { video_id: videoId,  text: text.trim() },
      { headers: { Authorization: `Bearer ${token?.trim()}` } }
    );
      setComments((prev) => [res.data, ...prev]);
      setText("");
      onCommentAdded && onCommentAdded();
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
          <Text style={styles.sheetTitle}>Kommentlar</Text>

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
                    source={{ uri: item.avatar || "https://via.placeholder.com/40" }}
                    style={styles.commentAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{item.username || item.user}</Text>
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

/* ------------------------------------------------------------------ */
/*  Ulashish paneli                                                    */
/* ------------------------------------------------------------------ */
function ShareSheet({ visible, onClose, video }) {
  const [sentTo, setSentTo] = useState([]);
  const link = `${BASE_SHARE_URL}/${video?.id}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(link);
    showToast("Havola nusxalandi");
  };

  const shareNative = async () => {
    try {
      await Share.share({ message: `Shu videoni ko'r: ${link}`, url: link });
    } catch (err) {
      console.log("Share xatolik:", err?.message);
    }
  };

  const sendToContact = (contact) => {
    // Bu yerga real xabar (chat/direct message) yuborish API chaqiruvini ulang
    setSentTo((prev) => [...prev, contact.id]);
    showToast(`${contact.username} ga yuborildi`);
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
            data={MOCK_CONTACTS}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.contact} onPress={() => sendToContact(item)}>
                <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
                <Text style={styles.contactName} numberOfLines={1}>
                  {item.username}
                </Text>
                <Text style={styles.sentLabel}>{sentTo.includes(item.id) ? "Yuborildi" : "Yuborish"}</Text>
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

            <TouchableOpacity style={styles.actionBtn} onPress={shareNative}>
              <View style={styles.actionIcon}>
                <Ionicons name="share-social" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Boshqa ilovaga</Text>
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

/* ------------------------------------------------------------------ */
/*  Uch nuqtali (...) qo'shimcha menyu                                 */
/* ------------------------------------------------------------------ */
function MoreOptionsSheet({ visible, onClose, video }) {
  const handleOption = async (key) => {
    switch (key) {
      case "not_interested":
        showToast("Bunday videolar kamroq ko'rsatiladi");
        break;
      case "report":
        showToast("Shikoyatingiz uchun rahmat");
        break;
      case "copy_link":
        await Clipboard.setStringAsync(`${BASE_SHARE_URL}/${video?.id}`);
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

/* ------------------------------------------------------------------ */
/*  Bitta video kartochkasi                                            */
/* ------------------------------------------------------------------ */
function ReelItem({ video, isActive }) {
  const router = useRouter();
  const videoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liked, setLiked] = useState(video.is_liked || false);
  const [likeCount, setLikeCount] = useState(video.likes_count || 0);
  const [isFollowing, setIsFollowing] = useState(video.is_following || false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [commentCount, setCommentCount] = useState(video.comments_count || 0);

  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  // Video faqat ekranda ko'rinib turganda ijro etiladi -
  // shuning uchun ekranga kirganda video "chiqib" ketmaydi
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
  }, [isActive]);

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    try {

      const token = await AsyncStorage.getItem("token")
      await API.post(`/videos/video/${video.id}/like/`,
         { id: video.id, type: video },
         { headers: {
             Authorization: `Bearer ${token.trim()}` 
          }
         }
      );

    } catch (err) {
      setLiked(!newLiked);
      setLikeCount((c) => (!newLiked ? c + 1 : Math.max(0, c - 1)));
      console.log("Like xatolik:", err?.message);
    }
  };

  const showHeartAnimation = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
      Animated.timing(heartScale, { toValue: 0, duration: 400, delay: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (!liked) toggleLike();
      showHeartAnimation();
    } else {
      togglePause();
    }
    lastTap.current = now;
  };

  const togglePause = () => {
    if (isPaused) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
    setIsPaused((p) => !p);
  };

  const goToProfile = () => {
    router.push(`/pages/userAccount?username=${encodeURIComponent(video.username)}`);
  };

  const toggleFollow = () => {
    // Bu yerga real follow/unfollow API chaqiruvini ulang
    setIsFollowing((f) => !f);
  };

  const [avatar, setAvatar] = useState();


  try{
    const token = AsyncStorage.getItem("token");
    const id = video.user; // Foydalanuvchi ID sini oling
    console.log("user id:", id);

    const res = API.get(`/users/user-view/${id}/`, {
      headers: {
        Authorization: `Bearer ${token?.trim()}`
      }
    })

    if (res.status === 200) {
      setAvatar(res.data.avatar);
    }
  } catch (err) {
    console.log(err.response?.data);
    console.log(err.response?.status);
  }



  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleDoubleTap}>
        <Video
          ref={videoRef}
          source={{ uri: video.video_url || video.video }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          isLooping
          isMuted={isMuted}
          shouldPlay={isActive}
        />
      </TouchableOpacity>

      {/* Ikki marta bosilganda chiqadigan yurak animatsiyasi */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heartOverlay,
          {
            opacity: heartScale,
            transform: [
              { scale: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.4] }) },
            ],
          },
        ]}
      >
        <Ionicons name="heart" size={110} color="#fff" />
      </Animated.View>

      {/* Ovozni yoqish / o'chirish */}
      <TouchableOpacity style={styles.muteBtn} onPress={() => setIsMuted((m) => !m)}>
        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="#fff" />
      </TouchableOpacity>

      {/* O'ng tomondagi harakat tugmalari */}
      <View style={styles.rightBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={goToProfile}>
          <Image
            source={{ uri: avatar || "https://via.placeholder.com/50" }}
            style={styles.avatar}
          />
          {!isFollowing && (
            <TouchableOpacity style={styles.plusBtn} onPress={toggleFollow}>
              <Ionicons name="add" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={toggleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={34} color={liked ? "#ff2d55" : "#fff"} />
          <Text style={styles.iconLabel}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setCommentsVisible(true)}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color="#fff" />
          <Text style={styles.iconLabel}>{formatCount(commentCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setShareVisible(true)}>
          <Ionicons name="arrow-redo-outline" size={32} color="#fff" />
          <Text style={styles.iconLabel}>Ulashish</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setMoreVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Pastdagi foydalanuvchi ma'lumotlari */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity onPress={goToProfile}>
          <Image
            source={{ uri: avatar || "https://placehold.net/4.png" }}
            style={styles.avatar}
          />
          <Text style={styles.username}>@{video.username}</Text>
        </TouchableOpacity>
        {video.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {video.caption}
          </Text>
        ) : null}
      </View>

      {isPaused && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <Ionicons name="play" size={70} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <CommentsSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        videoId={video.id}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
      />

      <ShareSheet visible={shareVisible} onClose={() => setShareVisible(false)} video={video} />

      <MoreOptionsSheet visible={moreVisible} onClose={() => setMoreVisible(false)} video={video} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Asosiy ekran - vertikal scroll video lenta                         */
/* ------------------------------------------------------------------ */
export default function Reals() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchVideos = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await API.get("/videos/reals-videos/", {
        headers: {
          Authorization: `Bearer ${token?.trim()}`
        }
      });

      const data = res.data;
      const results = data.results || data;

      setVideos(results);
    } catch (err) {
      console.log(err.response?.data);
      console.log(err.response?.status);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
  }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos("/videos/reals-videos/", true);
  };

  const onEndReached = () => {
    if (nextPage && !loadingMore) {
      setLoadingMore(true);
      fetchVideos(nextPage);
    }
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = useCallback(
    ({ item, index }) => <ReelItem video={item} isActive={index === activeIndex} />,
    [activeIndex]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      onEndReached={onEndReached}
      onEndReachedThreshold={2}
      windowSize={3}
      maxToRenderPerBatch={2}
      initialNumToRender={2}
      removeClippedSubviews
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} /> : null
      }
      style={styles.list}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Stillar                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "#000" },
  heartOverlay: { position: "absolute", top: "40%", left: "50%", marginLeft: -55, marginTop: -55 },
  muteBtn: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  rightBar: { position: "absolute", right: 10, bottom: 110, alignItems: "center" },
  iconBtn: { alignItems: "center", marginBottom: 22 },
  iconLabel: { color: "#fff", fontSize: 12, marginTop: 4, fontWeight: "600" },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: "#dddada" },
  plusBtn: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    backgroundColor: "#ff2d55",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomInfo: { position: "absolute", left: 14, right: 80, bottom: 80 },
  username: { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 6 },
  caption: { color: "#eee", fontSize: 13 },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: { width: 40, height: 4, backgroundColor: "#555", borderRadius: 2, alignSelf: "center", marginVertical: 8 },
  sheetTitle: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center", marginBottom: 10 },
  empty: { color: "#888", textAlign: "center", marginTop: 30 },
  commentRow: { flexDirection: "row", marginBottom: 16 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  commentUser: { color: "#bbb", fontSize: 12, fontWeight: "600", marginBottom: 2 },
  commentText: { color: "#fff", fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    backgroundColor: "#242424",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  contact: { alignItems: "center", marginRight: 18, width: 70 },
  contactAvatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 6 },
  contactName: { color: "#fff", fontSize: 12 },
  sentLabel: { color: "#0af", fontSize: 10, marginTop: 2 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, marginBottom: 6 },
  actionBtn: { alignItems: "center" },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  actionLabel: { color: "#ddd", fontSize: 11, textAlign: "center", maxWidth: 80 },
  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: "#2a2a2a" },
  cancelText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rowLabel: { color: "#fff", fontSize: 15, marginLeft: 16 },
});