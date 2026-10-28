import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
//  useMusicPlayer — musiqa navbati (queue) va to'liq boshqaruv
//  (play / pause / next / prev / seek).
//
//  ⚠️ QULF EKRANI / BILDIRISHNOMA HAQIDA MUHIM ESLATMA:
//  - `setAudioModeAsync({ shouldPlayInBackground: true, ... })` — musiqa ilova
//    fonga o'tganda ham davom etishini ta'minlaydi (bu ISHLAYDI).
//  - `player.setActiveForLockScreen(true, {title, artist, artworkUrl})` —
//    qulf ekranida/bildirishnomada sarlavha, ijrochi va rasmni ko'rsatadi
//    (bu ham ISHLAYDI, expo-audio hujjatlarida tasdiqlangan).
//  - LEKIN qulf ekranidagi "Next/Previous" tugmalari bosilganda buni
//    JS kodimizga qaytarib berish (remote command callback) expo-audio'ning
//    hozirgi hujjatlarida ANIQ tasdiqlanmagan. Qurilmangizda test qilib
//    ko'ring — agar next/prev tugmalari chaqirilmasa, to'liq professional
//    "Now Playing" boshqaruvi uchun quyidagini o'rnating:
//        npx expo install react-native-track-player
//    TrackPlayer media-session/remote-command'larni to'liq qo'llab-quvvatlaydi.
//    Bu hook shunday tuzilganki (queue, play/pause/next/prev bir joyda),
//    kelajakda FAQAT shu faylni almashtirib, TrackPlayer'ga o'tish mumkin —
//    boshqa hech qanday komponentga tegish shart emas.
// ════════════════════════════════════════════════════════════════════════════

let _audioModeConfigured = false;
async function ensureBackgroundAudioMode() {
  if (_audioModeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    });
    _audioModeConfigured = true;
  } catch (err) {
    console.error("[useMusicPlayer] audio mode error:", err);
  }
}

const MusicPlayerContext = createContext(null);

function useMusicPlayerController() {
  const [queue, setQueue] = useState([]); // { id, uri, title, artist, artwork }[]
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = queue[currentIndex] || null;

  // Player faqat BIR marta yaratiladi; trek almashganda player.replace() bilan
  // manba almashtiriladi (expo-audio hujjatlarida tavsiya etilgan usul).
  const player = useAudioPlayer(current?.uri || null);
  const status = useAudioPlayerStatus(player);
  const didInit = useRef(false);

  useEffect(() => { ensureBackgroundAudioMode(); }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (queue.length ? Math.min(queue.length - 1, i + 1) : 0));
  }, [queue.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // Trek tugagach avtomatik keyingisiga o'tish — native 'playbackStatusUpdate'
  // eventi orqali (bu didJustFinish'ni faqat BIR marta, aniq beradi).
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("playbackStatusUpdate", (s) => {
      if (s?.didJustFinish) next();
    });
    return () => sub.remove();
  }, [player, next]);

  // Trek almashganda: manba yangilanadi, ijro boshlanadi va qulf ekrani
  // uchun metama'lumot (title/artist/rasm) yuboriladi.
  useEffect(() => {
    if (!current || !player) return;

    console.log("[useMusicPlayer] current track changed", {
      title: current.title,
      artist: current.artist,
      uri: current.uri,
      queueLength: queue.length,
      currentIndex,
    });

    if (didInit.current) {
      player.replace?.(current.uri);
    }
    didInit.current = true;

    try {
      player.play();
      player.setActiveForLockScreen?.(true, {
        title: current.title || "Musiqa",
        artist: current.artist || "",
        albumTitle: current.album || "",
        artworkUrl: current.artwork || undefined,
      });
    } catch (err) {
      console.error("[useMusicPlayer] failed to start current track", {
        err,
        current,
        currentIndex,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, current?.uri]);

  const play = useCallback(() => player?.play(), [player]);
  const pause = useCallback(() => player?.pause(), [player]);
  const toggle = useCallback(() => {
    if (status?.playing) pause(); else play();
  }, [status?.playing, play, pause]);

  const seekTo = useCallback((seconds) => player?.seekTo?.(seconds), [player]);

  // Chatdagi barcha musiqa xabarlaridan yangi navbat boshlash
  const playQueue = useCallback((tracks, startIndex = 0) => {
    try {
      console.log("[useMusicPlayer] playQueue called", {
        trackCount: Array.isArray(tracks) ? tracks.length : 0,
        startIndex,
        tracks: Array.isArray(tracks)
          ? tracks.map((track) => ({
              id: track?.id,
              title: track?.title,
              artist: track?.artist,
              uri: track?.uri,
            }))
          : [],
      });
      didInit.current = false;
      setQueue(tracks);
      setCurrentIndex(startIndex);
    } catch (err) {
      console.error("[useMusicPlayer] playQueue failed", {
        err,
        trackCount: Array.isArray(tracks) ? tracks.length : 0,
        startIndex,
      });
      throw err;
    }
  }, []);

  const stopAndClear = useCallback(() => {
    console.log("[useMusicPlayer] stopAndClear called");
    try {
      player?.pause();
      player?.setActiveForLockScreen?.(false);
      setQueue([]);
      setCurrentIndex(0);
      didInit.current = false;
    } catch (err) {
      console.error("[useMusicPlayer] stopAndClear failed", { err });
    }
  }, [player]);

  return {
    queue, currentIndex, current,
    isPlaying: !!status?.playing,
    positionSec: status?.currentTime || 0,
    durationSec: status?.duration || 0,
    playQueue, play, pause, toggle, next, prev, seekTo, stopAndClear,
    hasNext: currentIndex < queue.length - 1,
    hasPrev: currentIndex > 0,
  };
}

export function MusicPlayerProvider({ children }) {
  const value = useMusicPlayerController();
  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    console.warn("[useMusicPlayer] used outside MusicPlayerProvider");
    return null;
  }
  return context;
}