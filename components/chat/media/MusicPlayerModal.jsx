import Slider from "@react-native-community/slider";
import {
    Download,
    ListMusic,
    Maximize2,
    MessageSquare,
    Minimize2,
    Repeat,
    Repeat1,
    Send,
    Shuffle,
    Volume2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Image,
    Linking,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
    useWindowDimensions,
} from "react-native";
import {
    IconClose,
    IconMusicNote,
    IconPauseSmall,
    IconPlaySmall,
    IconSkipNext,
    IconSkipPrev,
} from "../../../constants/chat/icons";
import { formatDuration } from "../../../utils/chat/helpers";

/* eslint-disable react-hooks/refs */

/* ------------------------------------------------------------------ */
/* Sozlamalar                                                          */
/* ------------------------------------------------------------------ */

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const REPEAT_MODES = ["off", "all", "one"];

// Mini-pleyer o'lchamlari va ekran chetidan masofalar (kerak bo'lsa o'zgartiring)
const MINI_W = 256;
const MINI_H = 60;
const EDGE = 12;
const TOP_INSET =
  Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 56;
const BOTTOM_INSET = 80; // pastki burchaklar chat yozish maydonidan yuqorida turishi uchun
const LONG_PRESS_MS = 220;
const DRAG_SLOP = 10;

const PLAYLIST_ROW_H = 54;
const MENU_ITEM_H = 48;
const MENU_W = 224;
const MENU_PAD = 6;
const MENU_ITEMS_COUNT = 3;
const MENU_H = MENU_ITEMS_COUNT * MENU_ITEM_H + MENU_PAD * 2;

/* ------------------------------------------------------------------ */
/* Yordamchi funksiyalar                                               */
/* ------------------------------------------------------------------ */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const trackSource = (t) => t?.uri || t?.url || t?.path || null;

const isSameTrack = (a, b) => {
  if (!a || !b) return false;
  if (a.id != null && b.id != null) return a.id === b.id;
  const sa = trackSource(a);
  const sb = trackSource(b);
  return !!sa && sa === sb;
};

const formatRate = (r) => `${r}x`;

const getCorners = (w, h) => {
  const left = EDGE;
  const right = Math.max(EDGE, w - MINI_W - EDGE);
  const top = TOP_INSET;
  const bottom = Math.max(top, h - MINI_H - BOTTOM_INSET);
  return [
    { x: left, y: top }, // 0: yuqori-chap
    { x: right, y: top }, // 1: yuqori-o'ng
    { x: left, y: bottom }, // 2: pastki-chap
    { x: right, y: bottom }, // 3: pastki-o'ng
  ];
};

/* ------------------------------------------------------------------ */
/* Kichik komponentlar                                                 */
/* ------------------------------------------------------------------ */

