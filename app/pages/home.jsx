import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import { api as API } from "../api/server";


const { width: SCREEN_W } = Dimensions.get("window");
const AVATAR_COLORS = [
  ["#667eea", "#764ba2"], ["#10b981", "#059669"], ["#f59e0b", "#d97706"],
  ["#ef4444", "#dc2626"], ["#0969da", "#0550ae"], ["#ec4899", "#db2777"], ["#6366f1", "#4f46e5"],
];

function fmtNum(n) {
  if (n === undefined || n === null) return "0";
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

// ════════════════════════════════════════════════════════════════════════════
//  API HELPERS
// ════════════════════════════════════════════════════════════════════════════

const getToken = async () => await AsyncStorage.getItem("token");
const authHeader = async () => {
  const token = (await getToken())?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function fetchPosts() {
  const res = await API.get("/posts/post/", { headers: await authHeader() });
  return Array.isArray(res.data) ? res.data : res.data?.results || [];
}
async function fetchCurrentUser() {
  const id = await AsyncStorage.getItem("user_id");
  if (!id) throw new Error("ID topilmadi");
  const res = await API.get(`/users/register/${id}/`, { headers: await authHeader() });
  return res.data;
}
async function fetchUsers() {
  const res = await API.get(`/users/register/`, { headers: await authHeader() });
  return Array.isArray(res.data) ? res.data : res.data?.results || [];
}
async function fetchComments(postId) {
  const res = await API.get(`/comments/comments/?post=${postId}`, { headers: await authHeader() });
  const d = res.data;
  return Array.isArray(d) ? d : d?.results || d?.comments || [];
}
async function submitComment(postId, text) {
  const id = await AsyncStorage.getItem("user_id");
  const res = await API.post(`/comments/comments/`, { post_id: postId, text, user: id }, { headers: await authHeader() });
  return res.data;
}
async function toggleLikeAPI(postId) {
  const res = await API.post(`/posts/post/${postId}/like/`, {}, { headers: await authHeader() });
  return res.data;
}

function getCommentAuthor(c) { return c.author?.username || c.author?.full_name || c.username || c.user?.username || "user"; }
function getCommentAvatar(c) { return c.author?.avatar || c.author?.profile_picture || c.author?.image || c.user?.avatar || c.user?.profile_picture || null; }
function getCommentBody(c) { return c.body || c.text || c.content || ""; }
function getCommentTime(c) {
  const raw = c.created_at || c.time || "";
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString(); } catch { return raw; }
}

// ════════════════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════════════════

const IconHeart = ({ size = 22, filled = false, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);
const IconComment = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const IconShare = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
);
const IconBookmark = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);
const IconMore = ({ size = 16, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="5" cy="12" r="2" /><Circle cx="12" cy="12" r="2" /><Circle cx="19" cy="12" r="2" />
  </Svg>
);
const IconClose = ({ size = 18, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconSearch = ({ size = 15, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);
const IconChevronRight = ({ size = 14, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
const IconAlert = ({ size = 18, color = "#cf222e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="10" /><Line x1="12" y1="8" x2="12" y2="12" /><Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);
const IconLogoGlobe = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </Svg>
);
const IconHome = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
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
    <Polygon points="23 7 16 12 23 17 23 7" />
    <Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconPerson = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);
const IconImagePlaceholder = ({ size = 24, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ════════════════════════════════════════════════════════════════════════════

function Avatar({ src, initials, size = 36, gradA, gradB, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [a, b] = gradA && gradB ? [gradA, gradB] : AVATAR_COLORS[index % AVATAR_COLORS.length];

  if (src && !imgError) {
    return (
      <Image
        source={{ uri: src }}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: size * 0.3,
          borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
        }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: a, alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: size / 2.8, fontWeight: "700", color: "#fff" }}>
        {initials || "??"}
      </Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SKELETONS
// ════════════════════════════════════════════════════════════════════════════

function Skeleton({ w, h = 14, r = 6, style: sx }) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: "#e9ecef" }, sx]} />;
}
function StorySkeleton() {
  return (
    <View style={{ alignItems: "center", gap: 6, marginRight: 12 }}>
      <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: "#e9ecef" }} />
      <Skeleton w={48} h={10} r={4} />
    </View>
  );
}
function PostSkeleton() {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#e9ecef" }} />
        <View style={{ gap: 6 }}>
          <Skeleton w={120} h={13} />
          <Skeleton w={72} h={11} />
        </View>
      </View>
      <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#e9ecef" }} />
      <View style={{ padding: 14, gap: 8 }}>
        <Skeleton w={80} h={13} />
        <Skeleton w="90%" h={12} />
        <Skeleton w="60%" h={12} />
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  POST MODAL (comments + like)
// ════════════════════════════════════════════════════════════════════════════

function PostModal({ post, visible, onClose, onLikeChange }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(post?.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes_count ?? post?.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!post) return;
    setLiked(post.is_liked ?? false);
    setLikeCount(post.likes_count ?? post.likes ?? 0);
    let cancelled = false;
    setCommentsLoading(true);
    fetchComments(post.id)
      .then((data) => { if (!cancelled) setComments(data); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    return () => { cancelled = true; };
  }, [post?.id]);

  if (!post) return null;

  const authorAvatar = post.author?.avatar || post.author?.profile_picture || post.author?.image || post.avatar || null;
  const username = post.author?.username || post.author?.user || post.username || "user";
  const initials = getInitials(post.author?.full_name || post.name || username);
  const imageUrl = post.picture || post.img || "";
  const caption = post.caption || post.description || "";
  const timeStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : "";

  const submit = async () => {
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      const username2 = await AsyncStorage.getItem("login_username");
      const newC = await submitComment(post.id, t);
      const finalC = newC?.id ? newC : {
        id: Date.now(), text: t, body: t,
        author: { username: username2 || "you" },
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, finalC]);
      setText("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.log("Comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    const wasCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount(wasLiked ? wasCount - 1 : wasCount + 1);
    onLikeChange?.(post.id, !wasLiked, wasLiked ? wasCount - 1 : wasCount + 1);
    try {
      const res = await toggleLikeAPI(post.id);
      if (res?.is_liked !== undefined) setLiked(res.is_liked);
      if (res?.likes_count !== undefined) {
        setLikeCount(res.likes_count);
        onLikeChange?.(post.id, res.is_liked ?? !wasLiked, res.likes_count);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(wasCount);
      onLikeChange?.(post.id, wasLiked, wasCount);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalCard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Avatar src={authorAvatar} initials={initials} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.modalUsername}>@{username}</Text>
              <Text style={styles.modalTime}>{timeStr}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <IconClose />
            </TouchableOpacity>
          </View>

          {/* Image */}
          <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="cover" />

          {/* Caption */}
          {caption ? (
            <View style={styles.modalCaptionWrap}>
              <Text style={styles.modalCaptionText}>
                <Text style={{ fontWeight: "700" }}>@{username}</Text> {caption}
              </Text>
            </View>
          ) : null}

          {/* Comments list */}
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
                  initials={getInitials(getCommentAuthor(c))}
                  size={26}
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

          {/* Actions */}
          <View style={styles.modalActionsRow}>
            <TouchableOpacity onPress={handleLike} disabled={likeLoading} style={styles.actionBtn}>
              <IconHeart filled={liked} color={liked ? "#cf222e" : "#57606a"} size={20} />
              <Text style={[styles.actionCount, liked && { color: "#cf222e" }]}>{fmtNum(likeCount)}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <IconComment size={20} />
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
//  POST CARD
// ════════════════════════════════════════════════════════════════════════════

function PostCard({ post, onOpenModal, onLikeChange }) {
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes_count ?? post.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count ?? post.comment_count ?? null);

  useEffect(() => {
    if (commentCount !== null) return;
    fetchComments(post.id).then((data) => setCommentCount(data.length)).catch(() => setCommentCount(0));
  }, [post.id]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    const wasCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount(wasLiked ? wasCount - 1 : wasCount + 1);
    onLikeChange?.(post.id, !wasLiked, wasLiked ? wasCount - 1 : wasCount + 1);
    try {
      const res = await toggleLikeAPI(post.id);
      if (res?.is_liked !== undefined) setLiked(res.is_liked);
      if (res?.likes_count !== undefined) {
        setLikeCount(res.likes_count);
        onLikeChange?.(post.id, res.is_liked ?? !wasLiked, res.likes_count);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(wasCount);
      onLikeChange?.(post.id, wasLiked, wasCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const imageUrl = post.picture || post.img || "";
  const username = post.author?.username || post.author?.user || post.username || "user";
  const initials = getInitials(post.author?.full_name || post.name || username);
  const caption = post.caption || post.description || "";
  const timeStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : "";
  const authorAvatar = post.author?.avatar || post.author?.profile_picture || post.author?.image || post.avatar || null;

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Avatar src={authorAvatar} initials={initials} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postUsername}>@{username}</Text>
          <Text style={styles.postTime}>{timeStr}</Text>
        </View>
        <TouchableOpacity style={{ padding: 4 }}>
          <IconMore />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <TouchableOpacity activeOpacity={0.95} onPress={onOpenModal}>
        <Image source={{ uri: imageUrl }} style={styles.postImage} resizeMode="cover" />
      </TouchableOpacity>

      {/* Action row */}
      <View style={styles.postActionsRow}>
        <TouchableOpacity onPress={handleLike} disabled={likeLoading} style={{ marginRight: 14 }}>
          <IconHeart filled={liked} color={liked ? "#cf222e" : "#57606a"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenModal} style={{ marginRight: 14 }}>
          <IconComment />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 14 }}>
          <IconShare />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity>
          <IconBookmark />
        </TouchableOpacity>
      </View>

      {/* Caption & likes */}
      <View style={styles.postFooter}>
        <Text style={styles.likesText}>{fmtNum(likeCount)} likes</Text>
        {caption ? (
          <Text style={styles.captionText}>
            <Text style={{ fontWeight: "700" }}>@{username}</Text> {caption}
          </Text>
        ) : null}
        {commentCount === null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <ActivityIndicator size="small" color="#8c959f" />
            <Text style={styles.viewCommentsText}>Loading…</Text>
          </View>
        ) : commentCount > 0 ? (
          <TouchableOpacity onPress={onOpenModal}>
            <Text style={styles.viewCommentsText}>
              View all {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onOpenModal}>
            <Text style={styles.viewCommentsText}>Add a comment…</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SEARCH BOX
// ════════════════════════════════════════════════════════════════════════════

function SearchBox({ users = [] }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(
      users
        .filter((u) => u.username?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q))
        .slice(0, 5)
    );
  }, [query, users]);

  const goToUser = (username) => {
    setQuery("");
    setSuggestions([]);
    setFocused(false);
    router.push(`/pages/userAccount?username=${encodeURIComponent(username)}`);
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={[styles.searchBar, { borderColor: focused ? "#0969da" : "#d0d7de" }]}>
        <IconSearch />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search users…"
          placeholderTextColor="#8c959f"
          style={styles.searchInput}
          onSubmitEditing={() => { if (suggestions.length > 0) goToUser(suggestions[0].username); }}
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); }}>
            <IconClose size={14} />
          </TouchableOpacity>
        ) : null}
      </View>

      {focused && query.trim().length > 0 && (
        <View style={styles.searchDropdown}>
          {suggestions.length === 0 ? (
            <Text style={styles.noResultsText}>No results for "{query}"</Text>
          ) : (
            suggestions.map((u, i) => (
              <TouchableOpacity
                key={u.id || i}
                onPress={() => goToUser(u.username)}
                style={[
                  styles.suggestionRow,
                  i < suggestions.length - 1 && styles.suggestionRowBorder,
                ]}
              >
                <Avatar
                  src={u.avatar || u.profile_picture || u.image || null}
                  initials={getInitials(u.full_name || u.username)}
                  size={32}
                  index={i}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionUsername}>@{u.username}</Text>
                  {u.full_name ? <Text style={styles.suggestionFullname}>{u.full_name}</Text> : null}
                </View>
                <IconChevronRight />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN FEED SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function FeedScreen() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsResult, userResult, usersResult] = await Promise.allSettled([
        fetchPosts(),
        fetchCurrentUser(),
        fetchUsers(),
      ]);
      if (postsResult.status === "fulfilled") setPosts(postsResult.value);
      else { console.log("Posts error:", postsResult.reason); setError("Postlarni yuklab bo'lmadi"); }
      if (userResult.status === "fulfilled") setCurrentUser(userResult.value);
      if (usersResult.status === "fulfilled") setUsers(usersResult.value);
    } catch (err) {
      console.log("Load error:", err);
      setError("Nimadir xato ketdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleLikeChange = (postId, isLiked, likesCount) => {
    setPosts((prev) =>
      prev.map((p) => (String(p.id) === String(postId) ? { ...p, is_liked: isLiked, likes_count: likesCount } : p))
    );
    if (openPost && String(openPost.id) === String(postId)) {
      setOpenPost((prev) => ({ ...prev, is_liked: isLiked, likes_count: likesCount }));
    }
  };

  const currentAvatar = currentUser?.avatar || currentUser?.profile_picture || currentUser?.image || null;
  const currentInitials = getInitials(currentUser?.full_name || currentUser?.username || "");

  const navItems = [
    { href: "/pages/home", active: true, Icon: IconHome },
    { href: "/pages/message", active: false, Icon: IconLogoGlobe },
    { href: "/pages/createPost", active: false, Icon: IconCreate, isCenter: true },
    { href: "/pages/movie", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: false, Icon: IconPerson },
  ];

  const ListHeader = (
    <>
      {/* Stories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesRow}
      >
        {loading
          ? Array(6).fill(0).map((_, i) => <StorySkeleton key={i} />)
          : users.slice(0, 10).map((u, i) => {
              const [gradA, gradB] = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const userAvatar = u.avatar || u.profile_picture || u.image || null;
              return (
                <TouchableOpacity
                  key={u.id || i}
                  onPress={() => router.push(`/pages/userAccount?username=${encodeURIComponent(u.username)}`)}
                  style={styles.storyItem}
                >
                  <View style={[styles.storyRing, { backgroundColor: gradA }]}>
                    <View style={styles.storyRingInner}>
                      <Avatar
                        src={userAvatar}
                        initials={getInitials(u.full_name || u.username)}
                        size={50}
                        gradA={gradA}
                        gradB={gradB}
                      />
                    </View>
                  </View>
                  <Text style={styles.storyUsername} numberOfLines={1}>{u.username}</Text>
                </TouchableOpacity>
              );
            })}
      </ScrollView>

      <View style={styles.divider} />

      {error ? (
        <View style={styles.errorBanner}>
          <IconAlert />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadAll} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={{ paddingHorizontal: 16 }}>
          {Array(3).fill(0).map((_, i) => <PostSkeleton key={i} />)}
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <PostModal
        post={openPost}
        visible={!!openPost}
        onClose={() => setOpenPost(null)}
        onLikeChange={handleLikeChange}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <IconLogoGlobe />
          </View>
          <Text style={styles.logoText}>instadew</Text>
        </View>
        <SearchBox users={users} />
        <TouchableOpacity onPress={() => router.push("/pages/profile")}>
          {currentUser ? (
            <Avatar src={currentAvatar} initials={currentInitials} size={32} gradA="#667eea" gradB="#764ba2" />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#e9ecef" }} />
          )}
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={loading ? [] : posts}
        keyExtractor={(item, i) => String(item.id || i)}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <IconImagePlaceholder />
              </View>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item: post }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PostCard
              post={post}
              onOpenModal={() => setOpenPost(post)}
              onLikeChange={handleLikeChange}
            />
          </View>
        )}
        ListFooterComponent={
          !loading && posts.length > 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <ActivityIndicator color="#d0d7de" />
            </View>
          ) : null
        }
      />


            {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {navItems.map((item, i) => {
          const isCenter = item.isCenter;

          return (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(item.href)}
              style={[
                styles.navItem,
                isCenter && styles.centerItem,
              ]}
            >
              <item.Icon
                color={
                    isCenter
                      ? "#010811" // qizil
                      : item.active
                      ? "#1525d3"
                      : "#92a2b4"
                }
                size={isCenter ? 34 : 24 }
              />
            </TouchableOpacity>
          );
        })}
      </View>
      

    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  logoBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#0969da", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 17, fontWeight: "800", color: "#0969da", letterSpacing: -0.4 },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 36,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#24292f", padding: 0 },
  searchDropdown: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 500,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  noResultsText: { padding: 14, fontSize: 13, color: "#8c959f" },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  suggestionRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f6f8fa" },
  suggestionUsername: { fontSize: 13, fontWeight: "600", color: "#24292f" },
  suggestionFullname: { fontSize: 11, color: "#57606a" },

  // Stories
  storiesRow: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  storyItem: { alignItems: "center", gap: 6, width: 64 },
  storyRing: { width: 62, height: 62, borderRadius: 16, padding: 2, alignItems: "center", justifyContent: "center" },
  storyRingInner: {
    width: "100%", height: "100%", borderRadius: 14,
    backgroundColor: "#f6f8fa", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  storyUsername: { fontSize: 11, fontWeight: "600", color: "#24292f", width: 64, textAlign: "center" },

  divider: { height: 1, backgroundColor: "#d0d7de", marginBottom: 16 },

  // Error banner
  errorBanner: {
    marginHorizontal: 16, marginBottom: 16, padding: 14,
    borderRadius: 10, backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#ffcdd0",
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  errorText: { fontSize: 13, color: "#cf222e", flex: 1 },
  retryBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: "#cf222e" },
  retryBtnText: { fontSize: 12, fontWeight: "600", color: "#cf222e" },

  // Post card
  postCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 14 },
  postUsername: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  postTime: { fontSize: 11, color: "#8c959f" },
  postImage: { width: "100%", aspectRatio: 1, backgroundColor: "#f6f8fa" },
  postActionsRow: { flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 6 },
  postFooter: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  likesText: { fontSize: 13, fontWeight: "700", color: "#24292f" },
  captionText: { fontSize: 13, color: "#24292f", lineHeight: 19 },
  viewCommentsText: { fontSize: 13, color: "#8c959f" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: "#d0d7de",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#8c959f" },

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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(36,41,47,0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
  },
  modalUsername: { fontSize: 13, fontWeight: "700", color: "#24292f" },
  modalTime: { fontSize: 11, color: "#57606a" },
  modalImage: { width: "100%", height: 260, backgroundColor: "#0d1117" },
  modalCaptionWrap: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#d0d7de" },
  modalCaptionText: { fontSize: 13, color: "#24292f", lineHeight: 19 },
  commentsList: { flex: 1 },
  emptyCommentsText: { color: "#8c959f", fontSize: 13, textAlign: "center", marginTop: 20 },
  commentText: { fontSize: 13, color: "#24292f" },
  commentTime: { fontSize: 11, color: "#8c959f", marginTop: 2 },
  modalActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600", color: "#57606a" },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
  },
  commentInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: "#f6f8fa",
    color: "#24292f",
  },
  postBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});