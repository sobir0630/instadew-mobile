import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPostWrapper } from "../../../components/home/AnimatedPostWrapper";
import { AnimatedStories } from "../../../components/home/AnimatedStories";
import { Avatar } from "../../../components/home/Avatar";
import { DiscoverGrid } from "../../../components/home/DiscoverGrid";
import {
  IconAlert, IconCreate, IconHome, IconImagePlaceholder,
  IconLogoGlobe, IconMovie, IconPerson,
} from "../../../components/home/icons";
import { PostCard } from "../../../components/home/PostCard";
import { PostModal } from "../../../components/home/PostModal";
import { ReelsRow } from "../../../components/home/ReelsRow";
import { SearchBox } from "../../../components/home/SearchBox";
import { PostSkeleton, StorySkeleton } from "../../../components/home/Skeletons";
import { StoryViewer } from "../../../components/home/StoryViewer";

import { fetchCurrentUser, fetchPosts, fetchUsers, fetchVideos } from "../../../api/home/FeedApi";
import { fetchStoryGroups } from "../../../api/home/StoryApi";
import { useViewableVideo } from "../../../hooks/home/useViewableVideo";
import { styles } from "../../../styles/home/FeedStyles";
import { getInitials } from "../../../utils/home/Formatters";
import { normalizeVideoForDiscover, normalizeVideoForReel } from "../../../utils/home/Normalizers";
import AsyncStorage from "@react-native-async-storage/async-storage";

import API from "../../../api/api/server";

