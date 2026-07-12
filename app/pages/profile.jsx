import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api as API } from "../api/server";
import { Video } from 'expo-av';
// import ImageViewing from "react-native-image-viewing";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Linking,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_W - GRID_GAP * 2) / 3;

// ════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const AVATAR_COLORS = [
  ["#667eea", "#764ba2"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#d97706"],
  ["#ef4444", "#dc2626"],
  ["#0969da", "#0550ae"],
  ["#ec4899", "#db2777"],
  ["#6366f1", "#4f46e5"],
];

// ════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════════════

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n ?? 0);
}
function getInitials(name = "") {
  return (
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??"
  );
}
function getCommentAuthor(c) {
  return c.author?.username || c.author?.full_name || c.username || c.user?.username || "user";
}
function getCommentAvatar(c) {
  return (
    c.author?.avatar ||
    c.author?.profile_picture ||
    c.author?.image ||
    c.user?.avatar ||
    c.user?.profile_picture ||
    null
  );
}
function getCommentBody(c) {
  return c.body || c.text || c.content || "";
}
function getCommentTime(c) {
  const raw = c.created_at || c.time || "";
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString(); } catch { return raw; }
}

// ── YANGI: media (post/video/saved) elementidan preview rasm manzilini olish ──
// Har xil endpointlar har xil field nomi bilan qaytarishi mumkin
// (picture, image, thumbnail, cover va h.k.), shuning uchun barchasini tekshiramiz.
function getMediaThumb(item) {
  return (
    item.thumbnail ||
    item.cover ||
    item.picture ||
    item.image ||
    item.preview ||
    item.src ||
    ""
  );
}

// ── YANGI: berilgan element video ekanligini aniqlaymiz ──
// Bu funksiya orqali grid ichida video ustiga "play" belgisini chiqaramiz,
// shuningdek saqlanganlar (saved) tabida post/video farqini bilib olamiz.
function isVideoItem(item, fallbackType) {
  if (item?.type) return item.type === "video";
  if (item?.media_type) return item.media_type === "video";
  if (item?.video || item?.video_url || item?.video_file) return true;
  return fallbackType === "video";
}

// ── YANGI: video elementining o'zi (video fayl manzili) ──
function getVideoSrc(item) {
  return item.video || item.video_url || item.video_file || item.src || "";
}

// ════════════════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════════════════

