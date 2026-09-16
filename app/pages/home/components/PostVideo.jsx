import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useHoldToCopy } from "../hooks/useHoldToCopy";
import { useVideoThumbnail } from "../hooks/useVideoThumbnail";
import { IconPlayMini } from "./icons";
import { styles } from "../styles/FeedStyles";

// Feed ichidagi video: thumbnail + play ikonasi, faqat `active` bo'lganda
// avtomatik ijro etadi (FlatList viewability orqali boshqariladi).
export function PostVideo({ uri, active, muted = true, posterUrl = "" }) {
  const [showPoster, setShowPoster] = useState(Boolean(posterUrl || uri));
  const { copyBadgeVisible, startHold, stopHold } = useHoldToCopy(uri);
  const { thumbUri } = useVideoThumbnail(uri, posterUrl);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    if (!player) return;
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  useEffect(() => {
    if (!uri) return;
    setShowPoster(true);
    const timer = setTimeout(() => setShowPoster(false), 800);
    return () => clearTimeout(timer);
  }, [uri]);

  const posterSource = thumbUri || posterUrl || "";

  const handlePress = () => {
    if (copyBadgeVisible) return;
    if (player.playing) player.pause();
    else player.play();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.videoWrap}
      onPressIn={startHold}
      onPressOut={stopHold}
      onPress={handlePress}
    >
      {showPoster && posterSource ? (
        <Image source={{ uri: posterSource }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      {!active && !copyBadgeVisible && (
        <View style={styles.playCircle}>
          <IconPlayMini size={22} />
        </View>
      )}
      {copyBadgeVisible ? (
        <View style={styles.copyBadge}>
          <Text style={styles.copyText}>Copy</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}