// ═══════════════════════════════════════════════════════════════════════
//  MAIN FEED SCREEN
// ════════════════════════════════════════
export default function FeedScreen() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const [discoverItems, setDiscoverItems] = useState([]);
  const [reels, setReels] = useState([]);
  const { visibleId, viewabilityConfig, onViewableItemsChanged } = useViewableVideo();

  // music player state
  const [musicPlayerVisible, setMusicPlayerVisible] = useState(false);

  // ── STORY TIZIMI ──────────────────────────────────────────────────────
  // fetchStoryGroups() hozircha api/storyApi.js dagi MOCK (lokal) ma'lumot
  // qaytaradi — bitta sinov video-storysi bilan. Backend tayyor bo'lganda
  // faqat storyApi.js ni almashtirish kifoya, bu yer o'zgarishsiz qoladi.
  const [storyGroups, setStoryGroups] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [count, setCount] = useState(0);

  async function getUnreadCount() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await API.get(
        "/notifications/notifications/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = response.data;

      const result = data.filter(
        (item) => item.is_read === false
      ).length;

      console.log("unread count:", result);

      return result;
    } catch (error) {
      console.log(
        "Unread count error:",
        error?.response?.data || error.message
      );

      return 0;
    }
  }

  useEffect(() => {
    getUnreadCount().then((result) => {
      setCount(result);
    });
  }, []);
 
  // =================

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsResult, userResult, usersResult, videosResult, storiesResult] = await Promise.allSettled([
        fetchPosts(),
        fetchCurrentUser(),
        fetchUsers(),
        fetchVideos(),
        fetchStoryGroups(),
      ]);

      if (postsResult.status === "fulfilled") setPosts(postsResult.value);
      else { console.log("Posts error:", postsResult.reason); setError("Postlarni yuklab bo'lmadi"); }

      let loadedCurrentUser = null;
      if (userResult.status === "fulfilled") {
        loadedCurrentUser = userResult.value;
        setCurrentUser(loadedCurrentUser);
      }
      if (usersResult.status === "fulfilled") setUsers(usersResult.value);

      if (videosResult.status === "fulfilled") {
        const videoData = Array.isArray(videosResult.value) ? videosResult.value : videosResult.value?.results || [];
        setDiscoverItems(videoData.slice(0, 9).map((video, index) => normalizeVideoForDiscover(video, index)));
        setReels(videoData.slice(0, 6).map((video, index) => normalizeVideoForReel(video, index)));
      } else {
        console.log("Videos error:", videosResult.reason);
      }

      if (storiesResult.status === "fulfilled") {
        let groups = storiesResult.value;
        // ── SINOV UCHUN: mock story guruhini joriy foydalanuvchiga
        // bog'lab qo'yamiz, shunda "Your story" halqasini bosib to'liq
        // ishlaydigan (video + like + comment) storyni sinab ko'rish
        // mumkin. Haqiqiy backend ulanganda bu blokni olib tashlang —
        // real guruhlar to'g'ridan-to'g'ri haqiqiy user ID bilan keladi.
        if (loadedCurrentUser && groups.length > 0) {
          groups = groups.map((g, i) =>
            i === 0 ? { ...g, user: { ...g.user, id: loadedCurrentUser.id } } : g
          );
        }
        setStoryGroups(groups);
      }
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
    { href: "/pages/home/FeedScreen", active: true, Icon: IconHome },
    { href: "/pages/chat/ChatScreen", active: false, Icon: IconLogoGlobe },
    { href: "/pages/create/CreatePostScreen", active: false, Icon: IconCreate, isCenter: true },
    { href: "/pages/reels/reels", active: false, Icon: IconMovie },
    { href: "/pages/person/ProfileScreen", active: false, Icon: IconPerson },
  ];

  const openVideoInReels = (video) => {
    if (!video?.id) return;
    router.push({ pathname: "/pages/reels/reels", params: { video_id: String(video.id) } });
  };

  // Story halqasi bosilganda: shu userga tegishli guruh topilsa —
  // StoryViewer'ni ochamiz; topilmasa (hali storysi yo'q) — avvalgi
  // xulq-atvorga mos ravishda profil sahifasiga o'tamiz.
  const handleOpenStory = (user, isMine) => {
    const idx = storyGroups.findIndex((g) => String(g.user.id) === String(user.id));
    if (idx === -1) {
      if (isMine) {
        // TODO: hali storyingiz yo'q — bu yerga "Story qo'shish" oqimini ulang
        router.push("/pages/person/ProfileScreen");
      } else {
        router.push(`/pages/userAccount?username=${encodeURIComponent(user.username)}`);
      }
      return;
    }
    setStoryViewerIndex(idx);
    setStoryViewerVisible(true);
  };

  const ListHeader = (
    <>
      {loading ? (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
          {Array(6).fill(0).map((_, i) => <StorySkeleton key={i} />)}
        </View>
      ) : (
        <AnimatedStories
          currentUser={currentUser}
          users={users}
          onOpenStory={handleOpenStory}
        />
      )}

      <View style={styles.divider} />

      {!loading && reels.length > 0 && (
        <ReelsRow reels={reels} onOpenReel={openVideoInReels} />
      )}

      {!loading && discoverItems.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>Discover</Text>
          <DiscoverGrid items={discoverItems} onOpenItem={openVideoInReels} />
          <View style={styles.divider} />
        </>
      )}

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

      {/* Instagram uslubidagi to'liq ekran story ko'ruvchi */}
      <StoryViewer
        visible={storyViewerVisible}
        groups={storyGroups}
        initialGroupIndex={storyViewerIndex}
        currentUsername={currentUser?.username || "you"}
        onClose={() => setStoryViewerVisible(false)}
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

        <TouchableOpacity onPress={() => router.push("/pages/notifications/notification")}>
          <Bell style={styles.bell} size={26} color="#4e6376" />

          {count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {count > 99 ? "99+" : count}
              </Text>
            </View>
          )}

        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push("/pages/person/ProfileScreen")}>
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
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        removeClippedSubviews
        maxToRenderPerBatch={6}
        windowSize={7}
        initialNumToRender={4}
        refreshing={loading}
        onRefresh={loadAll}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          // paginatsiya kerak bo'lsa: fetchPosts(nextPage) shu yerga ulanadi
        }}
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
        renderItem={({ item: post, index }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <AnimatedPostWrapper index={index}>
              <PostCard
                post={post}
                onOpenModal={() => setOpenPost(post)}
                onLikeChange={handleLikeChange}
                activeId={visibleId}
              />
            </AnimatedPostWrapper>
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
          let isCenter = item.isCenter;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(item.href)}
              style={[styles.navItem, isCenter && styles.centerItem]}
            >
              <item.Icon
                color={isCenter ? "#010811" : item.active ? "#1541d3" : "#10130f"}
                size={isCenter ? 34 : 24}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}