function Artwork({ uri, size, radius, theme, iconSize, style }) {
  const box = { width: size, height: size, borderRadius: radius };
  if (uri) {
    return <Image source={{ uri }} style={[box, style]} />;
  }
  return (
    <View
      style={[
        box,
        { backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <IconMusicNote size={iconSize} color={theme.accent} />
    </View>
  );
}

function DotsIcon({ color }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 3.5 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Mini-pleyer (suriladigan)                                           */
/* ------------------------------------------------------------------ */

function MiniPlayer({
  theme,
  current,
  isPlaying,
  canPrev,
  canNext,
  onToggle,
  onNext,
  onPrev,
  onExpand,
  onClose,
  cornerRef,
}) {
  const win = useWindowDimensions();
  const [area, setArea] = useState({ width: win.width, height: win.height });
  const corners = useMemo(() => getCorners(area.width, area.height), [area]);

  const areaRef = useRef(area);
  const cornersRef = useRef(corners);
  areaRef.current = area;
  cornersRef.current = corners;

  const initial = corners[cornerRef.current] || corners[3];
  const pan = useRef(new Animated.ValueXY(initial)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastPos = useRef({ ...initial });
  const startPos = useRef({ ...initial });

  const armedRef = useRef(false);
  const timerRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const springScale = (to) =>
    Animated.spring(scale, { toValue: to, friction: 7, useNativeDriver: true }).start();

  // Ekran o'lchami o'zgarganda (masalan burilganda) tanlangan burchakda qoladi
  useEffect(() => {
    const c = corners[cornerRef.current] || corners[3];
    lastPos.current = { ...c };
    Animated.spring(pan, { toValue: c, friction: 8, useNativeDriver: true }).start();
  }, [corners, cornerRef, pan]);

  useEffect(() => clearTimer, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => armedRef.current,
      onMoveShouldSetPanResponderCapture: () => armedRef.current,
      onPanResponderTerminationRequest: () => !armedRef.current,
      onPanResponderGrant: () => {
        startPos.current = { ...lastPos.current };
      },
      onPanResponderMove: (_, g) => {
        const { width, height } = areaRef.current;
        const x = clamp(startPos.current.x + g.dx, 0, Math.max(0, width - MINI_W));
        const y = clamp(startPos.current.y + g.dy, 0, Math.max(0, height - MINI_H));
        lastPos.current = { x, y };
        pan.setValue({ x, y });
      },
      onPanResponderRelease: () => finishDrag(),
      onPanResponderTerminate: () => finishDrag(),
    })
  ).current;

  function finishDrag() {
    armedRef.current = false;
    clearTimer();
    const list = cornersRef.current;
    const { x, y } = lastPos.current;
    let best = 0;
    let bestDist = Infinity;
    list.forEach((c, i) => {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    cornerRef.current = best;
    lastPos.current = { ...list[best] };
    Animated.spring(pan, { toValue: list[best], friction: 8, useNativeDriver: true }).start();
    springScale(1);
  }

  const onTouchStart = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    touchStart.current = { x: pageX, y: pageY };
    clearTimer();
    timerRef.current = setTimeout(() => {
      armedRef.current = true;
      timerRef.current = null;
      Vibration.vibrate(15);
      springScale(1.05);
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e) => {
    if (armedRef.current || !timerRef.current) return;
    const { pageX, pageY } = e.nativeEvent;
    const moved = Math.hypot(pageX - touchStart.current.x, pageY - touchStart.current.y);
    if (moved > DRAG_SLOP) clearTimer(); // oddiy bosish/surish — uzoq bosish emas
  };

  const onTouchEnd = () => {
    clearTimer();
    if (armedRef.current) {
      armedRef.current = false;
      springScale(1);
    }
  };

  const handleLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  };

  return (
    <View pointerEvents="box-none" style={styles.miniOverlay} onLayout={handleLayout}>
      <Animated.View
        {...panResponder.panHandlers}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={[
          styles.miniContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onExpand}
          activeOpacity={0.85}
          accessibilityLabel="To&apos;liq ekranda ochish"
        >
          <Artwork
            uri={current.artwork}
            size={44}
            radius={22}
            theme={theme}
            iconSize={20}
          />
        </TouchableOpacity>

        <View style={styles.miniControls}>
          <TouchableOpacity
            onPress={onPrev}
            disabled={!canPrev}
            style={[styles.miniBtn, { opacity: canPrev ? 1 : 0.35 }]}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
            accessibilityLabel="Oldingi qo'shiq"
          >
            <IconSkipPrev size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onToggle}
            style={[styles.miniBtn, styles.miniPlayBtn, { backgroundColor: theme.card }]}
            accessibilityLabel={isPlaying ? "To'xtatish" : "Ijro etish"}
          >
            {isPlaying ? (
              <IconPauseSmall size={22} color={theme.accent} />
            ) : (
              <IconPlaySmall size={22} color={theme.accent} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            disabled={!canNext}
            style={[styles.miniBtn, { opacity: canNext ? 1 : 0.35 }]}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
            accessibilityLabel="Keyingi qo'shiq"
          >
            <IconSkipNext size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.miniDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity
          onPress={onExpand}
          style={styles.miniSmallBtn}
          hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          accessibilityLabel="Kattalashtirish"
        >
          <Maximize2 size={17} color={theme.sub} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={styles.miniSmallBtn}
          hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          accessibilityLabel="Yopish"
        >
          <IconClose size={18} color={theme.sub} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Asosiy komponent                                                    */
/* ------------------------------------------------------------------ */

/**
 * Props:
 *  - visible, onClose, theme, player
 *  - onDownload(track)   — "Qurilmaga yuklash"
 *  - onSend(track)       — "Yuborish" (berilmasa tizimdagi Share ochiladi)
 *  - onShowInChat(track) — "Chatda ko'rsatish"
 *
 * player (majburiy): current, isPlaying, positionSec, durationSec,
 *                    toggle, next, prev, seekTo, hasNext, hasPrev
 * player (ixtiyoriy): playlist | queue, playTrack(track), stop(),
 *                     rate/setRate(n), shuffle/setShuffle(bool),
 *                     repeatMode/setRepeatMode("off" | "all" | "one")
 */
export default function MusicPlayerModal({
  visible,
  onClose,
  theme,
  player,
  onDownload,
  onSend,
  onShowInChat,
}) {
  const {
    current,
    isPlaying,
    positionSec,
    durationSec,
    toggle,
    next,
    prev,
    seekTo,
    hasNext,
    hasPrev,
  } = player || {};

  const [isMinimized, setIsMinimized] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [topBarBottom, setTopBarBottom] = useState(64);
  const [controlsY, setControlsY] = useState(null);

  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState("off");
  const [localRate, setLocalRate] = useState(1);

  const miniCornerRef = useRef(3); // 0..3 — mini-pleyer burchagi, ochib-yopganda eslab qoladi
  const artScale = useRef(new Animated.Value(isPlaying ? 1 : 0.9)).current;

  const shuffle = player?.shuffle ?? localShuffle;
  const repeatMode = player?.repeatMode ?? localRepeat;
  const rate = player?.rate ?? localRate;
  const hasCurrent = !!current;

  const playlist = useMemo(() => {
    const list = player?.playlist ?? player?.queue;
    if (Array.isArray(list) && list.length) return list;
    return current ? [current] : [];
  }, [player?.playlist, player?.queue, current]);

  const currentIndex = useMemo(
    () => playlist.findIndex((t) => isSameTrack(t, current)),
    [playlist, current]
  );

  const playTrack = player?.playTrack;
  const shuffleFallback = !player?.setShuffle && !!playTrack && playlist.length > 1;
  const canNext = !!hasNext || (shuffle && shuffleFallback);
  const canPrev = !!hasPrev;

  /* ---------- effektlar ---------- */

  useEffect(() => {
    if (visible) {
      console.log("[MusicPlayerModal] modal opened", {
        visible,
        title: current?.title,
        artist: current?.artist,
        uri: current?.uri,
        queueLength: playlist.length,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMinimized(false);
    }
  }, [visible, current?.title, current?.artist, current?.uri, playlist.length]);

  useEffect(() => {
    if (!hasCurrent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMinimized(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaylistOpen(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMenuOpen(false);
    }
  }, [hasCurrent]);

  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1 : 0.9,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, artScale]);

  /* ---------- amallar ---------- */

  const closePopovers = useCallback(() => {
    setPlaylistOpen(false);
    setMenuOpen(false);
  }, []);

  const handleMinimize = useCallback(() => {
    console.log("[MusicPlayerModal] minimized by user", {
      title: current?.title,
      artist: current?.artist,
    });
    closePopovers();
    setIsMinimized(true);
  }, [closePopovers, current?.title, current?.artist]);

  const handleExpand = useCallback(() => {
    console.log("[MusicPlayerModal] expanded from mini player", {
      title: current?.title,
      artist: current?.artist,
    });
    setIsMinimized(false);
  }, [current?.title, current?.artist]);

  const handleCloseFull = useCallback(() => {
    console.log("[MusicPlayerModal] full modal closed", {
      title: current?.title,
      artist: current?.artist,
    });
    closePopovers();
    onClose?.();
  }, [closePopovers, onClose, current?.title, current?.artist]);

  const handleCloseMini = useCallback(() => {
    console.log("[MusicPlayerModal] mini player closed", {
      title: current?.title,
      artist: current?.artist,
    });
    setIsMinimized(false);
    try {
      player?.stop?.();
    } catch {
      console.error("[MusicPlayerModal] stop on close failed");
    }
    onClose?.();
  }, [player, onClose, current?.title, current?.artist]);

  const handleNext = useCallback(() => {
    if (shuffle && shuffleFallback) {
      const others = playlist.filter((t) => !isSameTrack(t, current));
      if (others.length) {
        playTrack(others[Math.floor(Math.random() * others.length)]);
        return;
      }
    }
    next?.();
  }, [shuffle, shuffleFallback, playlist, current, playTrack, next]);

  const handleToggleShuffle = useCallback(() => {
    const v = !shuffle;
    setLocalShuffle(v);
    player?.setShuffle?.(v);
  }, [shuffle, player]);

  const handleCycleRepeat = useCallback(() => {
    const idx = REPEAT_MODES.indexOf(repeatMode);
    const m = REPEAT_MODES[(idx + 1) % REPEAT_MODES.length];
    setLocalRepeat(m);
    player?.setRepeatMode?.(m);
  }, [repeatMode, player]);

  const handleCycleRate = useCallback(() => {
    const idx = RATES.indexOf(rate);
    const r = RATES[(idx + 1) % RATES.length];
    setLocalRate(r);
    player?.setRate?.(r);
  }, [rate, player]);

  const handleSelectTrack = useCallback(
    (track) => {
      if (isSameTrack(track, current)) return;
      playTrack?.(track);
    },
    [current, playTrack]
  );

  const runMenuAction = useCallback(
    async (key) => {
      setMenuOpen(false);
      if (!current) return;
      try {
        if (key === "download") {
          if (onDownload) {
            await onDownload(current);
          } else {
            const src = trackSource(current);
            if (src && /^https?:\/\//i.test(src)) {
              await Linking.openURL(src);
            } else {
              Alert.alert("Yuklash", "Yuklash funksiyasi hali ulanmagan.");
            }
          }
        } else if (key === "send") {
          if (onSend) {
            await onSend(current);
          } else {
            const src = trackSource(current);
            const message = [current.title, current.artist, src]
              .filter(Boolean)
              .join(" — ");
            await Share.share({ message: message || "Musiqa" });
          }
        } else if (key === "chat") {
          onShowInChat?.(current);
          handleMinimize(); // chat ko'rinib turishi uchun pleyerni kichraytiramiz
        }
      } catch {
        Alert.alert("Xatolik", "Amalni bajarib bo'lmadi. Qaytadan urinib ko'ring.");
      }
    },
    [current, onDownload, onSend, onShowInChat, handleMinimize]
  );

  /* ---------- renderlar ---------- */

  const renderPlaylistItem = useCallback(
    ({ item }) => {
      const active = isSameTrack(item, current);
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelectTrack(item)}
          style={[
            styles.playlistRow,
            active && { backgroundColor: theme.card },
          ]}
        >
          <Artwork
            uri={item.artwork}
            size={36}
            radius={8}
            theme={theme}
            iconSize={16}
          />
          <View style={styles.playlistInfo}>
            <Text
              numberOfLines={1}
              style={[
                styles.playlistTitle,
                { color: active ? theme.accent : theme.text },
              ]}
            >
              {item.title || "Musiqa"}
            </Text>
            <Text numberOfLines={1} style={[styles.playlistArtist, { color: theme.sub }]}>
              {item.artist || "Noma'lum"}
            </Text>
          </View>
          {active ? <Volume2 size={16} color={theme.accent} /> : null}
        </TouchableOpacity>
      );
    },
    [current, theme, handleSelectTrack]
  );

  if (!current) return null;

  if (isMinimized) {
    return (
      <MiniPlayer
        theme={theme}
        current={current}
        isPlaying={isPlaying}
        canPrev={canPrev}
        canNext={canNext}
        onToggle={toggle}
        onNext={handleNext}
        onPrev={prev}
        onExpand={handleExpand}
        onClose={handleCloseMini}
        cornerRef={miniCornerRef}
      />
    );
  }

  const maxSec = Math.max(durationSec || 0, 1);
  const shownSec = clamp(seeking ? seekValue : positionSec || 0, 0, maxSec);
  const popoverOpen = playlistOpen || menuOpen;
  const menuTop = Math.max(8, (controlsY ?? 320) - MENU_H - 8);

  const menuItems = [
    { key: "download", label: "Qurilmaga yuklash", Icon: Download },
    { key: "send", label: "Yuborish", Icon: Send },
    { key: "chat", label: "Chatda ko'rsatish", Icon: MessageSquare },
  ];

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatActive = repeatMode !== "off";
  const rateActive = rate !== 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleMinimize}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleMinimize} />

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Yuqori panel */}
          <View
            style={styles.topBar}
            onLayout={(e) =>
              setTopBarBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)
            }
          >
            <View style={styles.topLeft}>
              <TouchableOpacity
                onPress={handleMinimize}
                style={[styles.topBtn, { borderColor: theme.border }]}
                accessibilityLabel="Kichraytirish"
              >
                <Minimize2 size={19} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  setPlaylistOpen((v) => !v);
                }}
                style={[
                  styles.topBtn,
                  {
                    borderColor: playlistOpen ? theme.accent : theme.border,
                    marginLeft: 8,
                  },
                ]}
                accessibilityLabel="Qo'shiqlar ro'yxati"
              >
                <ListMusic
                  size={19}
                  color={playlistOpen ? theme.accent : theme.text}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.topLabel, { color: theme.sub }]} numberOfLines={1}>
              Hozir ijro etilmoqda
            </Text>

            <View style={styles.topRight}>
              <TouchableOpacity
                onPress={handleCloseFull}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Yopish"
              >
                <IconClose size={26} color={theme.sub} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Muqova */}
          <View style={styles.artworkWrap}>
            <Animated.View
              style={[styles.artworkShadow, { transform: [{ scale: artScale }] }]}
            >
              <Artwork
                uri={current.artwork}
                size={236}
                radius={24}
                theme={theme}
                iconSize={64}
              />
            </Animated.View>
          </View>

          {/* Nom va ijrochi */}
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {current.title || "Musiqa"}
            </Text>
            {current.artist ? (
              <Text style={[styles.artist, { color: theme.sub }]} numberOfLines={1}>
                {current.artist}
              </Text>
            ) : null}
          </View>

          {/* Slider */}
          <View style={styles.seekRow}>
            <Text style={[styles.timeText, { color: theme.sub }]}>
              {formatDuration(shownSec * 1000)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={maxSec}
              value={shownSec}
              disabled={!durationSec}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
              onSlidingStart={(v) => {
                setSeekValue(v);
                setSeeking(true);
              }}
              onValueChange={(v) => {
                if (seeking) setSeekValue(v);
              }}
              onSlidingComplete={(v) => {
                seekTo?.(v);
                setSeeking(false);
              }}
            />
            <Text style={[styles.timeText, { color: theme.sub }]}>
              {formatDuration((durationSec || 0) * 1000)}
            </Text>
          </View>

          {/* Qo'shimcha tugmalar: aralashtirish / takrorlash / tezlik */}
          <View style={styles.extraRow}>
            <TouchableOpacity
              onPress={handleToggleShuffle}
              style={[
                styles.chip,
                { borderColor: shuffle ? theme.accent : theme.border, backgroundColor: theme.card },
              ]}
              accessibilityLabel="Aralashtirish"
            >
              <Shuffle size={18} color={shuffle ? theme.accent : theme.sub} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCycleRepeat}
              style={[
                styles.chip,
                { borderColor: repeatActive ? theme.accent : theme.border, backgroundColor: theme.card },
              ]}
              accessibilityLabel="Takrorlash"
            >
              <RepeatIcon size={18} color={repeatActive ? theme.accent : theme.sub} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCycleRate}
              style={[
                styles.chip,
                styles.rateChip,
                { borderColor: rateActive ? theme.accent : theme.border, backgroundColor: theme.card },
              ]}
              accessibilityLabel="Ijro tezligi"
            >
              <Text
                style={[
                  styles.rateText,
                  { color: rateActive ? theme.accent : theme.sub },
                ]}
              >
                {formatRate(rate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Asosiy boshqaruv */}
          <View
            style={styles.controlsRow}
            onLayout={(e) => setControlsY(e.nativeEvent.layout.y)}
          >
            {/* Markazni tekislash uchun "⋮" tugmasi kengligidagi bo'sh joy */}
            <View style={styles.sideSlot} />

            <TouchableOpacity
              onPress={prev}
              disabled={!canPrev}
              style={[styles.ctrlBtn, { opacity: canPrev ? 1 : 0.35 }]}
              accessibilityLabel="Oldingi qo'shiq"
            >
              <IconSkipPrev size={32} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggle}
              style={[styles.playBtn, { backgroundColor: theme.accent }]}
              accessibilityLabel={isPlaying ? "To'xtatish" : "Ijro etish"}
            >
              {isPlaying ? (
                <IconPauseSmall size={30} color="#fff" />
              ) : (
                <IconPlaySmall size={30} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!canNext}
              style={[styles.ctrlBtn, { opacity: canNext ? 1 : 0.35 }]}
              accessibilityLabel="Keyingi qo'shiq"
            >
              <IconSkipNext size={32} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPlaylistOpen(false);
                setMenuOpen((v) => !v);
              }}
              style={styles.sideSlot}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              accessibilityLabel="Qo'shimcha amallar"
            >
              <DotsIcon color={menuOpen ? theme.accent : theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, { color: theme.sub }]}>
            Musiqa ekran o&apos;chirilganda ham fonda davom etadi.
          </Text>

          {/* Popoverlar (eng oxirida — hamma narsaning ustida) */}
          {popoverOpen ? (
            <Pressable style={StyleSheet.absoluteFill} onPress={closePopovers} />
          ) : null}

          {playlistOpen ? (
            <View
              style={[
                styles.popover,
                styles.playlistPopover,
                {
                  top: topBarBottom + 6,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.playlistHeader}>
                <Text style={[styles.playlistHeaderText, { color: theme.text }]}>
                  Qo&apos;shiqlar
                </Text>
                <Text style={[styles.playlistCount, { color: theme.sub }]}>
                  {playlist.length}
                </Text>
              </View>
              <FlatList
                data={playlist}
                keyExtractor={(item, i) => String(item.id ?? trackSource(item) ?? i)}
                renderItem={renderPlaylistItem}
                style={{ maxHeight: PLAYLIST_ROW_H * 5 }}
                getItemLayout={(_, index) => ({
                  length: PLAYLIST_ROW_H,
                  offset: PLAYLIST_ROW_H * index,
                  index,
                })}
                initialScrollIndex={currentIndex > 0 ? currentIndex : undefined}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                extraData={current}
              />
            </View>
          ) : null}

          {menuOpen ? (
            <View
              style={[
                styles.popover,
                styles.menuPopover,
                {
                  top: menuTop,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {menuItems.map(({ key, label, Icon }) => (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.7}
                  onPress={() => runMenuAction(key)}
                  style={styles.menuItem}
                >
                  <Icon size={19} color={theme.text} />
                  <Text style={[styles.menuText, { color: theme.text }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Stillar                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Modal */
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    elevation: 16,
  },

  /* Yuqori panel */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
  },
  topLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  topRight: { flex: 1, alignItems: "flex-end" },
  topLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  topBtn: {
    width: 40,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: { padding: 4 },

  /* Muqova */
  artworkWrap: { alignItems: "center", marginTop: 14, marginBottom: 18 },
  artworkShadow: {
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  /* Nom */
  titleWrap: { alignItems: "center", marginBottom: 14, paddingHorizontal: 8 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  artist: { fontSize: 14, marginTop: 4, textAlign: "center" },

  /* Slider */
  seekRow: { flexDirection: "row", alignItems: "center" },
  slider: { flex: 1, marginHorizontal: 8, height: 40 },
  timeText: {
    width: 40,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },

  /* Qo'shimcha tugmalar */
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 4,
  },
  chip: {
    height: 38,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rateChip: { minWidth: 58 },
  rateText: { fontSize: 13, fontWeight: "700" },

  /* Asosiy boshqaruv */
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 18,
  },
  ctrlBtn: { padding: 8 },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  sideSlot: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { fontSize: 11, marginTop: 18, textAlign: "center" },

  /* Popoverlar */
  popover: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  playlistPopover: {
    left: 16,
    width: 236,
    paddingVertical: 6,
    overflow: "hidden",
  },
  playlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playlistHeaderText: { fontSize: 13, fontWeight: "700" },
  playlistCount: { fontSize: 12, fontWeight: "600" },
  playlistRow: {
    height: PLAYLIST_ROW_H,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  playlistInfo: { flex: 1, marginLeft: 10, marginRight: 6 },
  playlistTitle: { fontSize: 13, fontWeight: "600" },
  playlistArtist: { fontSize: 11, marginTop: 2 },

  menuPopover: {
    right: 16,
    width: MENU_W,
    paddingVertical: MENU_PAD,
  },
  menuItem: {
    height: MENU_ITEM_H,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  menuText: { fontSize: 14, fontWeight: "500" },

  /* Mini-pleyer */
  miniOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 20,
  },
  miniContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 10,
    width: MINI_W,
    height: MINI_H,
    borderRadius: MINI_H / 4,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 12,
    shadowColor: "#1de8b9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  miniControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  miniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  miniPlayBtn: { width: 40, height: 40, borderRadius: 10 },
  miniDivider: { width: 1, height: 26, marginHorizontal: 4 },
  miniSmallBtn: {
    width: 28,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});

/* eslint-enable react-hooks/refs */