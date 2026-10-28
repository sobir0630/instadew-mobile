import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_HOST_WEB } from "../../api/api/ip";
import { fetchUserAvatar, toggleVideoLike } from "../../api/reels/ReelsApi";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../constants/reels/ReelsConstants";
import { styles } from "../../styles/reels/ReelsStyles";
import { formatCount } from "../../utils/reels/formatters";
import { shouldHandleDoubleTap } from "../../utils/reels/tapLogic";
import { CommentsSheet } from "./ComentsSheet";
import { MoreOptionsSheet } from "./MoreOptionsSheet";
import { ShareSheet } from "./ShareSheet";


// ═══════════════════════════════════════════════════════════════════════
//  BITTA VIDEO KARTOCHKASI
// ═══════════════════════════════════════════════════════════════════════
export function ReelItem({ video, isActive }) {
  const router = useRouter();
  
  const player = useVideoPlayer(
    video.video_url || video.video || null,
    (player) => {
      player.loop = true;
      player.muted = false;
    }
  );

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
  const [burst, setBurst] = useState(null);

  const [heartScale] = useState(() => new Animated.Value(0));
  const [commentScale] = useState(() => new Animated.Value(0));
  const lastTap = useRef(0);
  const singleTapTimer = useRef(null);
  const burstIdRef = useRef(0);

  // Video faqat ekranda ko'rinib turganda ijro etiladi —
  // shuning uchun ekrandan chiqib ketganda avtomatik to'xtaydi va boshiga qaytadi.
  useEffect(() => {
    if (!player) return;

    if (!isActive) {
      player.pause();
      return;
    }

    if (isPaused) {
      player.pause();
      return;
    }

    player.play();
  }, [isActive, isPaused, player]);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
    };
  }, []);

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

  const showHeartAnimation = (x, y) => {
    burstIdRef.current += 1;
    setBurst({ x, y, id: burstIdRef.current });
    heartScale.setValue(0);
    commentScale.setValue(0);

    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(heartScale, { toValue: 0, duration: 420, delay: 180, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.spring(commentScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(commentScale, { toValue: 0, duration: 350, delay: 220, useNativeDriver: true }),
    ]).start(() => setBurst(null));
  };

  const handleVideoTap = (event) => {
    const now = event?.nativeEvent?.timestamp ?? 0;
    const x = event?.nativeEvent?.locationX ?? SCREEN_WIDTH / 2;
    const y = event?.nativeEvent?.locationY ?? SCREEN_HEIGHT / 2;

    if (shouldHandleDoubleTap(now, lastTap.current, 280)) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }

      lastTap.current = 0;
      if (!liked) toggleLike();
      showHeartAnimation(x, y);
      return;
    }

    lastTap.current = now;
    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current);
    }

    singleTapTimer.current = setTimeout(() => {
      togglePause();
    }, 220);
  };

  const togglePause = () => {
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
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleVideoTap}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </TouchableOpacity>

      {burst && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartOverlay,
              {
                left: burst.x,
                top: burst.y,
                opacity: heartScale,
                transform: [
                  { scale: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] }) },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={80} color="#fff" />
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.commentBurst,
              {
                left: burst.x + 38,
                top: burst.y + 24,
                opacity: commentScale,
                transform: [
                  { scale: commentScale.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) },
                ],
              },
            ]}
          >
            <Ionicons name="chatbubble" size={18} color="#fff" />
          </Animated.View>
        </>
      )}

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