import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { IconClose, IconHeart } from "./icons";
import { getInitials } from "../utils/Formatters";
import { toggleStoryLike, submitStoryComment } from "../api/StoryApi";
import { styles } from "../styles/StoryStyles";

const DEFAULT_DURATION = 5000; // rasm-storylar uchun standart davomiylik (ms)

// ═══════════════════════════════════════════════════════════════════════
//  STORY VIEWER — Instagram uslubidagi to'liq ekran story ko'ruvchi
// ═══════════════════════════════════════════════════════════════════════
//
// Props:
//   visible           — modal ko'rinishini boshqaradi
//   groups            — StoryGroup[] (api/storyApi.js -> fetchStoryGroups())
//   initialGroupIndex — qaysi foydalanuvchining storylaridan boshlash kerak
//   currentUsername   — joriy foydalanuvchi (comment yozganda ishlatiladi)
//   onClose           — yopilganda chaqiriladi
//
// Ichida: progress-barlar, tap bilan oldinga/orqaga o'tish, bosib turib
// pauza, video/rasm ko'rsatish, like va comment yuborish (hozircha
// api/storyApi.js dagi mock/lokal saqlash orqali — backend tayyor
// bo'lganda faqat o'sha faylni almashtirish kifoya).
export function StoryViewer({ visible, groups = [], initialGroupIndex = 0, currentUsername = "you", onClose }) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (visible) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
    }
  }, [visible, initialGroupIndex]);

  const group = groups[groupIndex];
  const story = group?.stories?.[storyIndex];

  useEffect(() => {
    if (story) {
      setLiked(!!story.is_liked);
      setLikeCount(story.likes_count || 0);
    }
  }, [story?.id]);

  const duration = story?.duration || DEFAULT_DURATION;

  const goNextStory = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose?.();
    }
  }, [group, storyIndex, groupIndex, groups.length, onClose]);

  const goPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((g) => g - 1);
      setStoryIndex(Math.max(0, prevGroup.stories.length - 1));
    }
  }, [storyIndex, groupIndex, groups]);

  // Progress-taymer: har 50ms yangilanadi, tugagach keyingi storyga o'tadi.
  useEffect(() => {
    if (!visible || !story || paused) return undefined;
    setProgress(0);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current);
        goNextStory();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [visible, story?.id, paused, duration, goNextStory]);

  const isVideo = story?.media_type === "video";

  const player = useVideoPlayer(isVideo ? story.media_url : null);

  useEffect(() => {
    if (!player) return;

    player.loop = false;
    player.muted = false;

    if (isVideo && visible && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, isVideo, story?.id, visible, paused]);

  const handleLike = async () => {
    if (!story) return;
    const was = liked;
    const wasCount = likeCount;
    setLiked(!was);
    setLikeCount(was ? Math.max(0, wasCount - 1) : wasCount + 1);
    const res = await toggleStoryLike(story.id);
    if (res) {
      setLiked(res.is_liked);
      setLikeCount(res.likes_count);
    }
  };

  const handleSendComment = async () => {
    const t = commentText.trim();
    if (!t || !story) return;
    setCommentText("");
    await submitStoryComment(story.id, t, currentUsername);
  };

  if (!visible) return null;

  if (!group || !story) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconClose color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyStoryWrap}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.emptyStoryText}>Story topilmadi</Text>
          </View>
        </View>
      </Modal>
    );
  }

  const timeStr = story.created_at
    ? new Date(story.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        {/* Progress bars */}
        <View style={styles.progressRow}>
          {group.stories.map((s, i) => (
            <View key={s.id} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${i < storyIndex ? 100 : i === storyIndex ? progress * 100 : 0}%` },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              {group.user.avatar ? (
                <Image source={{ uri: group.user.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {getInitials(group.user.full_name || group.user.username)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>@{group.user.username}</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <IconClose color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Media */}
        <View style={styles.mediaArea}>
          {isVideo ? (
            <VideoView player={player} style={styles.media} contentFit="cover" nativeControls={false} />
          ) : (
            <Image source={{ uri: story.media_url }} style={styles.media} resizeMode="cover" />
          )}

          {/* Tap zonalari: chap = oldingi, o'ng = keyingi; bosib turish = pauza */}
          <TouchableOpacity
            style={styles.tapLeft}
            activeOpacity={1}
            onPress={goPrevStory}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
          />
          <TouchableOpacity
            style={styles.tapRight}
            activeOpacity={1}
            onPress={goNextStory}
            onLongPress={() => setPaused(true)}
            onPressOut={() => setPaused(false)}
          />
        </View>

        {likeCount > 0 ? (
          <Text style={styles.likeCountText}>{likeCount} ta layk</Text>
        ) : null}

        {/* Footer: comment + like */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.footer}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Xabar yuborish…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.commentInput}
            onSubmitEditing={handleSendComment}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          />
          <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
            <IconHeart filled={liked} color={liked ? "#ff3040" : "#fff"} size={26} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSendComment} disabled={!commentText.trim()} style={styles.sendBtn}>
            <Text style={[styles.sendText, { opacity: commentText.trim() ? 1 : 0.4 }]}>Yuborish</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}