const IconHeart = ({ size = 20, filled = false, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);
const IconComment = ({ size = 20, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const IconClose = ({ size = 18, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconSettings = ({ size = 16, color = "#24292f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
const IconGrid = ({ size = 20, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="7" height="7" /><Rect x="14" y="3" width="7" height="7" />
    <Rect x="3" y="14" width="7" height="7" /><Rect x="14" y="14" width="7" height="7" />
  </Svg>
);
const IconVideo = ({ size = 20, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);

// ── YANGI: saqlanganlar (bookmark) tabi uchun icon — eski IconTagged o'rniga ──
const IconSaved = ({ size = 20, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

// ── YANGI: grid ichida video elementlar ustiga chiqadigan kichik "play" belgisi ──
const IconPlayBadge = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Polygon points="5 3 19 12 5 21 5 3" />
  </Svg>
);

// ── YANGI: "to'liq ekran" (fullscreen) tugmasi uchun kvadrat/turtburchak belgisi ──
// To'rt burchakdan iborat "expand" icon — bosilganda video native fullscreen'da ochiladi.
const IconFullscreen = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="8 3 3 3 3 8" />
    <Polyline points="16 3 21 3 21 8" />
    <Polyline points="3 16 3 21 8 21" />
    <Polyline points="21 16 21 21 16 21" />
  </Svg>
);

const IconImagePlaceholder = ({ size = 24, color = "#d0d7de" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" /><Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconHome = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);
const IconLogoGlobe = ({ size = 26, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </Svg>
);
const IconCreate = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Line x1="12" y1="8" x2="12" y2="16" /><Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);
const IconMovie = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconPerson = ({ size = 22, color = "#0969da" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ════════════════════════════════════════════════════════════════════════════

function Avatar({ src, name, size = 36, index = 0 }) {
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

// ════════════════════════════════════════════════════════════════════════════
//  SKELETON
// ════════════════════════════════════════════════════════════════════════════

function Skeleton({ w, h = 14, r = 6 }) {
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: "#e9ecef" }} />;
}

function ProfileSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#e9ecef" }} />
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ alignItems: "center", gap: 6 }}>
              <Skeleton w={40} h={18} /><Skeleton w={56} h={12} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 8, marginBottom: 20 }}>
        <Skeleton w={140} h={16} /><Skeleton w={200} h={13} />
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        <View style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: "#e9ecef" }} />
        <View style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: "#e9ecef" }} />
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  POST MODAL
// ════════════════════════════════════════════════════════════════════════════
// Eslatma: bu modal hozircha faqat rasm(preview)ni ko'rsatadi.
// Video elementi ochilsa ham hozircha thumbnail chiqadi — video pleyer
// (masalan expo-av "Video" komponenti) keyinroq shu joyga ulanadi.
function PostModal({ post, username, userAvatar, visible, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const listRef = useRef(null);
  const [visibleImage, setVisibleImage] = useState(false);

  useEffect(() => {
    if (!post) return;
    setLiked(post.is_liked ?? false);
    setLikeCount(post.likes_count ?? post.likes ?? 0);

    let cancelled = false;
    setCommentsLoading(true);
    (async () => {
      const token = await AsyncStorage.getItem("token");
      API.get(`/comments/comments/?post=${post.id}`, {
        headers: { Authorization: `Bearer ${token?.trim()}` },
      })
        .then((res) => {
          if (!cancelled) {
            const data = Array.isArray(res.data)
              ? res.data
              : res.data?.results || res.data?.comments || [];
            setComments(data);
          }
        })
        .catch((err) => {
          console.log("Comments load error:", err);
          if (!cancelled) setComments([]);
        })
        .finally(() => { if (!cancelled) setCommentsLoading(false); });
    })();
    return () => { cancelled = true; };
  }, [post?.id]);

  if (!post) return null;

  const submit = async () => {
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");
      const res = await API.post(
        `/comments/comments/`,
        { post_id: post.id, text: t, user: userId },
        { headers: { Authorization: `Bearer ${token?.trim()}` } }
      );
      if (res.status === 200 || res.status === 201) {
        const newC = res.data?.id ? res.data : {
          id: Date.now(), text: t, body: t,
          author: { username, avatar: userAvatar },
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [...prev, newC]);
        setText("");
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.log("Comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    const wasCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount(post.likes_count || post.likes || wasCount + (wasLiked ? -1 : 1));

    try {

      const token = await AsyncStorage.getItem("token");
      const res = await API.post(`/posts/post/${post.id}/like/`, {}, { headers: { Authorization: `Bearer ${token?.trim()}` } });
      
      if (res.data?.likes_count !== undefined) setLikeCount(res.data.likes_count);
      if (res.data?.is_liked !== undefined) setLiked(res.data.is_liked);

    } catch (err) {
      console.log("Like error:", err);
      setLiked(wasLiked);
      setLikeCount(wasCount);
    } finally {
      setLikeLoading(false);
    }
  };

  // Endi rasm manzilini olishda ham video elementlarning thumbnail'ini
  // qamrab oladigan umumiy getMediaThumb() dan foydalanamiz.
  const imgSrc = getMediaThumb(post);
  const caption = post.caption || post.description || "";
  const isVideo = isVideoItem(post);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalCard}
          behavior={Platform.OS === "ios" ? "padding" : 0}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Avatar src={userAvatar} name={username} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.modalUsername}>@{username}</Text>
              <Text style={styles.modalTime}>
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <IconClose />
            </TouchableOpacity>
          </View>

          {/* Rasm / Video preview (video bo'lsa ustiga play belgisi chiqadi) */}
          <View>
            <TouchableOpacity onPress={() => setVisibleImage(true)} activeOpacity={0.8}>
              <Image source={{ uri: imgSrc }} style={styles.modalImage} resizeMode="cover" />
              {isVideo && (
                <View style={styles.modalPlayOverlay}>
                  <IconPlayBadge size={40} />
                </View>
              )}
            </TouchableOpacity>
            {/* <ImageViewing
                images={[{ uri: imgSrc }]}
                imageIndex={0}
                visible={visibleImage}
                onRequestClose={() => setVisibleImage(false)}
              /> */}
          </View>

          {/* Caption */}
          {caption ? (
            <View style={styles.modalCaptionWrap}>
              <Text style={styles.modalCaptionText}>
                <Text style={{ fontWeight: "700" }}>@{username}</Text> {caption}
              </Text>
            </View>
          ) : null}

          {/* Comments */}
          <FlatList
            ref={listRef}
            data={commentsLoading ? [] : comments}
            keyExtractor={(c, i) => String(c.id || i)}
            style={styles.commentsList}
            contentContainerStyle={{ padding: 14, gap: 12 }}
            ListEmptyComponent={
              commentsLoading ? (
                <ActivityIndicator color="#0969da" />
              ) : (
                <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
              )
            }
            renderItem={({ item: c, index: i }) => (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Avatar
                  src={getCommentAvatar(c)}
                  name={getCommentAuthor(c)}
                  size={28}
                  index={i % AVATAR_COLORS.length}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentText}>
                    <Text style={{ fontWeight: "700", color: "#24292f" }}>@{getCommentAuthor(c)}</Text>
                    {" "}{getCommentBody(c)}
                  </Text>
                  <Text style={styles.commentTime}>{getCommentTime(c)}</Text>
                </View>
              </View>
            )}
          />

          {/* Like + comment count */}
          <View style={styles.modalActionsRow}>
            <TouchableOpacity onPress={toggleLike} disabled={likeLoading} style={styles.actionBtn}>
              <IconHeart filled={liked} color={liked ? "#cf222e" : "#57606a"} />
              <Text style={[styles.actionCount, liked && { color: "#cf222e" }]}>{fmtNum(likeCount)}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <IconComment />
              <Text style={styles.actionCount}>{commentsLoading ? "…" : comments.length}</Text>
            </View>
          </View>

          {/* Comment input */}
          <View style={styles.commentInputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              placeholderTextColor="#8c959f"
              editable={!submitting}
              style={styles.commentInput}
              onSubmitEditing={submit}
            />
            <TouchableOpacity
              onPress={submit}
              disabled={!text.trim() || submitting}
              style={[
                styles.postBtn,
                { backgroundColor: text.trim() && !submitting ? "#0969da" : "#d0d7de" },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PROFILE SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  // ── YANGI: video va saqlanganlar uchun alohida loading holatlari ──
  const [videosLoading, setVideosLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("grid");
  const [openPost, setOpenPost] = useState(null);

  // ── YANGI: grid ichida hozir qaysi video ijro etilayotganini saqlaymiz ──
  // Bir vaqtning o'zida faqat bitta video ijro etiladi (id bo'yicha).
  const [playingId, setPlayingId] = useState(null);

  // ── YANGI: har bir <Video> komponentiga ref — fullscreen ochish uchun kerak ──
  // videoRefs.current = { [item.id]: VideoInstance }
  const videoRefs = useRef({});

  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [full_name, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [followers_count, setFollowers] = useState(0);
  const [following_count, setFollowing] = useState(0);
  const [posts_count, setPostsCount] = useState(0);

  const [myPosts, setMyPosts] = useState([]);

  // ── YANGI: userning o'z videolari ──
  const [myVideos, setMyVideos] = useState([]);

  // ── YANGI: saqlangan postlar/videolar (saved) ──
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    apiPerson();
    fetchMyPosts();
    fetchMyVideos();   // YANGI: sahifa ochilganda videolarni ham yuklaymiz
    fetchSavedItems();  // YANGI: sahifa ochilganda saqlanganlarni ham yuklaymiz
  }, []);

  const apiPerson = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("user_id");
      if (!token || !id) return;
      const res = await API.get(`/users/register/${id}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.status === 200) {
        const d = res.data;
        setAvatar(d.avatar || d.profile_picture || d.image || d.photo || "");
        setUsername(d.username || "");
        setFullName(d.full_name || "");
        setBio(d.bio || "");
        setWebsite(d.website || "");
        setFollowers(d.followers_count ?? 0);
        setFollowing(d.following_count ?? 0);
        setPostsCount(d.posts_count ?? 0);
      }
    } catch (err) {
      console.log("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPosts = async () => {
    setPostsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("user_id");
      if (!token || !id) return;
      const res = await API.get(`/posts/my-posts/${id}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.status === 200) {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const mine = data.filter((p) => String(p.author?.id ?? p.user_id ?? p.author) === String(id));
        setMyPosts(mine.length > 0 ? mine : data);
      }
    } catch (err) {
      console.log("Posts load error:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  //  YANGI: Userning o'z videolarini olib keladigan funksiya
  //  Endpoint: /videos/user-videos/{username}/
  //  Bu funksiya rasm (post) endpointidan farqli — faqat video kontentni
  //  qaytaradigan alohida backend endpointiga so'rov yuboradi.
  // ══════════════════════════════════════════════════════════════════════
  const fetchMyVideos = async () => {
    setVideosLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("user_id");
      const username = await AsyncStorage.getItem("login_username");
      console.log("Fetching videos for user:", username, "id:", id);
      if (!token || !id) return;
      // Video uchun alohida endpoint: /videos/user-videos/{username}/
      const res = await API.get(`/videos/user-videos/${username}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.status === 200) {
        // Backend ba'zan array, ba'zan {results: [...]} qaytarishi mumkin —
        // shu sabab ikkisini ham tekshiramiz.
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setMyVideos(data);
      }
    } catch (err) {
      console.log("Videos load error:", err);
      setMyVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  //  YANGI: Saqlangan postlar va videolarni olib keladigan funksiya
  //  Endpoint: /save/my-save{user.id}/
  //  Bu yerda saqlangan element post ham, video ham bo'lishi mumkin —
  //  shuning uchun renderda isVideoItem() orqali turini aniqlab,
  //  video bo'lsa play belgisi bilan ko'rsatamiz.
  // ══════════════════════════════════════════════════════════════════════
  const fetchSavedItems = async () => {
    setSavedLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("user_id");
      if (!token || !id) return;
      // Saqlanganlar uchun alohida endpoint: /save/my-save{id}/
      const res = await API.get(`/save/my-save${id}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.status === 200) {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        // Ba'zi backendlarda saqlangan element { post: {...} } yoki
        // { video: {...} } ko'rinishida "wrap" qilingan bo'ladi.
        // Shunday holatlarni ham to'g'ri ko'rsatish uchun "unwrap" qilamiz.
        const normalized = data.map((entry) => entry.post || entry.video || entry);
        setSavedItems(normalized);
      }
    } catch (err) {
      console.log("Saved items load error:", err);
      setSavedItems([]);
    } finally {
      setSavedLoading(false);
    }
  };

  const navItems = [
    { href: "/pages/home", active: false, Icon: IconHome },
    { href: "/pages/message", active: false, Icon: IconLogoGlobe },
    { href: "/pages/createPost", active: false, Icon: IconCreate, isCenter: true },
    { href: "/pages/reals", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: true, Icon: IconPerson },
  ];

  // ── O'ZGARDI: "tagged" tabi "saved" (saqlanganlar) tabiga almashtirildi ──
  const tabs = [
    { key: "grid", Icon: IconGrid },
    { key: "video", Icon: IconVideo },
    { key: "saved", Icon: IconSaved },
  ];

  const EmptyState = (text, withButton = false) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <IconImagePlaceholder />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
      {withButton ? (
        <TouchableOpacity
          onPress={() => router.push("/pages/createPost")}
          style={styles.createFirstPostBtn}
        >
          <Text style={styles.createFirstPostBtnText}>Create your first post</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const ListHeader = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {loading ? "" : full_name}
        </Text>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsBtn}>
          <IconSettings />
        </TouchableOpacity>
      </View>

      {/* Profile info */}
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 16 }}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarRingInner}>
                <Avatar src={avatar} name={full_name || username} size={74} />
              </View>
            </View>
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
              {[
                { label: "Posts", value: fmtNum(myPosts.length || posts_count) },
                { label: "Followers", value: fmtNum(followers_count) },
                { label: "Following", value: fmtNum(following_count) },
              ].map((s, i) => (
                <View key={i} style={{ alignItems: "center" }}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={styles.fullNameText}>{full_name}</Text>
            <Text style={styles.usernameText}>@{username}</Text>
            {website ? (
              <TouchableOpacity onPress={() => Linking.openURL(website)}>
                <Text style={styles.websiteText}>{website}</Text>
              </TouchableOpacity>
            ) : null}
            {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => router.push("/edit-profile")}
              style={styles.editProfileBtn}
            >
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/post-views")}
              style={styles.editPostsBtn}
            >
              <Text style={styles.editPostsBtnText}>Edit Posts</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
          >
            <tab.Icon color={activeTab === tab.key ? "#667eea" : "#8c959f"} />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════
  //  O'ZGARDI: activeTab ga qarab qaysi ma'lumot va qaysi loading
  //  ko'rsatilishini shu yerda hal qilamiz (grid -> posts, video -> myVideos,
  //  saved -> savedItems).
  // ══════════════════════════════════════════════════════════════════════
  const gridData =
    activeTab === "grid" ? myPosts :
    activeTab === "video" ? myVideos :
    activeTab === "saved" ? savedItems : [];

  const currentLoading =
    activeTab === "grid" ? postsLoading :
    activeTab === "video" ? videosLoading :
    activeTab === "saved" ? savedLoading : false;

  const emptyText =
    activeTab === "video" ? "No videos yet" :
    activeTab === "saved" ? "No saved posts yet" :
    "No posts yet";

  return (
    <SafeAreaView style={styles.screen}>
      <PostModal
        post={openPost}
        username={username}
        userAvatar={avatar}
        visible={!!openPost}
        onClose={() => setOpenPost(null)}
      />

      {currentLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {ListHeader}
          <View style={styles.gridSkeletonWrap}>
            {Array(6).fill(0).map((_, i) => (
              <View key={i} style={styles.gridSkeletonItem} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          // ── O'ZGARDI: bitta FlatList barcha 3 tab (grid/video/saved) uchun ishlatiladi ──
          data={gridData}
          keyExtractor={(item, i) => String(item.id || i)}
          numColumns={3}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState(emptyText, activeTab === "grid")}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => {
            // Har bir element uchun preview manzili va video ekanligini aniqlaymiz.
            // "video" tabidagi hamma narsa video hisoblanadi, "saved" tabida esa
            // har bir elementning o'zi post yoki video bo'lishi mumkin.


            // const thumb = getMediaThumb(item);
            // const isVideo = isVideoItem(item, activeTab === "video" ? "video" : undefined);


            const imgSrc = item.picture || item.image || "";
            const videoSrc = item.video || item.video_url || "";
            const isVideo = !!videoSrc;

            // ── YANGI: video uchun poster (preview) rasm — video ijro etilmagan
            // paytda ham ekranda videoning o'zining rasmi (thumbnail/cover/picture)
            // ko'rinib tursin, qora ekran chiqmasin.
            const posterSrc = item.thumbnail || item.cover || item.picture || item.image || "";

            // Hozir aynan shu video ijro etilayotganmi — playingId bilan solishtiramiz
            const isPlaying = isVideo && playingId === item.id;

            if (isVideo) {
              return (
                <TouchableOpacity
                  // ── YANGI: video ustiga bosilganda — ijro etilayotgan bo'lsa
                  // to'xtatamiz, to'xtagan bo'lsa ijro etamiz (grid katakchasining
                  // o'zida, kichik holatda, "hozirgidek" — modal ochilmaydi).
                  onPress={() => setPlayingId(isPlaying ? null : item.id)}
                  style={styles.gridItem}
                  activeOpacity={0.9}
                >
                  <Video
                    // ── YANGI: ref orqali ushbu videoni saqlab olamiz —
                    // fullscreen tugmasi bosilganda shu ref orqali
                    // presentFullscreenPlayer() chaqiramiz.
                    ref={(ref) => { videoRefs.current[item.id] = ref; }}
                    source={{ uri: videoSrc }}
                    style={styles.gridImage}
                    resizeMode="cover"
                    // ── O'ZGARDI: shouldPlay endi doim false emas — playingId
                    // holatiga bog'liq, shu sabab video HAQIQATDA ijro bo'ladi.
                    shouldPlay={isPlaying}
                    isMuted={false}
                    isLooping
                    // ── YANGI: video hali ijro etilmasa ham, videoning o'z
                    // rasmi (poster/thumbnail) ko'rinib tursin.
                    usePoster
                    posterSource={posterSrc ? { uri: posterSrc } : undefined}
                    posterStyle={styles.gridImage}
                  />

                  {/* Video ijro etilmayotganda markazda kichik "play" belgisi chiqadi */}
                  {!isPlaying && (
                    <View style={styles.videoPlayOverlay}>
                      <IconPlayBadge size={16} />
                    </View>
                  )}

                  {/* ── YANGI: to'liq ekran (fullscreen) tugmasi — o'ng-pastda kvadrat belgi.
                      Bosilganda telefonning native to'liq ekran video pleyerini ochadi. */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      videoRefs.current[item.id]?.presentFullscreenPlayer();
                    }}
                    style={styles.fullscreenBtn}
                    activeOpacity={0.8}
                  >
                    <IconFullscreen size={12} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                onPress={() => setOpenPost(item)}
                style={styles.gridItem}
                activeOpacity={0.85}
              >
                {imgSrc ? (
                  <Image
                    source={{ uri: imgSrc }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.gridPlaceholder}>
                    <IconImagePlaceholder />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {navItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => router.push(item.href)}
            style={[styles.navItem, item.active && styles.navItemActive]}
          >
            <item.Icon color={item.active ? "#0969da" : "#57606a"} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f8fa" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#24292f", flex: 1, textAlign: "center" },
  settingsBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1, borderColor: "#d0d7de", backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },

  // Avatar ring
  avatarRing: {
    width: 84, height: 84, borderRadius: 42, padding: 2,
    backgroundColor: "#e53935",
  },
  avatarRingInner: {
    width: "100%", height: "100%", borderRadius: 40, padding: 2,
    backgroundColor: "#f6f8fa", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },

  // Stats
  statValue: { fontSize: 18, fontWeight: "700", color: "#24292f" },
  statLabel: { fontSize: 12, color: "#57606a", marginTop: 3 },

  // Bio
  fullNameText: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  usernameText: { fontSize: 13, color: "#57606a", marginTop: 3 },
  websiteText: { fontSize: 13, color: "#0969da", marginTop: 3 },
  bioText: { fontSize: 13, color: "#24292f", marginTop: 8, lineHeight: 19 },

  // Buttons
  editProfileBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center",
    backgroundColor: "#0969da", borderWidth: 1, borderColor: "#0969da",
  },
  editProfileBtnText: { fontWeight: "600", fontSize: 13, color: "#fff" },
  editPostsBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center",
    backgroundColor: "#f6f8fa", borderWidth: 1, borderColor: "#d0d7de",
  },
  editPostsBtnText: { fontWeight: "600", fontSize: 13, color: "#24292f" },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    borderTopWidth: 1, borderTopColor: "#d0d7de",
    borderBottomWidth: 1, borderBottomColor: "#d0d7de",
    backgroundColor: "#fff",
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#0969da" },

  // Grid
  gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, margin: GRID_GAP / 2, backgroundColor: "#f0f2f4" },
  gridImage: { width: "100%", height: "100%" },
  gridPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  gridSkeletonWrap: { flexDirection: "row", flexWrap: "wrap", padding: 2 },
  gridSkeletonItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, margin: GRID_GAP / 2, backgroundColor: "#e9ecef" },

  // Grid ichidagi video elementlar uchun kichik "play" belgisi (o'rtada)
  videoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── YANGI: video ijro etilmaganda o'rtada chiqadigan play belgisi ──
  videoPlayOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── YANGI: o'ng-pastdagi kichik fullscreen (kvadrat) tugma ──
  fullscreenBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: "#d0d7de",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#8c959f" },
  createFirstPostBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: "#0969da",
  },
  createFirstPostBtnText: { fontSize: 13, fontWeight: "600", color: "#0969da" },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 56,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  navItem: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navItemActive: { backgroundColor: "#dbeafe" },

  // ── MODAL ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(36,41,47,0.65)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    height: "98%", overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 14,
    borderBottomWidth: 1, borderBottomColor: "#d0d7de",
  },
  modalUsername: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  modalTime: { fontSize: 11, color: "#57606a" },
  modalImage: { width: "100%", height: 460, backgroundColor: "#0d1117" },

  // ── YANGI: modal ichida video preview ustiga chiqadigan play belgisi ──
  modalPlayOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, height: 260,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  modalCaptionWrap: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#d0d7de" },
  modalCaptionText: { fontSize: 13, color: "#24292f", lineHeight: 19 },
  commentsList: { flex: 1 },
  emptyCommentsText: { color: "#8c959f", fontSize: 13, textAlign: "center", marginTop: 24 },
  commentText: { fontSize: 13, color: "#24292f" },
  commentTime: { fontSize: 11, color: "#8c959f", marginTop: 2 },
  modalActionsRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "#d0d7de",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600", color: "#57606a" },
  commentInputRow: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 10, paddingHorizontal: 14,
    borderTopWidth: 1, borderTopColor: "#d0d7de",
  },
  commentInput: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1,
    borderColor: "#d0d7de", borderRadius: 8, fontSize: 13,
    backgroundColor: "#f6f8fa", color: "#24292f",
  },
  postBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    minWidth: 52, alignItems: "center", justifyContent: "center",
  },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});