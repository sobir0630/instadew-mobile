import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Video } from "expo-av";
import {
  ChevronLeft,
  ImageIcon,
  PlayCircle,
  Play,
  Heart,
  AlertCircle,
  Plus,
  Info,
} from "lucide-react-native";
import { router } from "expo-router";
import API from "../../api/server";


// ════════════════════════════════════════════════════════════════════════════
//  API — Rasmlar va Videolar (siz bergan mantiq, o'zgartirilmadi)
// ════════════════════════════════════════════════════════════════════════════

const getToken = async () => await AsyncStorage.getItem("token");
const getUserId = async () => await AsyncStorage.getItem("user_id");
const getUsername = async () => await AsyncStorage.getItem("login_username");

const authHeader = async () => ({
  Authorization: `Bearer ${(await getToken())?.trim()}`,
});

// Rasmlarni olish
async function fetchMyImages() {
  try {
    const id = await getUserId();
    const res = await API.get(`/posts/my-posts/${id}/`, { headers: await authHeader() });
    const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
    const mine = data.filter((p) => String(p.author?.id ?? p.user_id ?? p.author) === String(id));
    return mine.length > 0 ? mine : data;
  } catch (err) {
    console.error("Images fetch error:", err);
    throw err;
  }
}

// Videolarni olish — ✅ so'ralgan API
async function fetchMyVideos() {
  try {
    const username = await getUsername();
    const res = await API.get(`/videos/user-videos/${username}/`, { headers: await authHeader() });
    const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
    return data;
  } catch (err) {
    console.error("Videos fetch error:", err);
    throw err;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  Media URI va type aniqlash
// ════════════════════════════════════════════════════════════════════════════

function getImageMediaUri(post) {
  return post.picture || post.img || post.image || null;
}

function getVideoMediaUri(video) {
  return video?.video || video?.video_url || video?.media || null;
}

function getPostCaption(post) {
  return post?.caption || post?.description || post?.text || "";
}

function getPostLikes(post) {
  return post?.likes_count ?? post?.likes ?? 0;
}

function getPostDate(post) {
  return post?.created_at
    ? new Date(post.created_at).toLocaleDateString("uz-UZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
}

// ════════════════════════════════════════════════════════════════════════════
//  ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Spinner({ size = 33, color = "#6366f1" }) {
  const spin = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color,
        borderTopColor: "transparent",
        transform: [{ rotate }],
      }}
    />
  );
}

function Shimmer({ style }) {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return <Animated.View style={[{ backgroundColor: "#f0f2f5" }, style, { opacity }]} />;
}

