import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildRoomName } from "./message";
import API from "../api/server";
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
  Clipboard,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_W - GRID_GAP * 2) / 3;
const VIDEO_GAP = 3;
const VIDEO_ITEM_W = (SCREEN_W - VIDEO_GAP * 3) / 2;

// ════════════════════════════════════════════════════════════════════════════
//  API HELPERS
// ════════════════════════════════════════════════════════════════════════════

async function getToken() { return await AsyncStorage.getItem("token"); }
async function getMyId() { return await AsyncStorage.getItem("user_id"); }
async function auth() {
  const token = await getToken();
  return { Authorization: `Bearer ${token?.trim()}` };
}

async function fetchUserByUsername(username) {
  const headers = await auth();
  const res = await API.get(`/users/user-view/by_username/?username=${encodeURIComponent(username)}`, { headers });
  await AsyncStorage.setItem("username_account", res.data.username);
  await AsyncStorage.setItem("id_account", String(res.data.id));
  const d = res.data;
  if (Array.isArray(d) && d.length > 0) return d[0];
  if (d?.results?.length > 0) return d.results[0];
  if (d?.id || d?.username) return d;
  return null;
}

async function fetchUserPosts(username) {
  const headers = await auth();
  const res = await API.get(`/posts/profile/?username=${encodeURIComponent(username)}`, { headers });
  const d = res.data;
  return d?.posts && Array.isArray(d.posts) ? d.posts : Array.isArray(d) ? d : d?.results || d?.data || [];
}

async function toggleFollowAPI() {
  const username = await AsyncStorage.getItem("username_account");
  const headers = await auth();
  const res = await API.post(`/follows/follows/toggle/`, { username }, { headers });
  return res.data;
}

async function fetchComments(postId) {
  const headers = await auth();
  const res = await API.get(`/comments/comments/?post=${postId}`, { headers });
  const d = res.data;
  return Array.isArray(d) ? d : d?.results || d?.comments || [];
}

async function submitComment(postId, text) {
  const myId = await getMyId();
  const headers = await auth();
  const res = await API.post(`/comments/comments/`, { post: postId, text, user: myId }, { headers });
  return res.data;
}

async function toggleLikeAPI(postId) {
  const headers = await auth();
  const res = await API.post(`/posts/post/${postId}/like/`, {}, { headers });
  return res.data;
}

