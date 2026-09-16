import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CommentsSheet } from "./ComentsSheet";
import { ShareSheet } from "./ShareSheet";
import { MoreOptionsSheet } from "./MoreOptionsSheet";
import { fetchUserAvatar, toggleVideoLike } from "../api/ReelsApi";
import { formatCount } from "../utils/formatters";
import { styles } from "../styles/ReelsStyles";
import { API_HOST_WEB } from "../../../api/ip";


// ═══════════════════════════════════════════════════════════════════════
//  BITTA VIDEO KARTOCHKASI
// ═══════════════════════════════════════════════════════════════════════
export function ReelItem({ video, isActive }) {
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
  const [avatar, setAvatar] = useState(null);

  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  // Video faqat ekranda ko'rinib turganda ijro etiladi —
  // shuning uchun ekrandan chiqib ketganda avtomatik to'xtaydi va boshiga qaytadi.
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
  }, [isActive]);

  // ── TUZATILDI: asl koddagi avatar yuklash logikasi component render
  // paytida (useEffect'siz, await'siz) chaqirilar edi — bu hech qachon
  // to'g'ri ishlamas edi va har render'da qayta so'rov yuborar edi.
  // Endi bitta marta, videoning muallifi (`video.user`) o'zgarganda,
  // to'g'ri async/await bilan yuklanadi.
  useEffect(() => {
    let cancelled = false;
    if (!video.user) return undefined;

    fetchUserAvatar(video.user)
      .then((url) => { if (!cancelled) setAvatar(url); })
      .catch((err) => console.log("Avatar load error:", err?.response?.data || err?.message));

    return () => { cancelled = true; };
  }, [video.user]);

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    try {
      await toggleVideoLike(video);
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
            source={{ uri: avatar ||  `${API_HOST_WEB}media/avatars/user/no_user/avatar.png` }}
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
            source={{ uri: avatar || `${API_HOST_WEB}media/avatars/user/no_user/avatar.png` }}
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