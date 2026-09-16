import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { FlatList, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { IconClose, IconPauseSmall, IconPlaySmall, IconSkipNext, IconSkipPrev } from "../../constants/icons";
import { SCREEN_W, styles } from "../../constants/styles";

// ⚠️ ESLATMA: expo-video hozircha "experimental" va Expo Go'da ISHLAMAYDI —
// faqat development build'da (npx expo install expo-video, keyin
// `npx expo run:android` / `npx expo run:ios` yoki EAS Build).

// Har bir video sahifasi o'z VideoPlayer instansiyasiga ega (bu — rules of
// hooks talabiga to'g'ri keladi, chunki VideoPage — alohida komponent).
function VideoPage({ uri, isActive, onPausedChange, onNext, onPrev }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (isActive) { player.play(); setPaused(false); onPausedChange(false); }
    else { player.pause(); }
  }, [isActive]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setPaused(true);
      onPausedChange(true);
    } else {
      player.play();
      setPaused(false);
      onPausedChange(false);
    }
  };

  return (
    <View style={styles.viewerPage}>
      <TouchableOpacity activeOpacity={1} onPress={togglePlay} style={styles.viewerPage}>
        <VideoView player={player} style={styles.viewerVideo} contentFit="contain" nativeControls={false} />
      </TouchableOpacity>

      {isActive ? (
        <View style={styles.viewerControls}>
          <TouchableOpacity style={styles.viewerControlBtn} onPress={onPrev} activeOpacity={0.8}>
            <IconSkipPrev size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewerControlBtnLarge} onPress={togglePlay} activeOpacity={0.8}>
            {paused ? <IconPlaySmall size={18} color="#fff" /> : <IconPauseSmall size={18} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewerControlBtn} onPress={onNext} activeOpacity={0.8}>
            <IconSkipNext size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VideoGalleryViewer — swipe qilib videodan videoga o'tish (Telegramdagidek)
//  + JORIY video PAUZA qilinganda pastda "keyingi videolar" ro'yxati chiqadi.
//  Video davom etayotganda ro'yxat yashiriladi (ekran to'liq video uchun bo'shaydi).
// ════════════════════════════════════════════════════════════════════════════

export default function VideoGalleryViewer({ videos, index, onClose, onChangeIndex }) {
  const [pausedForIndex, setPausedForIndex] = useState(null);

  const visible = index !== null && index !== undefined && videos.length > 0;
  if (!visible) return null;

  const showBottomList = pausedForIndex === index;
  const goToIndex = (offset) => {
    const nextIndex = (index + offset + videos.length) % videos.length;
    onChangeIndex(nextIndex);
    setPausedForIndex(null);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerOverlay}>
        <TouchableOpacity style={styles.viewerCloseBtn} onPress={onClose}>
          <IconClose size={20} color="#fff" />
        </TouchableOpacity>
        {videos.length > 1 ? (
          <Text style={styles.viewerCounter}>{index + 1} / {videos.length}</Text>
        ) : null}

        <FlatList
          data={videos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => String(item.id || i)}
          initialScrollIndex={Math.min(index, videos.length - 1)}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            onChangeIndex(newIndex);
            setPausedForIndex(null); // yangi videoga o'tildi — avtomatik ijro, ro'yxat yashiriladi
          }}
          renderItem={({ item, index: i }) => (
            <VideoPage
              uri={item.media_url}
              isActive={i === index}
              onPausedChange={(isPaused) => setPausedForIndex(isPaused ? i : null)}
              onNext={() => goToIndex(1)}
              onPrev={() => goToIndex(-1)}
            />
          )}
        />

        {/* 🆕 Video pauza qilinganda pastda chiqadigan "keyingi videolar" ro'yxati */}
        {showBottomList && videos.length > 1 ? (
          <View style={styles.bottomStripWrap}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={videos}
              keyExtractor={(item, i) => String(item.id || i)}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
              renderItem={({ item, index: i }) => (
                <TouchableOpacity
                  onPress={() => { onChangeIndex(i); setPausedForIndex(null); }}
                  style={[styles.bottomThumb, i === index && styles.bottomThumbActive]}
                >
                  <Image source={{ uri: item.thumbnail || item.media_url }} style={styles.bottomThumbImg} />
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}