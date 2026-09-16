import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { api as API } from "../../api/server"; // loyihangizga qarab yo'lni moslang
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from "react-native";

import Avatar from "./components/Avatar";
import { ProfileSkeleton } from "./components/Skeleton";
import PostModal from "./components/PostModal";
import PinchZoomGrid from "./components/PinchZoomGrid";
import {
  IconSettings, IconGrid, IconVideo, IconSaved, IconImagePlaceholder,
  IconHome, IconLogoGlobe, IconCreate, IconMovie, IconPerson,
} from "./constants/icons";
import { fmtNum } from "./utils/helpers";
import { styles } from "./styles/styles";

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PROFILE SCREEN
//  Original mantiq (state'lar, fetch funksiyalar, JSX) o'zgarishsiz qoldi —
//  faqat: 1) ikonka/avatar/skeleton/modal/helper/styles alohida fayllarga
//  chiqarildi, 2) grid endi PinchZoomGrid komponenti orqali renderlanadi
//  (ikki barmoq bilan kattalashtirish/kichiklashtirish imkoniyati bilan).
// ════════════════════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("grid");
  const [openPost, setOpenPost] = useState(null);

  // Bir vaqtning o'zida faqat bitta video ijro etiladi (id bo'yicha).
  const [playingId, setPlayingId] = useState(null);
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
  const [myVideos, setMyVideos] = useState([]);
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    apiPerson();
    fetchMyPosts();
    fetchMyVideos();
    fetchSavedItems();
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

  const fetchMyVideos = async () => {
    setVideosLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("user_id");
      const username = await AsyncStorage.getItem("login_username");
      if (!token || !id) return;
      const res = await API.get(`/videos/user-videos/${username}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.status === 200) {
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

  const fetchSavedItems = async () => {
    setSavedLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("user_id");
      if (!token || !id) return;
      const res = await API.get(`/save/my-save/${id}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.status === 200) {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
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
    { href: "/pages/home/FeedScreen", active: false, Icon: IconHome },
    { href: "/pages/message", active: false, Icon: IconLogoGlobe },
    { href: "/pages/create/CreatePostScreen", active: false, Icon: IconCreate },
    { href: "/pages/reels/reels", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: true, Icon: IconPerson },
  ];

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
        <TouchableOpacity onPress={() => router.push("/utils/settings")} style={styles.settingsBtn}>
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
              onPress={() => router.push("/pages/profile/editProfile")}
              style={styles.editProfileBtn}
            >
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/pages/utils/myPosts")}
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

      {/* YANGI: pinch-zoom haqida qisqa maslahat */}
      <Text style={styles.zoomHint}>Kattalashtirish/kichiklashtirish uchun ikki barmoq bilan siqing yoki cho'zing</Text>
    </>
  );

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
        <PinchZoomGrid
          data={gridData}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState(emptyText, activeTab === "grid")}
          playingId={playingId}
          setPlayingId={setPlayingId}
          videoRefs={videoRefs}
          onOpenPost={setOpenPost}
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