import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { Avatar } from "./Avatar";
import { getInitials } from "../utils/Formatters";
import { SEEN_STORAGE_KEY, UNSEEN_GRADIENT, SEEN_GRADIENT } from "../constants/FeedConstants";
import { styles } from "../styles/FeedStyles";

// ═══════════════════════════════════════════════════════════════════════
//  ANIMATED STORIES — Instagram uslubidagi gradient halqalar qatori
// ═══════════════════════════════════════════════════════════════════════
//
// Bu komponent faqat UI va "ko'rilgan/ko'rilmagan" holatini boshqaradi.
// Halqa bosilganda nima ochilishini (StoryViewer yoki profil sahifasi)
// `onOpenStory(user, isMine)` orqali chaqiruvchi (FeedScreen) belgilaydi.
export function AnimatedStories({ currentUser, users = [], onOpenStory }) {
  const [seenIds, setSeenIds] = useState(new Set());

  useEffect(() => {
    AsyncStorage.getItem(SEEN_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try { setSeenIds(new Set(JSON.parse(raw))); } catch {}
    });
  }, []);

  const markSeen = async (id) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const handlePress = (user, isMine) => {
    if (!isMine) markSeen(user.id);
    onOpenStory?.(user, isMine);
  };

  const items = [
    ...(currentUser ? [{ ...currentUser, __isMine: true }] : []),
    ...users.filter((u) => String(u.id) !== String(currentUser?.id)),
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRowNew}>
      {items.map((u, i) => {
        const isMine = !!u.__isMine;
        const seen = !isMine && seenIds.has(u.id);
        const gradientColors = isMine ? ["#0969da", "#0969da"] : seen ? SEEN_GRADIENT : UNSEEN_GRADIENT;
        const avatarSrc = u.avatar || u.profile_picture || u.image || null;
        const isOnline = !!u.is_online;

        return (
          <Animated.View key={u.id || i} entering={FadeIn.delay(i * 40).duration(300)}>
            <TouchableOpacity onPress={() => handlePress(u, isMine)} activeOpacity={0.85} style={styles.storyItemNew}>
              <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.storyRingNew}>
                <View style={styles.storyRingInnerNew}>
                  <Avatar src={avatarSrc} initials={getInitials(u.full_name || u.username)} size={56} index={i} />
                  {isMine && (
                    <View style={styles.plusBadge}>
                      <Text style={styles.plusText}>+</Text>
                    </View>
                  )}
                  {isOnline && !isMine && <View style={styles.onlineDot} />}
                </View>
              </LinearGradient>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {isMine ? "Your story" : u.username}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}