function fmtNum(n) {
  if (!n && n !== 0) return "0";
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

const COLORS = [
  ["#667eea", "#764ba2"], ["#10b981", "#059669"], ["#f59e0b", "#d97706"],
  ["#ef4444", "#dc2626"], ["#6366f1", "#4f46e5"], ["#ec4899", "#db2777"],
];

function isVideo(post) {
  const v = post.video || post.video_file || post.media || "";
  if (v) return true;
  const pic = post.picture || post.img || post.image || "";
  if (pic) {
    const ext = pic.split("?")[0].split(".").pop().toLowerCase();
    return ["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext);
  }
  return false;
}
function isImage(post) {
  const v = post.video || post.video_file || "";
  if (v) return false;
  const pic = post.picture || post.img || post.image || "";
  if (!pic) return false;
  const ext = pic.split("?")[0].split(".").pop().toLowerCase();
  return !["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext);
}

// ════════════════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════════════════

const IconHeart = ({ size = 21, filled, color = "#6b7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);
const IconComment = ({ size = 21, color = "#6b7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const IconClose = ({ size = 17, color = "#9aa0ab" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconPlay = ({ size = 20, color = "#0d0f14" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Polygon points="5 3 19 12 5 21 5 3" />
  </Svg>
);
const IconVideoTag = ({ size = 32, color = "#555" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconBack = ({ size = 18, color = "#6366f1" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);
const IconMoreHoriz = ({ size = 19, color = "#9aa0ab" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="5" cy="12" r="2.2" /><Circle cx="12" cy="12" r="2.2" /><Circle cx="19" cy="12" r="2.2" />
  </Svg>
);
const IconCheck = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IconPlus = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
const IconEdit = ({ size = 14, color = "#0d0f14" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const IconPerson = ({ size = 14, color = "#0d0f14" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);
const IconLink = ({ size = 12, color = "#6366f1" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
);
const IconLock = ({ size = 18, color = "#9aa0ab" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="11" width="18" height="11" rx="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);
const IconImagePlaceholder = ({ size = 22, color = "#c8cdd6" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconAlert = ({ size = 26, color = "#e53935" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="10" /><Line x1="12" y1="8" x2="12" y2="12" /><Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);
const IconRowsTab = ({ size = 16, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Line x1="8" y1="6" x2="21" y2="6" /><Line x1="8" y1="12" x2="21" y2="12" /><Line x1="8" y1="18" x2="21" y2="18" />
    <Line x1="3" y1="6" x2="3.01" y2="6" /><Line x1="3" y1="12" x2="3.01" y2="12" /><Line x1="3" y1="18" x2="3.01" y2="18" />
  </Svg>
);
const IconPhotoTab = ({ size = 16, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconVideoTab = ({ size = 16, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconGridTab = ({ size = 16, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="7" height="7" /><Rect x="14" y="3" width="7" height="7" />
    <Rect x="3" y="14" width="7" height="7" /><Rect x="14" y="14" width="7" height="7" />
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
    <Rect x="3" y="3" width="18" height="18" rx="2" /><Line x1="12" y1="8" x2="12" y2="16" /><Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);
const IconMovie = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconPersonNav = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ════════════════════════════════════════════════════════════════════════════

function Avatar({ src, name, size = 40, idx = 0 }) {
  const [err, setErr] = useState(false);
  const [a, b] = COLORS[idx % COLORS.length];
  if (src && !err) {
    return (
      <Image
        source={{ uri: src }}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: a, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: Math.max(size / 2.8, 10), fontWeight: "700", color: "#fff" }}>{getInitials(name || "")}</Text>
    </View>
  );
}

function Sk({ w, h = 11, r = 5 }) {
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: "#eceef1" }} />;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHARED: COMMENTS PANEL (used inside both post & video modal)
// ════════════════════════════════════════════════════════════════════════════

function useCommentsAndLike(post, onLikeChange) {
  const [comments, setComments] = useState([]);
  const [cLoading, setCLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(post?.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes_count ?? post?.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    setCLoading(true);
    fetchComments(post.id)
      .then((d) => { if (!cancelled) setComments(d); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setCLoading(false); });
    return () => { cancelled = true; };
  }, [post?.id]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending || !post) return;
    setSending(true);
    try {
      const username = await AsyncStorage.getItem("username");
      const newC = await submitComment(post.id, t);
      setComments((p) => [
        ...p,
        newC?.id ? newC : { id: Date.now(), text: t, body: t, author: { username: username || "you" }, created_at: new Date().toISOString() },
      ]);
      setText("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.log(e);
    } finally {
      setSending(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading || !post) return;
    setLikeLoading(true);
    const was = liked, wasC = likeCount;
    const nextLiked = !was, nextCount = was ? wasC - 1 : wasC + 1;
    setLiked(nextLiked); setLikeCount(nextCount);
    onLikeChange?.(post.id, nextLiked, nextCount);
    try {
      const res = await toggleLikeAPI(post.id);
      if (res?.is_liked !== undefined && res.is_liked !== nextLiked) setLiked(res.is_liked);
      if (res?.likes_count !== undefined && res.likes_count !== nextCount) {
        setLikeCount(res.likes_count);
        onLikeChange?.(post.id, res.is_liked, res.likes_count);
      }
    } catch {
      setLiked(was); setLikeCount(wasC); onLikeChange?.(post.id, was, wasC);
    } finally {
      setLikeLoading(false);
    }
  };

  return { comments, cLoading, text, setText, sending, send, liked, likeCount, likeLoading, handleLike, listRef };
}

function CommentRow({ c, idx }) {
  const author = c.author?.username || c.author?.full_name || c.username || "user";
  const body = c.body || c.text || c.content || "";
  const time = (() => { try { return new Date(c.created_at || "").toLocaleDateString(); } catch { return ""; } })();
  const av = c.author?.avatar || c.author?.profile_picture || c.user?.avatar || null;
  return (
    <View style={{ flexDirection: "row", gap: 9 }}>
      <Avatar src={av} name={author} size={28} idx={idx % COLORS.length} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: "#3a3e4a", lineHeight: 19 }}>
          <Text style={{ fontWeight: "700", color: "#0d0f14" }}>@{author}</Text> {body}
        </Text>
        <Text style={{ fontSize: 11, color: "#9aa0ab", marginTop: 3 }}>{time}</Text>
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  POST MODAL (image)
// ════════════════════════════════════════════════════════════════════════════

function PostModal({ post, userAvatar, userName, visible, onClose, onLikeChange }) {
  const { comments, cLoading, text, setText, sending, send, liked, likeCount, likeLoading, handleLike, listRef } =
    useCommentsAndLike(post, onLikeChange);

  if (!post) return null;

  const imgSrc = post.picture || post.img || post.image || "";
  const postUser = post.author?.username || post.author?.user || userName || "user";
  const postAv = post.author?.avatar || post.author?.profile_picture || userAvatar || null;
  const caption = post.caption || post.description || "";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.fullModalOverlay}>
        <KeyboardAvoidingView style={styles.fullModalCard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.fullModalImageWrap}>
            {imgSrc ? <Image source={{ uri: imgSrc }} style={styles.fullModalImage} resizeMode="contain" /> : <Text style={{ color: "#555" }}>Rasm yo'q</Text>}
          </View>

          <View style={styles.fullModalRightPanel}>
            <View style={styles.fullModalHeader}>
              <Avatar src={postAv} name={postUser} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fullModalUsername}>@{postUser}</Text>
                <Text style={styles.fullModalTime}>
                  {post.created_at ? new Date(post.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <IconClose />
              </TouchableOpacity>
            </View>

            {caption ? (
              <View style={styles.fullModalCaptionWrap}>
                <Text style={styles.fullModalCaptionText}>
                  <Text style={{ fontWeight: "700" }}>@{postUser}</Text> {caption}
                </Text>
              </View>
            ) : null}

            <FlatList
              ref={listRef}
              data={cLoading ? [] : comments}
              keyExtractor={(c, i) => String(c.id ?? i)}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              ListEmptyComponent={
                cLoading ? <ActivityIndicator color="#6366f1" /> : <Text style={styles.emptyCommentsText}>Comment not found</Text>
              }
              renderItem={({ item: c, index: i }) => <CommentRow c={c} idx={i} />}
            />

            <View style={styles.fullModalActionsRow}>
              <TouchableOpacity onPress={handleLike} disabled={likeLoading} style={styles.actionBtn}>
                <IconHeart filled={liked} color={liked ? "#e53935" : "#6b7280"} />
                <Text style={[styles.actionCount, liked && { color: "#e53935" }]}>{fmtNum(likeCount)}</Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <IconComment />
                <Text style={styles.actionCount}>{cLoading ? "—" : comments.length}</Text>
              </View>
            </View>

            <View style={styles.fullModalInputRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Comment yozing…"
                placeholderTextColor="#9aa0ab"
                editable={!sending}
                style={styles.fullModalInput}
                onSubmitEditing={send}
              />
              <TouchableOpacity
                onPress={send}
                disabled={!text.trim() || sending}
                style={[styles.fullModalSendBtn, { backgroundColor: text.trim() && !sending ? "#6366f1" : "#eceef1" }]}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.fullModalSendText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VIDEO MODAL
// ════════════════════════════════════════════════════════════════════════════

function VideoModal({ post, userAvatar, userName, visible, onClose, onLikeChange }) {
  const { comments, cLoading, text, setText, sending, send, liked, likeCount, likeLoading, handleLike, listRef } =
    useCommentsAndLike(post, onLikeChange);

  if (!post) return null;

  const videoSrc = post.video || post.video_file || post.media || "";
  const postUser = post.author?.username || post.author?.user || userName || "user";
  const postAv = post.author?.avatar || post.author?.profile_picture || userAvatar || null;
  const caption = post.caption || post.description || "";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.fullModalOverlay, { backgroundColor: "rgba(5,5,15,0.92)" }]}>
        <KeyboardAvoidingView style={[styles.fullModalCard, { backgroundColor: "#0d0f14" }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.fullModalImageWrap, { backgroundColor: "#000", position: "relative" }]}>
            {videoSrc ? (
              <Video
                source={{ uri: videoSrc }}
                style={{ width: "100%", height: "100%" }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            ) : (
              <View style={{ alignItems: "center", gap: 10 }}>
                <IconVideoTag />
                <Text style={{ color: "#555", fontSize: 13 }}>Video yo'q</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.videoCloseBtn}>
              <IconClose size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullModalRightPanel}>
            <View style={styles.fullModalHeader}>
              <Avatar src={postAv} name={postUser} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fullModalUsername}>@{postUser}</Text>
                <Text style={styles.fullModalTime}>
                  {post.created_at ? new Date(post.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <IconClose />
              </TouchableOpacity>
            </View>

            {caption ? (
              <View style={styles.fullModalCaptionWrap}>
                <Text style={styles.fullModalCaptionText}>
                  <Text style={{ fontWeight: "700" }}>@{postUser}</Text> {caption}
                </Text>
              </View>
            ) : null}

            <FlatList
              ref={listRef}
              data={cLoading ? [] : comments}
              keyExtractor={(c, i) => String(c.id ?? i)}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              ListEmptyComponent={
                cLoading ? <ActivityIndicator color="#6366f1" /> : <Text style={styles.emptyCommentsText}>Comment not found</Text>
              }
              renderItem={({ item: c, index: i }) => <CommentRow c={c} idx={i} />}
            />

            <View style={styles.fullModalActionsRow}>
              <TouchableOpacity onPress={handleLike} disabled={likeLoading} style={styles.actionBtn}>
                <IconHeart filled={liked} color={liked ? "#e53935" : "#6b7280"} />
                <Text style={[styles.actionCount, liked && { color: "#e53935" }]}>{fmtNum(likeCount)}</Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <IconComment />
                <Text style={styles.actionCount}>{cLoading ? "—" : comments.length}</Text>
              </View>
            </View>

            <View style={styles.fullModalInputRow}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Comment yozing…"
                placeholderTextColor="#9aa0ab"
                editable={!sending}
                style={styles.fullModalInput}
                onSubmitEditing={send}
              />
              <TouchableOpacity
                onPress={send}
                disabled={!text.trim() || sending}
                style={[styles.fullModalSendBtn, { backgroundColor: text.trim() && !sending ? "#6366f1" : "#eceef1" }]}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.fullModalSendText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PEOPLE MODAL
// ════════════════════════════════════════════════════════════════════════════

function PeopleModal({ visible, title, count, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.centeredOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.smallCard} onStartShouldSetResponder={() => true}>
          <View style={styles.smallCardHeader}>
            <Text style={styles.smallCardTitle}>{title} ({fmtNum(count)})</Text>
            <TouchableOpacity onPress={onClose} style={styles.smallCardCloseBtn}>
              <IconClose size={16} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: "#9aa0ab" }}>
              All: <Text style={{ color: "#0d0f14", fontWeight: "700" }}>{fmtNum(count)}</Text> ta
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MESSAGE MODAL
// ════════════════════════════════════════════════════════════════════════════

function MessageModal({ visible, username, fullName, userAvatar, onClose }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSent(true);
    const myUsername = await getMyId();
    const roomName = buildRoomName(myUsername, username);
    const receiverId = await AsyncStorage.getItem("id_account");
    try {
      const token = await getToken();
      await API.post(
        `/messages/message/`,
        { room: roomName, sender: myUsername, receiver: receiverId, content: text.trim() },
        { headers: { Authorization: `Bearer ${token?.trim()}`, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.log("Xabar yuborilmadi:", e?.response?.data || e.message);
    }
    setTimeout(() => { onClose(); setSent(false); setText(""); }, 1500);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.centeredOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.smallCardPadded} onStartShouldSetResponder={() => true}>
          <View style={styles.msgModalHeader}>
            <Avatar src={userAvatar} name={fullName || username} size={46} />
            <View>
              <Text style={styles.msgModalUsername}>@{username}</Text>
              {fullName ? <Text style={styles.msgModalFullname}>{fullName}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.smallCardCloseBtn, { marginLeft: "auto" }]}>
              <IconClose size={16} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <View style={styles.msgSentCircle}>
                <IconCheck size={22} color="#10b981" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#0d0f14" }}>Xabar yuborildi!</Text>
            </View>
          ) : (
            <>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={`@${username} ga xabar yozing…`}
                placeholderTextColor="#9aa0ab"
                multiline
                numberOfLines={4}
                style={styles.msgModalInput}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TouchableOpacity onPress={onClose} style={styles.msgCancelBtn}>
                  <Text style={styles.msgCancelText}>Bekor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={send}
                  disabled={!text.trim()}
                  style={[styles.msgSendBtn, { backgroundColor: text.trim() ? "#6366f1" : "#eceef1" }]}
                >
                  <Text style={[styles.msgSendText, { color: text.trim() ? "#fff" : "#9aa0ab" }]}>Yuborish</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MENU MODAL (bottom sheet)
// ════════════════════════════════════════════════════════════════════════════

function MenuModal({ visible, username, isFollowing, onUnfollow, onClose }) {
  const items = [
    { label: isFollowing ? "Unfollow qilish" : "Follow", color: isFollowing ? "#e53935" : "#0d0f14", action: () => { onUnfollow(); onClose(); } },
    { label: "Profilni nusxalash", color: "#0d0f14", action: () => { Clipboard.setString(`@${username}`); onClose(); } },
    { label: "Shikoyat qilish", color: "#e53935", action: onClose },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.bottomSheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.bottomSheetCard} onStartShouldSetResponder={() => true}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetUsername}>@{username}</Text>
          </View>
          {items.map((item, i) => (
            <View key={i}>
              <TouchableOpacity onPress={item.action} style={styles.bottomSheetItem}>
                <Text style={[styles.bottomSheetItemText, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
              {i < items.length - 1 ? <View style={styles.bottomSheetDivider} /> : null}
            </View>
          ))}
          <View style={styles.bottomSheetDivider} />
          <TouchableOpacity onPress={onClose} style={styles.bottomSheetItem}>
            <Text style={[styles.bottomSheetItemText, { color: "#0d0f14" }]}>Yopish</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  FEED TAB
// ════════════════════════════════════════════════════════════════════════════

function FeedTab({ posts, userAvatar, fullName, username, privateBlocked, setOpenPost, setOpenVideo }) {
  const sorted = [...posts].reverse();

  if (privateBlocked || sorted.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 60 }}>
        <Text style={{ fontSize: 14, color: "#9aa0ab" }}>{privateBlocked ? "Yopiq hisob" : "Post yo'q"}</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 10, gap: 14 }}>
      {sorted.map((post, i) => {
        const imgSrc = post.picture || post.img || post.image || "";
        const videoSrc = post.video || post.video_file || post.media || "";
        const caption = post.caption || post.description || "";
        const author = post.author?.username || post.author?.user || username;
        const hasVideo = isVideo(post);

        return (
          <View key={post.id || i} style={styles.feedCard}>
            <View style={styles.feedCardHeader}>
              <Avatar src={userAvatar} name={fullName || username} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedCardUsername}>@{author}</Text>
                <Text style={styles.feedCardTime}>
                  {post.created_at ? new Date(post.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }) : ""}
                </Text>
              </View>
              {hasVideo ? (
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>Video</Text>
                </View>
              ) : null}
            </View>

            {hasVideo && videoSrc ? (
              <TouchableOpacity onPress={() => setOpenVideo(post)} style={styles.feedVideoWrap} activeOpacity={0.9}>
                <Video source={{ uri: videoSrc }} style={styles.feedMedia} resizeMode={ResizeMode.COVER} isMuted />
                <View style={styles.feedPlayOverlay}>
                  <View style={styles.feedPlayCircle}>
                    <IconPlay />
                  </View>
                </View>
              </TouchableOpacity>
            ) : imgSrc ? (
              <TouchableOpacity onPress={() => setOpenPost(post)} activeOpacity={0.9}>
                <Image source={{ uri: imgSrc }} style={styles.feedMedia} resizeMode="cover" />
              </TouchableOpacity>
            ) : null}

            <View style={styles.feedCardActions}>
              <TouchableOpacity onPress={() => (hasVideo ? setOpenVideo(post) : setOpenPost(post))} style={styles.feedActionBtn}>
                <IconHeart filled={post.is_liked} color={post.is_liked ? "#e53935" : "#6b7280"} />
                <Text style={styles.feedActionText}>{fmtNum(post.likes_count ?? post.likes ?? 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => (hasVideo ? setOpenVideo(post) : setOpenPost(post))} style={styles.feedActionBtn}>
                <IconComment />
                <Text style={styles.feedActionText}>{fmtNum(post.comments_count ?? 0)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.feedCardFooter}>
              <Text style={styles.feedLikesText}>{fmtNum(post.likes_count ?? post.likes ?? 0)} ta like</Text>
              {caption ? (
                <Text style={styles.feedCaptionText}>
                  <Text style={{ fontWeight: "700", color: "#0d0f14" }}>@{author}</Text> {caption}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PHOTOS TAB
// ════════════════════════════════════════════════════════════════════════════

function PhotosTab({ posts, privateBlocked, setOpenPost }) {
  const photos = posts.filter((p) => isImage(p));

  if (privateBlocked) {
    return (
      <View style={styles.tabEmptyWrap}>
        <View style={styles.tabEmptyCircle}><IconLock size={32} /></View>
        <Text style={styles.tabEmptyTitle}>Yopiq hisob</Text>
      </View>
    );
  }
  if (photos.length === 0) {
    return (
      <View style={styles.tabEmptyWrap}>
        <View style={[styles.tabEmptyCircle, { borderWidth: 2, borderColor: "#e0e2e8", backgroundColor: "transparent" }]}>
          <IconImagePlaceholder size={28} />
        </View>
        <Text style={{ fontSize: 14, color: "#b0b8c4" }}>Rasm yo'q</Text>
      </View>
    );
  }

  return (
    <View style={styles.photosGrid}>
      {photos.map((post, i) => {
        const imgSrc = post.picture || post.img || post.image || "";
        return (
          <TouchableOpacity key={post.id || i} onPress={() => setOpenPost(post)} style={styles.photoGridItem} activeOpacity={0.85}>
            {imgSrc ? (
              <Image source={{ uri: imgSrc }} style={styles.photoGridImage} resizeMode="cover" />
            ) : (
              <View style={styles.photoGridPlaceholder}>
                <IconImagePlaceholder />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VIDEOS TAB
// ════════════════════════════════════════════════════════════════════════════

function VideosTab({ posts, privateBlocked, setOpenVideo }) {
  const videos = posts.filter((p) => isVideo(p));

  if (privateBlocked) {
    return (
      <View style={styles.tabEmptyWrap}>
        <View style={styles.tabEmptyCircle}><IconLock size={32} /></View>
        <Text style={styles.tabEmptyTitle}>Yopiq hisob</Text>
      </View>
    );
  }
  if (videos.length === 0) {
    return (
      <View style={styles.tabEmptyWrap}>
        <View style={[styles.tabEmptyCircle, { borderWidth: 2, borderColor: "#e0e2e8", backgroundColor: "transparent" }]}>
          <IconVideoTab size={28} color="#b0b8c4" />
        </View>
        <Text style={{ fontSize: 14, color: "#b0b8c4" }}>Video yo'q</Text>
      </View>
    );
  }

  return (
    <View style={styles.videosGrid}>
      {videos.map((post, i) => {
        const videoSrc = post.video || post.video_file || post.media || post.picture || post.img || post.image || "";
        const thumb = post.thumbnail || post.cover || post.picture || null;
        return (
          <TouchableOpacity key={post.id || i} onPress={() => setOpenVideo(post)} style={styles.videoGridItem} activeOpacity={0.85}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.videoGridMedia} resizeMode="cover" />
            ) : videoSrc ? (
              <Video source={{ uri: videoSrc }} style={styles.videoGridMedia} resizeMode={ResizeMode.COVER} isMuted />
            ) : null}
            <View style={styles.videoGridOverlay}>
              <View style={styles.videoGridPlayCircle}>
                <IconPlay size={18} color="#fff" />
              </View>
              <View style={styles.videoGridLikesRow}>
                <IconHeart size={14} filled color="#fff" />
                <Text style={styles.videoGridLikesText}>{fmtNum(post.likes_count ?? 0)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  GRID TAB (mixed)
// ════════════════════════════════════════════════════════════════════════════

function GridTab({ posts, privateBlocked, setOpenPost, setOpenVideo }) {
  if (privateBlocked) {
    return (
      <View style={styles.tabEmptyWrap}>
        <View style={styles.tabEmptyCircle}><IconLock size={32} /></View>
        <Text style={styles.tabEmptyTitle}>Yopiq hisob</Text>
        <Text style={{ fontSize: 13, color: "#9aa0ab", textAlign: "center" }}>Postlarni ko'rish uchun follow qiling</Text>
      </View>
    );
  }
  if (posts.length === 0) {
    return (
      <View style={styles.tabEmptyWrap}>
        <View style={[styles.tabEmptyCircle, { borderWidth: 2, borderColor: "#e0e2e8", backgroundColor: "transparent" }]}>
          <IconImagePlaceholder size={28} />
        </View>
        <Text style={{ fontSize: 14, color: "#b0b8c4" }}>Post topilmadi</Text>
      </View>
    );
  }

  return (
    <View style={styles.photosGrid}>
      {posts.map((post, i) => {
        const imgSrc = post.picture || post.img || post.image || "";
        const videoSrc = post.video || post.video_file || post.media || "";
        const hasVid = isVideo(post);
        return (
          <TouchableOpacity
            key={post.id || i}
            onPress={() => (hasVid ? setOpenVideo(post) : setOpenPost(post))}
            style={styles.photoGridItem}
            activeOpacity={0.85}
          >
            {hasVid ? (
              <>
                {videoSrc ? <Video source={{ uri: videoSrc }} style={styles.photoGridImage} resizeMode={ResizeMode.COVER} isMuted /> : null}
                <View style={{ position: "absolute", top: 6, right: 6 }}>
                  <IconPlay size={16} color="#fff" />
                </View>
              </>
            ) : imgSrc ? (
              <Image source={{ uri: imgSrc }} style={styles.photoGridImage} resizeMode="cover" />
            ) : (
              <View style={styles.photoGridPlaceholder}>
                <IconImagePlaceholder />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

const TABS = [
  { key: "feed", label: "Feed", Icon: IconRowsTab },
  { key: "photos", label: "Photos", Icon: IconPhotoTab },
  { key: "videos", label: "Videos", Icon: IconVideoTab },
  { key: "grid", label: "Grid", Icon: IconGridTab },
];

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetUsername = (params?.username || "").toString().replace(/^@/, "").trim() || null;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [followLoad, setFollowLoad] = useState(false);
  const [openPost, setOpenPost] = useState(null);
  const [openVideo, setOpenVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");

  const [showMsg, setShowMsg] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [isOwn, setIsOwn] = useState(false);

  useEffect(() => {
    if (!targetUsername) {
      setError("Username topilmadi.");
      setLoading(false);
      return;
    }
    load();
  }, [targetUsername]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const myLoginUsername = await AsyncStorage.getItem("login_username");
      const userData = await fetchUserByUsername(targetUsername);
      if (!userData) {
        setError(`@${targetUsername} topilmadi.`);
        setLoading(false);
        return;
      }
      if (userData.username === myLoginUsername) {
        setIsOwn(true);
        router.replace("/pages/profile");
        return;
      }
      setUser(userData);
      setFollowCount(userData.followers_count ?? 0);
      setFollowing(userData.is_following ?? userData.is_followed ?? false);
      const postsData = await fetchUserPosts(targetUsername);
      setPosts(postsData);
    } catch (err) {
      console.log("Load error:", err);
      const s = err?.response?.status;
      setError(s === 404 ? `@${targetUsername} topilmadi.` : s === 401 ? "Token eskirgan." : `Xato: ${s || "server"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoad || !user) return;
    setFollowLoad(true);
    const was = following, wasC = followCount;
    setFollowing(!was);
    setFollowCount(was ? wasC - 1 : wasC + 1);
    try {
      const res = await toggleFollowAPI();
      if (res?.is_following !== undefined) setFollowing(res.is_following);
      if (res?.followers_count !== undefined) setFollowCount(res.followers_count);
    } catch {
      setFollowing(was);
      setFollowCount(wasC);
    } finally {
      setFollowLoad(false);
    }
  };

  const handleLikeChange = (postId, isLiked, likesCount) => {
    setPosts((p) => p.map((x) => (String(x.id) === String(postId) ? { ...x, is_liked: isLiked, likes_count: likesCount } : x)));
    if (openPost && String(openPost.id) === String(postId)) setOpenPost((p) => ({ ...p, is_liked: isLiked, likes_count: likesCount }));
    if (openVideo && String(openVideo.id) === String(postId)) setOpenVideo((p) => ({ ...p, is_liked: isLiked, likes_count: likesCount }));
  };

  const userAvatar = user?.avatar || user?.profile_picture || user?.image || user?.photo || null;
  const fullName = user?.full_name || user?.name || "";
  const bio = user?.bio || "";
  const website = user?.website || user?.link || "";
  const username = user?.username || targetUsername || "";
  const followingCount = user?.following_count ?? 0;
  const postsCount = user?.posts_count ?? posts.length;
  const privateBlocked = user?.is_private && !following && !isOwn;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, color: "#9aa0ab", fontSize: 14 }}>@{targetUsername} yuklanmoqda…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { padding: 24 }]}>
        <View style={styles.errorIconCircle}>
          <IconAlert />
        </View>
        <Text style={styles.errorMessageText}>{error}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Qayta urinish</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnOutline}>
            <Text style={styles.backBtnOutlineText}>Orqaga</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const navItems = [
    { href: "/pages/home", active: false, Icon: IconHome },
    { href: "/pages/message", active: false, Icon: IconLogoGlobe },
    { href: "/pages/createPost", active: false, Icon: IconCreate },
    { href: "/pages/movie", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: false, Icon: IconPersonNav },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <PostModal post={openPost} userAvatar={userAvatar} userName={username} visible={!!openPost} onClose={() => setOpenPost(null)} onLikeChange={handleLikeChange} />
      <VideoModal post={openVideo} userAvatar={userAvatar} userName={username} visible={!!openVideo} onClose={() => setOpenVideo(null)} onLikeChange={handleLikeChange} />
      <MessageModal visible={showMsg} username={username} fullName={fullName} userAvatar={userAvatar} onClose={() => setShowMsg(false)} />
      <MenuModal visible={showMenu} username={username} isFollowing={following} onUnfollow={handleFollow} onClose={() => setShowMenu(false)} />
      <PeopleModal visible={showFollowers} title="Followers" count={followCount} onClose={() => setShowFollowers(false)} />
      <PeopleModal visible={showFollowing} title="Following" count={followingCount} onClose={() => setShowFollowing(false)} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <IconBack />
          <Text style={styles.headerBackText}>Orqaga</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>@{username}</Text>
          {postsCount > 0 ? <Text style={styles.headerSubtitle}>{fmtNum(postsCount)} ta post</Text> : null}
        </View>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerMenuBtn}>
          <IconMoreHoriz />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
          {/* Avatar + Stats */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 16 }}>
            <View style={[styles.avatarRing, { backgroundColor: following ? "#6366f1" : "#e53935" }]}>
              <View style={styles.avatarRingInner}>
                <Avatar src={userAvatar} name={fullName || username} size={82} />
              </View>
            </View>
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
              {[
                { label: "Posts", value: fmtNum(postsCount), action: null },
                { label: "Followers", value: fmtNum(followCount), action: () => setShowFollowers(true) },
                { label: "Following", value: fmtNum(followingCount), action: () => setShowFollowing(true) },
              ].map((s, i) =>
                s.action ? (
                  <TouchableOpacity key={i} onPress={s.action} style={styles.statItem}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ) : (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 16 }}>
            {fullName ? <Text style={styles.profileFullName}>{fullName}</Text> : null}
            {username ? <Text style={styles.profileUsername}>@{username}</Text> : null}
            {bio ? <Text style={styles.profileBio}>{bio}</Text> : null}
            {website ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(website.startsWith("http") ? website : `https://${website}`)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <IconLink />
                <Text style={styles.profileWebsite}>{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Action buttons */}
          {isOwn ? (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              <TouchableOpacity onPress={() => router.push("/edit-profile")} style={styles.secondaryBtn}>
                <IconEdit />
                <Text style={styles.secondaryBtnText}>Tahrirlash</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/person")} style={styles.secondaryBtn}>
                <IconPerson />
                <Text style={styles.secondaryBtnText}>Profilim</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              <TouchableOpacity
                onPress={handleFollow}
                disabled={followLoad}
                style={[
                  styles.followBtn,
                  { flex: following ? 1 : 2 },
                  following ? styles.followBtnFollowing : styles.followBtnNotFollowing,
                ]}
              >
                {followLoad ? (
                  <ActivityIndicator size="small" color={following ? "#6366f1" : "#fff"} />
                ) : following ? (
                  <>
                    <IconCheck size={14} color="#0d0f14" />
                    <Text style={styles.followBtnTextFollowing}>Following</Text>
                  </>
                ) : (
                  <>
                    <IconPlus size={14} color="#fff" />
                    <Text style={styles.followBtnTextNotFollowing}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMsg(true)} style={[styles.secondaryBtn, { flex: 1 }]}>
                <IconComment size={15} color="#0d0f14" />
                <Text style={styles.secondaryBtnText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.iconOnlyBtn}>
                <IconMoreHoriz color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}

          {privateBlocked ? (
            <View style={styles.privateNotice}>
              <IconLock />
              <Text style={styles.privateNoticeText}>Yopiq hisob — ko'rish uchun follow qiling</Text>
            </View>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <tab.Icon color={active ? "#6366f1" : "#9aa0ab"} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab content */}
        {activeTab === "feed" ? (
          <FeedTab
            posts={posts}
            userAvatar={userAvatar}
            fullName={fullName}
            username={username}
            privateBlocked={privateBlocked}
            setOpenPost={setOpenPost}
            setOpenVideo={setOpenVideo}
          />
        ) : activeTab === "photos" ? (
          <PhotosTab posts={posts} privateBlocked={privateBlocked} setOpenPost={setOpenPost} />
        ) : activeTab === "videos" ? (
          <VideosTab posts={posts} privateBlocked={privateBlocked} setOpenVideo={setOpenVideo} />
        ) : (
          <GridTab posts={posts} privateBlocked={privateBlocked} setOpenPost={setOpenPost} setOpenVideo={setOpenVideo} />
        )}
      </ScrollView>

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
  screen: { flex: 1, backgroundColor: "#f8f9fb" },
  loadingScreen: { flex: 1, backgroundColor: "#f8f9fb", alignItems: "center", justifyContent: "center" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    height: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#eceef1",
    backgroundColor: "#f8f9fb",
  },
  headerBackBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerBackText: { fontSize: 14, fontWeight: "600", color: "#6366f1" },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#0d0f14" },
  headerSubtitle: { fontSize: 11, color: "#9aa0ab", marginTop: 1 },
  headerMenuBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // Avatar ring
  avatarRing: { width: 88, height: 88, borderRadius: 44, padding: 3, alignItems: "center", justifyContent: "center" },
  avatarRingInner: { width: "100%", height: "100%", borderRadius: 41, padding: 2, backgroundColor: "#f8f9fb", overflow: "hidden", alignItems: "center", justifyContent: "center" },

  // Stats
  statItem: { alignItems: "center", paddingHorizontal: 8, paddingVertical: 4 },
  statValue: { fontSize: 21, fontWeight: "800", color: "#0d0f14" },
  statLabel: { fontSize: 12, color: "#9aa0ab", marginTop: 3 },

  // Bio
  profileFullName: { fontSize: 15, fontWeight: "800", color: "#0d0f14", marginBottom: 4 },
  profileUsername: { fontSize: 13, color: "#9aa0ab", marginBottom: 4 },
  profileBio: { fontSize: 14, color: "#4b5060", lineHeight: 22, marginBottom: 6 },
  profileWebsite: { fontSize: 13, color: "#6366f1", fontWeight: "600" },

  // Buttons
  secondaryBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 6, backgroundColor: "#f0f1f5", borderWidth: 1.5, borderColor: "#e0e2e8",
  },
  secondaryBtnText: { fontWeight: "700", fontSize: 14, color: "#0d0f14" },
  iconOnlyBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "#f0f1f5", borderWidth: 1.5, borderColor: "#e0e2e8",
  },
  followBtn: { paddingVertical: 11, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  followBtnFollowing: { backgroundColor: "#f0f1f5", borderWidth: 1.5, borderColor: "#e0e2e8" },
  followBtnNotFollowing: { backgroundColor: "#6366f1" },
  followBtnTextFollowing: { fontWeight: "700", fontSize: 14, color: "#0d0f14" },
  followBtnTextNotFollowing: { fontWeight: "700", fontSize: 14, color: "#fff" },

  privateNotice: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 12, backgroundColor: "#f0f1f5", borderWidth: 1.5, borderColor: "#e0e2e8", marginBottom: 12,
  },
  privateNoticeText: { fontSize: 13, color: "#9aa0ab", flex: 1 },

  // Tabs
  tabsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#eceef1", backgroundColor: "#fff" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: "#6366f1" },
  tabLabel: { fontSize: 12, fontWeight: "500", color: "#9aa0ab" },
  tabLabelActive: { fontWeight: "700", color: "#6366f1" },

  // Feed tab
  feedCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#eceef1" },
  feedCardHeader: { padding: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  feedCardUsername: { fontSize: 14, fontWeight: "700", color: "#0d0f14" },
  feedCardTime: { fontSize: 11, color: "#9aa0ab" },
  videoBadge: { backgroundColor: "#ede9fe", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  videoBadgeText: { fontSize: 11, fontWeight: "600", color: "#6366f1" },
  feedMedia: { width: "100%", height: 360 },
  feedVideoWrap: { position: "relative" },
  feedPlayOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  feedPlayCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  feedCardActions: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, paddingBottom: 5 },
  feedActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  feedActionText: { fontSize: 13, fontWeight: "600", color: "#0d0f14" },
  feedCardFooter: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2 },
  feedLikesText: { fontSize: 13, fontWeight: "700", color: "#0d0f14", marginBottom: 4 },
  feedCaptionText: { fontSize: 13, color: "#3a3e4a", lineHeight: 20 },

  // Photos grid
  photosGrid: { flexDirection: "row", flexWrap: "wrap", padding: 2 },
  photoGridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, margin: GRID_GAP / 2, backgroundColor: "#eceef1", position: "relative" },
  photoGridImage: { width: "100%", height: "100%" },
  photoGridPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },

  // Videos grid
  videosGrid: { flexDirection: "row", flexWrap: "wrap", padding: VIDEO_GAP },
  videoGridItem: {
    width: VIDEO_ITEM_W, height: VIDEO_ITEM_W * (16 / 9), margin: VIDEO_GAP / 2,
    backgroundColor: "#0d0f14", borderRadius: 8, overflow: "hidden", position: "relative",
  },
  videoGridMedia: { width: "100%", height: "100%" },
  videoGridOverlay: { position: "absolute", inset: 0, justifyContent: "space-between", padding: 10 },
  videoGridPlayCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginTop: "auto", marginBottom: "auto",
  },
  videoGridLikesRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  videoGridLikesText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Tab empty states
  tabEmptyWrap: { alignItems: "center", paddingVertical: 70, paddingHorizontal: 20, gap: 14 },
  tabEmptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#f0f1f5", alignItems: "center", justifyContent: "center" },
  tabEmptyTitle: { fontSize: 16, fontWeight: "700", color: "#0d0f14" },

  // Bottom nav
  bottomNav: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", height: 56, borderTopWidth: 1, borderTopColor: "#d0d7de", backgroundColor: "#f6f8fa", position: "absolute", bottom: 0, left: 0, right: 0 },
  navItem: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navItemActive: { backgroundColor: "#dbeafe" },

  // Error screen
  errorIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff1f0", alignItems: "center", justifyContent: "center" },
  errorMessageText: {
    fontSize: 14, fontWeight: "600", color: "#e53935", textAlign: "center",
    backgroundColor: "#fff1f0", padding: 16, borderRadius: 10, borderWidth: 1, borderColor: "#fecaca", marginTop: 16,
  },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: "#6366f1" },
  retryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  backBtnOutline: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e2e8" },
  backBtnOutlineText: { color: "#0d0f14", fontSize: 14, fontWeight: "600" },

  // ── Full screen image/video modal ──
  fullModalOverlay: { flex: 1, backgroundColor: "rgba(5,5,15,0.82)", justifyContent: "flex-end" },
  fullModalCard: { backgroundColor: "#fff", height: "92%", borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden" },
  fullModalImageWrap: { width: "100%", height: 280, backgroundColor: "#060810", alignItems: "center", justifyContent: "center" },
  fullModalImage: { width: "100%", height: "100%" },
  videoCloseBtn: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  fullModalRightPanel: { flex: 1 },
  fullModalHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: "#f4f5f7" },
  fullModalUsername: { fontSize: 14, fontWeight: "700", color: "#0d0f14" },
  fullModalTime: { fontSize: 11, color: "#9aa0ab" },
  fullModalCaptionWrap: { padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: "#f4f5f7" },
  fullModalCaptionText: { fontSize: 13, color: "#0d0f14", lineHeight: 20 },
  emptyCommentsText: { fontSize: 13, color: "#9aa0ab", textAlign: "center", marginTop: 32 },
  fullModalActionsRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: "#f4f5f7" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
  fullModalInputRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f4f5f7" },
  fullModalInput: { flex: 1, paddingVertical: 9, paddingHorizontal: 13, borderWidth: 1.5, borderColor: "#eceef1", borderRadius: 12, fontSize: 13, backgroundColor: "#f8f9fb", color: "#0d0f14" },
  fullModalSendBtn: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, minWidth: 58, alignItems: "center", justifyContent: "center" },
  fullModalSendText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // ── Small modal (people / message) ──
  centeredOverlay: { flex: 1, backgroundColor: "rgba(5,5,15,0.7)", alignItems: "center", justifyContent: "center", padding: 16 },
  smallCard: { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 380 },
  smallCardPadded: { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 },
  smallCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f0f2f5" },
  smallCardTitle: { fontSize: 15, fontWeight: "700", color: "#0d0f14" },
  smallCardCloseBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  msgModalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  msgModalUsername: { fontSize: 15, fontWeight: "700", color: "#0d0f14" },
  msgModalFullname: { fontSize: 12, color: "#9aa0ab", marginTop: 2 },
  msgModalInput: { width: "100%", padding: 13, borderWidth: 1.5, borderColor: "#eceef1", borderRadius: 12, fontSize: 14, color: "#0d0f14", textAlignVertical: "top", minHeight: 90 },
  msgSentCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  msgCancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e2e8", alignItems: "center" },
  msgCancelText: { fontWeight: "600", fontSize: 14, color: "#0d0f14" },
  msgSendBtn: { flex: 2, paddingVertical: 11, borderRadius: 12, alignItems: "center" },
  msgSendText: { fontWeight: "700", fontSize: 14 },

  // ── Bottom sheet (menu) ──
  bottomSheetOverlay: { flex: 1, backgroundColor: "rgba(5,5,15,0.6)", justifyContent: "flex-end" },
  bottomSheetCard: { backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16, marginBottom: 8, overflow: "hidden" },
  bottomSheetHeader: { padding: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f0f2f5", alignItems: "center" },
  bottomSheetUsername: { fontSize: 13, fontWeight: "600", color: "#9aa0ab" },
  bottomSheetItem: { padding: 16, paddingHorizontal: 20, alignItems: "center" },
  bottomSheetItemText: { fontSize: 15, fontWeight: "600" },
  bottomSheetDivider: { height: 1, backgroundColor: "#f0f2f5" },
});