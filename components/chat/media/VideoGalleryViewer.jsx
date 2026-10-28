import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  IconClose,
  IconPauseSmall,
  IconPlaySmall,
  IconSkipNext,
  IconSkipPrev,
} from "../../../constants/chat/icons";

import {
  SCREEN_W,
  styles,
} from "../../../styles/chat/styles";

const RED = "#ff6e30";

// ======================================================
// HELPERS
// ======================================================

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    seconds = 0;
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// ======================================================
// VIDEO PAGE
// ======================================================

function VideoPage({
  uri,
  isActive,
  onPausedChange,
  onNext,
  onPrev,
}) {
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.25;
  });

  // Video vaqti va davomiyligini kuzatish
  useEffect(() => {
    const updateTime = (event) => {
      setCurrentTime(event.currentTime ?? 0);

      const videoDuration = Number(player.duration);

      if (
        Number.isFinite(videoDuration) &&
        videoDuration > 0
      ) {
        setDuration(videoDuration);
      }
    };

    const updateSource = (event) => {
      const videoDuration = Number(event.duration);

      setDuration(
        Number.isFinite(videoDuration) &&
          videoDuration > 0
          ? videoDuration
          : 0
      );

      setCurrentTime(0);
    };

    const timeSubscription = player.addListener(
      "timeUpdate",
      updateTime
    );

    const sourceSubscription = player.addListener(
      "sourceLoad",
      updateSource
    );

    return () => {
      timeSubscription.remove();
      sourceSubscription.remove();
    };
  }, [player]);

  // Faqat faol video ijro etiladi
  useEffect(() => {
    if (isActive) {
      player.play();
      setPaused(false);
      onPausedChange(false);
    } else {
      player.pause();
    }
  }, [isActive, player, onPausedChange]);

  // Play / pause
  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
      setPaused(true);
      onPausedChange(true);
    } else {
      player.play();
      setPaused(false);
      onPausedChange(false);
    }
  }, [player, onPausedChange]);

  // Progress chizig'ini bosib videoning kerakli joyiga o'tish
  const seekToPosition = useCallback(
    (event) => {
      if (!duration || !progressWidth) return;

      const x = Math.max(
        0,
        Math.min(
          event.nativeEvent.locationX,
          progressWidth
        )
      );

      const nextTime = (x / progressWidth) * duration;

      player.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration, progressWidth, player]
  );

  const progress =
    duration > 0
      ? Math.min(currentTime / duration, 1)
      : 0;

  return (
    <View style={styles.viewerPage}>
      {/* Video yuzasi va bosish boshqaruvi */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: "#000000",
            overflow: "hidden",
          },
        ]}
      >
        <VideoView
          player={player}
          style={styles.viewerVideo}
          contentFit="contain"
          nativeControls={false}
          surfaceType="textureView"
        />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={togglePlay}
        />
      </View>

      {/* Pauzadagi markaziy play tugmasi */}
      {isActive && paused && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={togglePlay}
          style={{
            position: "absolute",
            alignSelf: "center",
            top: "42%",
            width: 78,
            height: 78,
            borderRadius: 39,
            backgroundColor: "rgba(0,0,0,0.62)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <IconPlaySmall size={36} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Pastki boshqaruv paneli */}
      {isActive && (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 24,
            zIndex: 10,
          }}
        >
          {/* Vaqt */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
              }}
            >
              {formatTime(currentTime)}
            </Text>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
              }}
            >
              -{formatTime(Math.max(0, duration - currentTime))}
            </Text>
          </View>

          {/* Progress chizig'i */}
          <Pressable
            onLayout={(event) => {
              setProgressWidth(
                event.nativeEvent.layout.width
              );
            }}
            onPress={seekToPosition}
            style={{
              height: 24,
              justifyContent: "center",
              marginBottom: 12,
            }}
            accessibilityRole="adjustable"
            accessibilityLabel="Video progress"
          >
            <View
              style={{
                height: 4,
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.35)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  backgroundColor: RED,
                  borderRadius: 4,
                }}
              />
            </View>

            {/* Progress nuqtasi */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: `${progress * 100}%`,
                marginLeft: -6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: RED,
                borderWidth: 2,
                borderColor: "#FFFFFF",
              }}
            />
          </Pressable>

          {/* Oldingi / pause / keyingi */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 28,
            }}
          >
            <TouchableOpacity
              onPress={onPrev}
              activeOpacity={0.7}
              style={controlStyles.sideButton}
              accessibilityLabel="Oldingi video"
            >
              <IconSkipPrev
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              activeOpacity={0.8}
              style={controlStyles.playButton}
              accessibilityLabel={
                paused ? "Videoni ijro etish" : "Videoni pauza qilish"
              }
            >
              {paused ? (
                <IconPlaySmall
                  size={25}
                  color="#202124"
                />
              ) : (
                <IconPauseSmall
                  size={25}
                  color="#202124"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              activeOpacity={0.7}
              style={controlStyles.sideButton}
              accessibilityLabel="Keyingi video"
            >
              <IconSkipNext
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ======================================================
// VIDEO GALLERY VIEWER
// ======================================================

export default function VideoGalleryViewer({
  videos = [],
  index,
  onClose,
  onChangeIndex,
}) {
  const [pausedForIndex, setPausedForIndex] =
    useState(null);

  const videoListRef = useRef(null);
  const thumbnailListRef = useRef(null);

  const visible =
    index !== null &&
    index !== undefined &&
    videos.length > 0;

  const safeIndex = visible
    ? Math.max(0, Math.min(index, videos.length - 1))
    : 0;

  const showBottomList =
    pausedForIndex === safeIndex &&
    videos.length > 1;

  // Kerakli videoga o'tish
  const goToIndex = useCallback(
    (requestedIndex) => {
      if (!videos.length) return;

      const target =
        (requestedIndex + videos.length) %
        videos.length;

      videoListRef.current?.scrollToIndex({
        index: target,
        animated: false,
      });

      onChangeIndex(target);
      setPausedForIndex(null);
    },
    [videos.length, onChangeIndex]
  );

  const closeViewer = useCallback(() => {
    setPausedForIndex(null);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeViewer}
    >
      <View
        style={[
          styles.viewerOverlay,
          { backgroundColor: "#000000" },
        ]}
      >
        {/* Yopish tugmasi */}
        <TouchableOpacity
          style={styles.viewerCloseBtn}
          onPress={closeViewer}
          activeOpacity={0.8}
          accessibilityLabel="Videoni yopish"
        >
          <IconClose size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Video raqami */}
        {videos.length > 1 && (
          <Text
            style={[
              styles.viewerCounter,
              { color: "#FFFFFF" },
            ]}
          >
            {safeIndex + 1} / {videos.length}
          </Text>
        )}

        {/* Asosiy video ro'yxati */}
        <FlatList
          ref={videoListRef}
          data={videos}
          horizontal
          pagingEnabled
          scrollEnabled={videos.length > 1}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) =>
            String(item.id ?? i)
          }
          initialScrollIndex={safeIndex}
          getItemLayout={(_, i) => ({
            length: SCREEN_W,
            offset: SCREEN_W * i,
            index: i,
          })}
          extraData={safeIndex}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.max(
              0,
              Math.min(
                Math.round(
                  event.nativeEvent.contentOffset.x /
                    SCREEN_W
                ),
                videos.length - 1
              )
            );

            if (nextIndex !== safeIndex) {
              onChangeIndex(nextIndex);
              setPausedForIndex(null);
            }
          }}
          renderItem={({ item, index: i }) => (
            <VideoPage
              uri={item.media_url}
              isActive={i === safeIndex}
              onPausedChange={(isPaused) => {
                setPausedForIndex(
                  isPaused ? i : null
                );
              }}
              onNext={() =>
                goToIndex(safeIndex + 1)
              }
              onPrev={() =>
                goToIndex(safeIndex - 1)
              }
            />
          )}
        />

        {/* Pauza holatidagi preview ro'yxati */}
        {showBottomList && (
          <View
            style={[
              styles.bottomStripWrap,
              {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                paddingVertical: 10,
                backgroundColor: "rgba(0,0,0,0.88)",
                zIndex: 20,
              },
            ]}
          >
            <FlatList
              ref={thumbnailListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={videos}
              keyExtractor={(item, i) =>
                String(item.id ?? i)
              }
              contentContainerStyle={{
                paddingHorizontal: 12,
                gap: 8,
              }}
              renderItem={({ item, index: i }) => (
                <TouchableOpacity
                  onPress={() => goToIndex(i)}
                  activeOpacity={0.8}
                  style={[
                    styles.bottomThumb,
                    i === safeIndex &&
                      styles.bottomThumbActive,
                    {
                      borderWidth:
                        i === safeIndex ? 2 : 1,
                      borderColor:
                        i === safeIndex
                          ? "#3EFF30"
                          : "rgba(255,255,255,0.25)",
                      overflow: "hidden",
                    },
                  ]}
                  accessibilityLabel={`Video ${i + 1}`}
                >
                  <Image
                    source={{
                      uri:
                        item.thumbnail ||
                        item.media_url,
                    }}
                    style={styles.bottomThumbImg}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

// ======================================================
// CONTROL STYLES
// ======================================================

const controlStyles = StyleSheet.create({
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
});