function SkeletonCard({ width }) {
  return (
    <View style={[styles.card, { width }]}>
      <Shimmer style={{ width: "100%", aspectRatio: 1 }} />
      <View style={{ padding: 12, gap: 6 }}>
        <Shimmer style={{ height: 11, borderRadius: 4, width: "70%" }} />
        <Shimmer style={{ height: 10, borderRadius: 4, width: "45%" }} />
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  POST CARD — rasm va video BIR XIL ko'rinishda, faqat videoda play belgisi bor
// ════════════════════════════════════════════════════════════════════════════

function PostCard({ post, width, onPress, isVideo }) {
  const [loaded, setLoaded] = useState(false);

  const mediaUri = isVideo ? getVideoMediaUri(post) : getImageMediaUri(post);
  const caption = getPostCaption(post);
  const likes = getPostLikes(post);
  const timeStr = getPostDate(post);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { width }]}>
      <View style={{ width: "100%", aspectRatio: 1, backgroundColor: "#f4f5f7" }}>
        {!loaded && <Shimmer style={StyleSheet.absoluteFill} />}

        {mediaUri ? (
          isVideo ? (
            <Video
              source={{ uri: mediaUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              shouldPlay={false}
              isMuted
              useNativeControls={false}
              onReadyForDisplay={() => setLoaded(true)}
              onError={(err) => {
                console.error("Video error:", err);
                setLoaded(true);
              }}
            />
          ) : (
            <Image
              source={{ uri: mediaUri }}
              style={{ width: "100%", height: "100%" }}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
            />
          )
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={32} color="#c8cbd0" strokeWidth={1.5} />
          </View>
        )}

        {/* Video ekanini bildiruvchi play belgisi */}
        {isVideo && mediaUri && (
          <View style={styles.playBadge}>
            <PlayCircle size={16} color="#fff" fill="rgba(0,0,0,0.35)" strokeWidth={2} />
          </View>
        )}

        {/* Like count overlay */}
        <View style={styles.likeBadge}>
          <Heart size={11} color="#fff" fill="#fff" />
          <Text style={styles.likeBadgeText}>{likes >= 1000 ? (likes / 1000).toFixed(1) + "k" : likes}</Text>
        </View>
      </View>

      <View style={{ padding: 10, paddingTop: 10 }}>
        {caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {caption}
          </Text>
        ) : (
          <Text style={styles.noCaption}>Caption yo'q</Text>
        )}
        {timeStr ? <Text style={styles.timeText}>{timeStr}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN — MY POSTS PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function MyPostsPage() {
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();

  const [imagePosts, setImagePosts] = useState([]);
  const [videoPosts, setVideoPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("images"); // "images" | "videos"

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Rasmlarni olish
      const images = await fetchMyImages();
      setImagePosts(images);

      // Videolarni olish
      const videos = await fetchMyVideos();
      setVideoPosts(videos);
    } catch (err) {
      console.error("Posts fetch error:", err);
      const status = err?.response?.status;

      if (status === 401) {
        setError("Token muddati tugagan. Iltimos qayta login qiling.");
      } else if (status === 404) {
        setError("Postlar topilmadi.");
      } else if (status === 403) {
        setError("Ruxsat berilmagan.");
      } else {
        setError(`Xato: ${status || "server bilan bog'lanib bo'lmadi"}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visiblePosts = activeTab === "images" ? imagePosts : videoPosts;

  // ✅ TUZATILDI: post_id bilan birga post_type ham saqlanadi, shu orqali
  // EditPost sahifasi kerakli API'ni (rasm yoki video) to'g'ri tanlaydi
  const handlePostClick = async (post) => {
    await AsyncStorage.setItem("post_id", String(post.id));
    await AsyncStorage.setItem("post_type", activeTab === "videos" ? "video" : "image");
    router.push("./editPost");
  };

  const GAP = 14;
  const H_PADDING = 16;
  const cardWidth = (screenWidth - H_PADDING * 2 - GAP) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f5f8" }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* ✅ TUZATILDI: endi faqat @react-navigation ishlatiladi (avval expo-router
            bilan aralashib ketgan edi) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <ChevronLeft size={18} color="#6366f1" strokeWidth={2.5} />
          <Text style={styles.backText}>Orqaga</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mening postlarim</Text>

        {!loading && !error ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{visiblePosts.length}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <FlatList
        data={!loading && !error ? visiblePosts : []}
        keyExtractor={(item, i) => String(item.id ?? i)}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ padding: H_PADDING, paddingBottom: 80, gap: GAP }}
        ListHeaderComponent={
          <>
            {/* ── Rasmlar / Videolar tab ── */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                onPress={() => setActiveTab("images")}
                style={[styles.tabBtn, activeTab === "images" && styles.tabBtnActive]}
              >
                <ImageIcon size={15} color={activeTab === "images" ? "#fff" : "#57606a"} />
                <Text style={[styles.tabText, activeTab === "images" && styles.tabTextActive]}>
                  Rasmlar ({imagePosts.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("videos")}
                style={[styles.tabBtn, activeTab === "videos" && styles.tabBtnActive]}
              >
                <Play size={15} color={activeTab === "videos" ? "#fff" : "#57606a"} />
                <Text style={[styles.tabText, activeTab === "videos" && styles.tabTextActive]}>
                  Videolar ({videoPosts.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Hint ── */}
            {!loading && !error && visiblePosts.length > 0 && (
              <View style={styles.hintBox}>
                <Info size={15} color="#6366f1" />
                <Text style={styles.hintText}>Tahrirlash uchun bosing</Text>
              </View>
            )}

            {/* ── Yuklash holati (skeleton grid) ── */}
            {loading && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <SkeletonCard key={i} width={cardWidth} />
                  ))}
              </View>
            )}

            {/* ── Xato holati ── */}
            {!loading && error ? (
              <View style={styles.centerState}>
                <View style={styles.errorIconWrap}>
                  <AlertCircle size={26} color="#cf222e" strokeWidth={2} />
                </View>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={load} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Qayta urinish</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── Bo'sh holat (shu tab bo'yicha) ── */}
            {!loading && !error && visiblePosts.length === 0 && (
              <View style={styles.centerState}>
                <View style={styles.emptyIconWrap}>
                  <ImageIcon size={32} color="#8b5cf6" strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === "images" ? "Rasm postlari yo'q" : "Video postlari yo'q"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === "images"
                    ? "Hali hech qanday rasm posti qo'shmadingiz"
                    : "Hali hech qanday video posti qo'shmadingiz"}
                </Text>
                <TouchableOpacity onPress={() => router.push("../createPost")} style={styles.createBtn}>
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.createBtnText}>Post qo'shish</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            width={cardWidth}
            onPress={() => handlePostClick(item)}
            isVideo={activeTab === "videos"}
          />
        )}
        ListFooterComponent={
          !loading && !error && visiblePosts.length > 0 ? (
            <Text style={styles.footerText}>Jami {visiblePosts.length} ta post</Text>
          ) : null
        }
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ebebef",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backText: { color: "#6366f1", fontSize: 14, fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1a1d23" },
  countBadge: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ebebef",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 9,
  },
  tabBtnActive: { backgroundColor: "#6366f1" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#57606a" },
  tabTextActive: { color: "#fff", fontWeight: "700" },

  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: "#e0e7ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  hintText: { fontSize: 12, color: "#4f46e5", fontWeight: "500" },

  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 14,
  },
  playBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  likeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  likeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  caption: { fontSize: 13, color: "#1a1d23", fontWeight: "500", lineHeight: 18 },
  noCaption: { fontSize: 12, color: "#a0a4ad", fontStyle: "italic" },
  timeText: { fontSize: 11, color: "#a0a4ad", marginTop: 4 },

  centerState: { alignItems: "center", paddingVertical: 60, gap: 14 },
  errorIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff1f0",
    borderWidth: 1,
    borderColor: "#ffcdd0",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { fontSize: 15, fontWeight: "600", color: "#cf222e", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#6366f1",
  },
  retryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23" },
  emptySubtitle: { fontSize: 13, color: "#a0a4ad", textAlign: "center" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
  },
  createBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  footerText: { textAlign: "center", fontSize: 12, color: "#b0b4be", marginTop: 10 },
});