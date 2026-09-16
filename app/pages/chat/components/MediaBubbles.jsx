import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  IconDocument,
  IconMusicNote,
  IconPauseSmall,
  IconPlaySmall,
} from "../constants/icons";
import { styles } from "../constants/styles";
import { formatDuration, formatFileSize } from "../utils/helpers";

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

/*
|--------------------------------------------------------------------------
| Global audio player
|--------------------------------------------------------------------------
| Bir vaqtning o'zida faqat bitta audio ishlashi uchun.
*/




/*
|--------------------------------------------------------------------------
| Audio / Voice Message
|--------------------------------------------------------------------------
*/

export function AudioMessageBubble({
  uri,
  duration,
  isMe,
  theme,
  label,
}) {
  const audioSource = uri ? { uri } : null;
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!player || !uri) return;
    try {
      player.replace({ uri });
    } catch (err) {
      console.error("[audio] replace source error:", err);
    }
  }, [player, uri]);

  const playing = status?.playing ?? false;

  const toggle = async () => {
    if (!uri || !player) {
      console.log("[audio] player/uri missing");
      return;
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      if (status?.playing) {
        player.pause();
        return;
      }

      if (status?.duration > 0 && status?.currentTime >= status.duration) {
        await player.seekTo(0);
      }

      player.play();
    } catch (err) {
      console.error("[audio] toggle error:", err);
    }
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.85}
      style={styles.audioBubbleRow}
    >
      {/* PLAY BUTTON */}
      <View
        style={[
          styles.audioPlayBtn,
          {
            backgroundColor: isMe
              ? "rgba(255,255,255,0.25)"
              : theme.accent,
          },
        ]}
      >
        {playing ? (
          <IconPauseSmall />
        ) : (
          <IconPlaySmall />
        )}
      </View>

      {/* AUDIO INFO */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isMe ? "#fff" : theme.text,
            }}
          >
            {label}
          </Text>
        ) : null}

        {/* WAVEFORM */}
        <View style={styles.waveRow}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 4 + ((i * 37) % 14),
                  backgroundColor: isMe
                    ? "rgba(255,255,255,0.6)"
                    : theme.sub,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* DURATION */}
      <Text
        style={{
          fontSize: 10,
          color: isMe
            ? "rgba(255,255,255,0.85)"
            : theme.sub,
          marginLeft: 6,
        }}
      >
        {formatDuration(duration)}
      </Text>
    </TouchableOpacity>
  );
}


/*
|--------------------------------------------------------------------------
| Music Message
|--------------------------------------------------------------------------
| Bu yerda audio ijro qilinmaydi.
| ChatScreen -> MusicPlayerModal ochadi.
|--------------------------------------------------------------------------
*/

export function MusicMessageBubble({
  title,
  artist,
  isMe,
  theme,
  onOpenPlayer,
}) {
  return (
    <TouchableOpacity
      onPress={onOpenPlayer}
      activeOpacity={0.85}
      style={styles.audioBubbleRow}
    >
      <View
        style={[
          styles.audioPlayBtn,
          {
            backgroundColor: isMe
              ? "rgba(255,255,255,0.25)"
              : theme.accent,
          },
        ]}
      >
        <IconMusicNote
          color={isMe ? "#fff" : theme.accent}
          size={16}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isMe ? "#fff" : theme.text,
          }}
        >
          {title || "Musiqa"}
        </Text>

        {artist ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: isMe ? "rgba(255,255,255,0.8)" : theme.sub,
            }}
          >
            {artist}
          </Text>
        ) : null}
      </View>

      <IconPlaySmall color={isMe ? "#fff" : theme.accent} />
    </TouchableOpacity>
  );
}


/*
|--------------------------------------------------------------------------
| File Message
|--------------------------------------------------------------------------
*/

export function FileMessageBubble({
  fileName,
  fileSize,
  isMe,
  theme,
  onOpen,
}) {
  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.85}
      style={styles.fileBubbleRow}
    >
      <View
        style={[
          styles.filesIconWrap,
          {
            backgroundColor: isMe
              ? "rgba(255,255,255,0.25)"
              : theme.card,
          },
        ]}
      >
        <IconDocument color={isMe ? "#fff" : theme.accent} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isMe ? "#fff" : theme.text,
          }}
        >
          {fileName || "Fayl"}
        </Text>

        {fileSize ? (
          <Text
            style={{
              fontSize: 11,
              color: isMe ? "rgba(255,255,255,0.85)" : theme.sub,
            }}
          >
            {formatFileSize(fileSize)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}


/*
|--------------------------------------------------------------------------
| Video Message
|--------------------------------------------------------------------------
*/

export function VideoMessageBubble({ uri, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.videoBubble}
    >
      {uri ? null : null}

      <View style={styles.videoPlayOverlay}>
        <IconPlaySmall size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

