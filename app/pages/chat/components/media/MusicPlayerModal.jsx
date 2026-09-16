import React from "react";
import { Modal, View, Text, TouchableOpacity, Image } from "react-native";
import Slider from "@react-native-community/slider"; // npx expo install @react-native-community/slider
import { IconClose, IconSkipNext, IconSkipPrev, IconPlaySmall, IconPauseSmall, IconMusicNote } from "../../constants/icons";
import { formatDuration } from "../../utils/helpers";
import { styles } from "../../constants/styles";

// ════════════════════════════════════════════════════════════════════════════
//  MusicPlayerModal — to'liq boshqaruvli musiqa pleyeri UI.
//  Barcha ijro mantig'i hooks/useMusicPlayer.js'da; bu fayl FAQAT ko'rinish.
// ════════════════════════════════════════════════════════════════════════════

export default function MusicPlayerModal({ visible, onClose, theme, player }) {
  const { current, isPlaying, positionSec, durationSec, toggle, next, prev, seekTo, hasNext, hasPrev } = player;

  if (!current) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.playerOverlay}>
        <View style={[styles.playerCard, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={onClose} style={{ alignSelf: "flex-end", padding: 6 }}>
            <IconClose size={18} color={theme.sub} />
          </TouchableOpacity>

          {current.artwork ? (
            <Image source={{ uri: current.artwork }} style={styles.playerArtwork} />
          ) : (
            <View style={[styles.playerArtwork, { backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }]}>
              <IconMusicNote size={48} color={theme.accent} />
            </View>
          )}

          <Text style={[styles.playerTitle, { color: theme.text }]} numberOfLines={1}>
            {current.title || "Musiqa"}
          </Text>
          {current.artist ? (
            <Text style={[styles.playerArtist, { color: theme.sub }]} numberOfLines={1}>{current.artist}</Text>
          ) : null}

          <View style={styles.playerSeekRow}>
            <Text style={[styles.playerTimeText, { color: theme.sub }]}>{formatDuration(positionSec * 1000)}</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={durationSec || 1}
              value={positionSec}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
              onSlidingComplete={seekTo}
            />
            <Text style={[styles.playerTimeText, { color: theme.sub }]}>{formatDuration(durationSec * 1000)}</Text>
          </View>

          <View style={styles.playerControlsRow}>
            <TouchableOpacity onPress={prev} disabled={!hasPrev} style={{ opacity: hasPrev ? 1 : 0.35 }}>
              <IconSkipPrev size={30} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggle} style={[styles.playerPlayBtn, { backgroundColor: theme.accent }]}>
              {isPlaying ? <IconPauseSmall size={26} color="#fff" /> : <IconPlaySmall size={26} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={next} disabled={!hasNext} style={{ opacity: hasNext ? 1 : 0.35 }}>
              <IconSkipNext size={30} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 11, color: theme.sub, marginTop: 18, textAlign: "center" }}>
            Musiqa ekran o'chirilganda ham fonda davom etadi va qulf ekranida ko'rinadi.
          </Text>
        </View>
      </View>
    </Modal>
  );
}