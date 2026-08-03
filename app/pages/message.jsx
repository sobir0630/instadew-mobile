import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/server";
import { WS_URL } from "../api/config";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  ImageBackground,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  SafeAreaView,
  Animated,
  PanResponder,
  Clipboard,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio, Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_W } = Dimensions.get("window");

// ════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const MSG_TYPE = {
  TEXT:  "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  VOICE: "voice",
  MUSIC: "music",
  FILE:  "file",
};

const MAX_TEXT_LENGTH = 4000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB
const MAX_AUDIO_BYTES = 30 * 1024 * 1024; // 30MB
const MIN_VOICE_MS = 700; // ignore accidental taps shorter than this
const VOICE_CANCEL_DRAG_PX = 90; // Telegram-style "slide left to cancel" threshold

const WALLPAPER_CATEGORIES = [
  { key: "none", label: "Standart" },
  { key: "love", label: "Sevgi" },
  { key: "friends", label: "Do'stlar" },
  { key: "alone", label: "Yolg'iz" },
  { key: "business", label: "Biznes" },
];

const WALLPAPER_PRESETS = {
  love: [
    ["#ff9a9e", "#fecfef"],
    ["#ff6a88", "#ff99ac"],
    ["#f857a6", "#ff5858"],
    ["#ffafbd", "#ffc3a0"],
  ],
  friends: [
    ["#f6d365", "#fda085"],
    ["#84fab0", "#8fd3f4"],
    ["#fccb90", "#d57eeb"],
    ["#a1c4fd", "#c2e9fb"],
  ],
  alone: [
    ["#2c3e50", "#4b6584"],
    ["#232526", "#414345"],
    ["#0f2027", "#2c5364"],
    ["#141e30", "#243b55"],
  ],
  business: [
    ["#1e3c72", "#2a5298"],
    ["#373b44", "#4286f4"],
    ["#0f0c29", "#302b63"],
    ["#134e5e", "#71b280"],
  ],
};

// ════════════════════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════════════════════

async function getMyUser() {
  try {
    const u =
      (await AsyncStorage.getItem("login_username")) ||
      (await AsyncStorage.getItem("username")) ||
      "me";
    return u;
  } catch (err) {
    console.error("[getMyUser] error:", err);
    return "me";
  }
}

// FIX: The backend returns numeric sender/receiver IDs. Reading the current
// ID prevents `ali` and `sobir` messages from being treated as the same user.
async function getMyUserId() {
  try {
    return await AsyncStorage.getItem("user_id");
  } catch (err) {
    console.error("[getMyUserId] error:", err);
    return null;
  }
}

async function authHeader() {
  try {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token?.trim()}` };
  } catch (err) {
    console.error("[authHeader] error:", err);
    return {};
  }
}

export function buildRoomName(u1, u2) {
  return [u1, u2].sort().join("_");
}

function wsBase() {
  
  const WS = WS_URL
  const base = WS || "ws://localhost:8001"
  
  return base;
}

async function fetchHistory(roomName) {
  try {
    
    const headers = await authHeader();
    const res = await API.get(`/messages/history/`, { params: { room: roomName }, headers });
    const d = res.data;
    console.log("xabarlar:", d);
    const messages = Array.isArray(d) ? d : d?.results || d?.messages || [];
    messages.forEach((msg) => {
      console.log(`[fetchHistory] msg: ${msg.id} ${msg.sender} ${msg.message_type} ${msg.created_at}`);
    });
    return messages;
  } catch (err) {
    console.error("[fetchHistory] error:", err?.response?.data || err.message);
    return [];
  }
}

async function fetchUsers() {
  try {
    const headers = await authHeader();
    const res = await API.get(`/users/register/`, { headers });
    const d = res.data;
    console.log("[fetchUsers] data:", d);
    return Array.isArray(d) ? d : d?.results || [];
  } catch (err) {
    console.error("[fetchUsers] error:", err?.response?.data || err.message);
    return [];
  }
}

async function fetchAllLastMessages(users, myUsername, myUserId, readMap = {}) {
  try {
    const entries = await Promise.all(
      users.map(async (u) => {
        const room = buildRoomName(myUsername, u.username);
        const hist = await fetchHistory(room);
        const last = hist.length > 0 ? hist[hist.length - 1] : null;
        const readTs = readMap[room];
        const unreadCount = hist.filter((msg) => {
          const timestamp = msg.timestamp || msg.created_at || msg.updated_at;
          const fromMe = String(msg.sender) === String(myUserId) ||
            msg.sender === myUsername ||
            msg.sender_username === myUsername;
          return !fromMe && timestamp && (!readTs || new Date(timestamp) > new Date(readTs));
        }).length;
        return [u.username, { last, unreadCount }];
      })
    );
    return Object.fromEntries(entries);
  } catch (err) {
    console.error("[fetchAllLastMessages] error:", err);
    return {};
  }
}

// ── READ-STATE TRACKING (local, per-room "last seen" timestamp) ────────────
// The backend doesn't reliably expose an `is_read` flag, so unread state is
// derived locally: we remember when the user last opened each room and
// compare that to the timestamp of the last message in that room.
const READ_TS_PREFIX = "read_ts_";

async function loadAllReadTimestamps() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const readKeys = keys.filter((k) => k.startsWith(READ_TS_PREFIX));
    if (readKeys.length === 0) return {};
    const pairs = await AsyncStorage.multiGet(readKeys);
    const map = {};
    pairs.forEach(([key, value]) => {
      if (value) map[key.replace(READ_TS_PREFIX, "")] = value;
    });
    return map;
  } catch (err) {
    console.error("[readTracking] load error:", err);
    return {};
  }
}

async function saveReadTimestamp(room, iso) {
  try {
    await AsyncStorage.setItem(`${READ_TS_PREFIX}${room}`, iso);
  } catch (err) {
    console.error("[readTracking] save error:", err);
  }
}

function timeOnly(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (err) {
    console.error("[timeOnly] error:", err);
    return "";
  }
}

function getInitials(name = "") {
  const s = String(name || "").trim();
  if (!s) return "?";
  return (
    s
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function formatDuration(ms = 0) {
  const totalSec = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFileSize(bytes = 0) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sanitizeText(text) {
  return String(text || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // strip control chars
    .slice(0, MAX_TEXT_LENGTH);
}

const PALETTES = [
  ["#6366F1", "#8B5CF6"], ["#EC4899", "#F43F5E"], ["#14B8A6", "#06B6D4"],
  ["#F59E0B", "#EF4444"], ["#10B981", "#3B82F6"], ["#8B5CF6", "#EC4899"],
  ["#06B6D4", "#6366F1"], ["#F97316", "#EAB308"], ["#84CC16", "#14B8A6"],
];
function getPalette(name = "") {
  if (!name || typeof name !== "string") return PALETTES[0];
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length;
  return PALETTES[idx];
}

async function ensureMediaLibraryPermission() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Davom etish uchun galereyadan foydalanishga ruxsat bering.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[permissions] media library error:", err);
    return false;
  }
}

async function ensureCameraPermission() {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Davom etish uchun kameradan foydalanishga ruxsat bering.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[permissions] camera error:", err);
    return false;
  }
}

async function ensureMicPermission() {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Ovozli xabar yuborish uchun mikrofonga ruxsat bering.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[permissions] microphone error:", err);
    return false;
  }
}

// Single shared audio player so only one clip plays at a time (Telegram-like behaviour)
let _activeSound = null;
let _activeOnPlayingChange = null;
async function playAudioExclusive(uri, onPlayingChange, onFinish) {
  try {
    if (_activeSound) {
      await _activeSound.stopAsync().catch(() => {});
      await _activeSound.unloadAsync().catch(() => {});
      _activeOnPlayingChange?.(false);
      _activeSound = null;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    _activeSound = sound;
    _activeOnPlayingChange = onPlayingChange;
    onPlayingChange(true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status?.didJustFinish) {
        onFinish?.();
        onPlayingChange(false);
        _activeSound = null;
      }
    });
  } catch (err) {
    console.error("[audio] play error:", err);
    onPlayingChange(false);
  }
}
async function stopAudioExclusive() {
  try {
    if (_activeSound) {
      await _activeSound.stopAsync().catch(() => {});
      await _activeSound.unloadAsync().catch(() => {});
      _activeOnPlayingChange?.(false);
      _activeSound = null;
    }
  } catch (err) {
    console.error("[audio] stop error:", err);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  WEBSOCKET HOOK
// ════════════════════════════════════════════════════════════════════════════

function useChat(roomName) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [typing, setTyping] = useState(false);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const myUserRef = useRef("me");

  useEffect(() => {
    getMyUser().then((u) => (myUserRef.current = u));
  }, []);

  const connect = useCallback(() => {
    if (!roomName) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setConnecting(true);
    try {
      const ws = new WebSocket(`${wsBase()}/ws/chat/${roomName}/`);
      wsRef.current = ws;

      ws.onopen = () => { setConnected(true); setConnecting(false); };
      ws.onerror = (e) => { console.error("[chat-ws] error:", e?.message || e); setConnecting(false); };
      ws.onclose = () => { setConnected(false); setConnecting(false); };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const t = data.type || data.message_type;

          if (t === "typing" && data.sender !== myUserRef.current) {
            setTyping(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setTyping(false), 2500);
            return;
          }

          if (t === "chat_message" || data.message || data.media_url) {
            const msgText = data.message || data.text || data.content || "";
            const sender = data.sender || data.username || data.sender_username || "?";

            setMessages((prev) => {
              const newMsg = {
                id: data.id || `ws_${Date.now()}`,
                type: data.message_type_kind || data.msg_type || MSG_TYPE.TEXT,
                message: msgText,
                content: msgText,
                media_url: data.media_url || null,
                file_name: data.file_name || null,
                file_size: data.file_size || null,
                duration: data.duration || null,
                sender,
                sender_username: sender,
                timestamp: data.timestamp || data.created_at || new Date().toISOString(),
                is_edited: data.is_edited || false,
              };

              if (sender === myUserRef.current) {
                const localIdx = prev.findIndex((m) => m._local && m.message === msgText);
                if (localIdx !== -1) {
                  const updated = [...prev];
                  updated[localIdx] = { ...updated[localIdx], ...newMsg, _local: false };
                  return updated;
                }
                return prev;
              }

              if (data.id && prev.some((m) => m.id === data.id)) return prev;
              return [...prev, newMsg];
            });
            setTyping(false);
          }
        } catch (err) {
          console.error("[chat-ws] message parse error:", err);
        }
      };
    } catch (err) {
      console.error("[chat-ws] connect error:", err);
      setConnecting(false);
    }
  }, [roomName]);

  const disconnect = useCallback(() => {
    try {
      wsRef.current?.close();
    } catch (err) {
      console.error("[chat-ws] disconnect error:", err);
    }
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((text) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
    try {
      wsRef.current.send(
        JSON.stringify({ type: "chat_message", message: text, sender: myUserRef.current, timestamp: new Date().toISOString() })
      );
      return true;
    } catch (err) {
      console.error("[chat-ws] send error:", err);
      return false;
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "typing", sender: myUserRef.current }));
      } catch (err) {
        console.error("[chat-ws] typing send error:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (roomName) {
      connect();
      return () => disconnect();
    }
  }, [roomName]);

  return { messages, setMessages, connected, connecting, typing, sendMessage, sendTyping, reconnect: connect };
}

// ════════════════════════════════════════════════════════════════════════════
//  VOICE RECORDER HOOK
// ════════════════════════════════════════════════════════════════════════════

function useVoiceRecorder() {
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const timerRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const ok = await ensureMicPermission();
      if (!ok) return false;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setDurationMs(0);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setDurationMs((d) => d + 200), 200);
      return true;
    } catch (err) {
      console.error("[voice-recorder] start error:", err);
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    const rec = recordingRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      const finalDuration = durationMs;
      recordingRef.current = null;
      return { uri, duration: finalDuration };
    } catch (err) {
      console.error("[voice-recorder] stop error:", err);
      recordingRef.current = null;
      return null;
    }
  }, [durationMs]);

  const cancel = useCallback(async () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    const rec = recordingRef.current;
    try {
      if (rec) await rec.stopAndUnloadAsync().catch(() => {});
    } catch (err) {
      console.error("[voice-recorder] cancel error:", err);
    } finally {
      recordingRef.current = null;
      setDurationMs(0);
    }
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { isRecording, durationMs, start, stop, cancel };
}

// ════════════════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════════════════

const IconSun = ({ size = 18, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="5" />
    <Line x1="12" y1="1" x2="12" y2="3" /><Line x1="12" y1="21" x2="12" y2="23" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <Line x1="1" y1="12" x2="3" y2="12" /><Line x1="21" y1="12" x2="23" y2="12" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Svg>
);
const IconMoon = ({ size = 18, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);
const IconSearch = ({ size = 14, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);
const IconUsers = ({ size = 28, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);
const IconChatBubble = ({ size = 28, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const IconChevronRight = ({ size = 14, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
const IconBack = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);
const IconMoreVertical = ({ size = 18, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="12" cy="5" r="2" /><Circle cx="12" cy="12" r="2" /><Circle cx="12" cy="19" r="2" />
  </Svg>
);
const IconRefresh = ({ size = 13, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="23 4 23 10 17 10" /><Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </Svg>
);
const IconTrash = ({ size = 13, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
);
const IconClose = ({ size = 13, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconEdit = ({ size = 13, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const IconCopy = ({ size = 13, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M9 9h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" transform="translate(-2 -2)" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);
const IconSend = ({ size = 15, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Line x1="22" y1="2" x2="11" y2="13" /><Polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);
const IconCheck = ({ size = 15, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IconHome = ({ size = 22, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);
const IconLogoGlobe = ({ size = 26, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </Svg>
);
const IconCreate = ({ size = 22, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Line x1="12" y1="8" x2="12" y2="16" /><Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);
const IconMovie = ({ size = 22, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polygon points="23 7 16 12 23 17 23 7" /><Path d="M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1z" />
  </Svg>
);
const IconPerson = ({ size = 22, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);
const IconPaperclip = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </Svg>
);
const IconMic = ({ size = 18, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" /><Line x1="12" y1="19" x2="12" y2="23" /><Line x1="8" y1="23" x2="16" y2="23" />
  </Svg>
);
const IconImageIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconCamera = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);
const IconMusicNote = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M9 18V5l12-2v13" /><Circle cx="6" cy="18" r="3" /><Circle cx="18" cy="16" r="3" />
  </Svg>
);
const IconDocument = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="8" y1="13" x2="16" y2="13" /><Line x1="8" y1="17" x2="13" y2="17" />
  </Svg>
);
const IconPlaySmall = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Polygon points="6 3 20 12 6 21 6 3" />
  </Svg>
);
const IconPauseSmall = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Rect x="5" y="3" width="5" height="18" /><Rect x="14" y="3" width="5" height="18" />
  </Svg>
);
const IconPalette = ({ size = 18, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.5a3 3 0 0 0 3-3A10 10 0 0 0 12 2z" />
    <Circle cx="7.5" cy="10.5" r="1.2" /><Circle cx="12" cy="7.5" r="1.2" /><Circle cx="16.5" cy="10.5" r="1.2" />
  </Svg>
);
const IconChevronLeft = ({ size = 14, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ════════════════════════════════════════════════════════════════════════════

function Avatar({ name = "", size = 40, showRing = false, src = null, online = null, accentColor, bgColor }) {
  const [c1] = getPalette(name);
  return (
    <View style={{ position: "relative", width: size, height: size }}>
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
            backgroundColor: c1,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          },
          showRing && { borderWidth: 2, borderColor: accentColor },
        ]}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Text style={{ fontSize: size * 0.36, fontWeight: "700", color: "#545353" }}>{getInitials(name)}</Text>
        )}
      </View>
      {online !== null ? (
        <View
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: Math.max(9, size * 0.22),
            height: Math.max(9, size * 0.22),
            borderRadius: 999,
            backgroundColor: online ? "#22C55E" : "#94A3B8",
            borderWidth: 2,
            borderColor: bgColor,
          }}
        />
      ) : null}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  DROPDOWN MENU (action sheet style)
// ════════════════════════════════════════════════════════════════════════════

function DropMenu({ visible, onClose, items, theme }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.dropOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.dropMenuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { item.action(); onClose(); }}
              style={[
                styles.dropMenuItem,
                i > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
              ]}
            >
              {item.icon}
              <Text style={{ fontSize: 14, color: item.danger ? "#EF4444" : theme.text, marginLeft: 9 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ATTACHMENT BOTTOM SHEET
// ════════════════════════════════════════════════════════════════════════════

function AttachSheet({ visible, onClose, theme, onPickImage, onPickVideo, onPickDocument, onSendMusicFile, onOpenCamera }) {
  const options = [
    { label: "Rasm", icon: <IconImageIcon />, bg: "#8B5CF6", action: onPickImage },
    { label: "Video", icon: <IconMovie size={22} color="#fff" />, bg: "#EC4899", action: onPickVideo },
    { label: "Kamera", icon: <IconCamera />, bg: "#10B981", action: onOpenCamera },
    { label: "Musiqa", icon: <IconMusicNote color="#fff" />, bg: "#0EA5E9", action: onSendMusicFile },
    { label: "Fayl", icon: <IconDocument color="#fff" />, bg: "#F59E0B", action: onPickDocument },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheetCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, marginBottom: 14 }}>Biriktirish</Text>
          <View style={styles.sheetGrid}>
            {options.map((o, i) => (
              <TouchableOpacity key={i} style={styles.sheetItem} onPress={() => { o.action(); onClose(); }}>
                <View style={[styles.sheetIconCircle, { backgroundColor: o.bg }]}>{o.icon}</View>
                <Text style={{ fontSize: 12, color: theme.text, marginTop: 6, fontWeight: "500" }}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  WALLPAPER (CHAT BACKGROUND) BOTTOM SHEET
// ════════════════════════════════════════════════════════════════════════════

function WallpaperSheet({ visible, onClose, theme, onSelectGradient, onSelectCustom, onReset }) {
  const [cat, setCat] = useState("love");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.wallpaperCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 12 }}>Suhbat foni</Text>

          <View style={styles.catTabsRow}>
            {WALLPAPER_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCat(c.key)}
                style={[
                  styles.catTab,
                  { borderColor: theme.border },
                  cat === c.key && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
              >
                <Text style={{ fontSize: 12, color: cat === c.key ? "#fff" : theme.sub, fontWeight: "600" }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {cat === "none" ? (
            <TouchableOpacity
              onPress={() => { onReset(); onClose(); }}
              style={[styles.resetWallBtn, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>Standart fonni tiklash</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.wallGrid}>
              {(WALLPAPER_PRESETS[cat] || []).map((colors, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { onSelectGradient(colors); onClose(); }}
                  style={styles.wallSwatchWrap}
                >
                  <LinearGradient colors={colors} style={styles.wallSwatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => { onSelectCustom(); onClose(); }}
            style={[styles.customWallBtn, { borderColor: theme.accent }]}
          >
            <IconImageIcon size={18} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: "700", marginLeft: 8 }}>Galereyadan rasm tanlash</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  FULLSCREEN MEDIA VIEWERS
// ════════════════════════════════════════════════════════════════════════════

// Swipeable, Telegram-style image gallery. Shows every image sent in the
// current chat so the user can page left/right through them in order,
// starting from whichever bubble was tapped.
function ImageGalleryModal({ images, index, onClose, onChangeIndex }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (index !== null && index !== undefined && listRef.current) {
      const t = setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({ index, animated: false });
        } catch (err) {
          // scrollToIndex can throw before layout is measured; ignore safely
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [index]);

  const visible = index !== null && index !== undefined && images.length > 0;
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerOverlay}>
        <TouchableOpacity style={styles.viewerCloseBtn} onPress={onClose}>
          <IconClose size={20} color="#fff" />
        </TouchableOpacity>
        {images.length > 1 ? (
          <Text style={styles.viewerCounter}>{index + 1} / {images.length}</Text>
        ) : null}
        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => String(item.id || i)}
          initialScrollIndex={Math.min(index, images.length - 1)}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            onChangeIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={styles.viewerPage}>
              <Image source={{ uri: item.media_url }} style={styles.viewerImage} resizeMode="contain" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

function VideoViewerModal({ uri, visible, onClose }) {
  return (
    <Modal visible={visible && !!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerOverlay}>
        <TouchableOpacity style={styles.viewerCloseBtn} onPress={onClose}>
          <IconClose size={20} color="#fff" />
        </TouchableOpacity>
        {uri ? (
          <Video
            source={{ uri }}
            style={styles.viewerVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
          />
        ) : null}
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MEDIA MESSAGE BUBBLES
// ════════════════════════════════════════════════════════════════════════════

function AudioMessageBubble({ uri, duration, isMe, theme, label }) {
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    if (!uri) return;
    if (playing) {
      await stopAudioExclusive();
      setPlaying(false);
    } else {
      await playAudioExclusive(uri, setPlaying);
    }
  };

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.audioBubbleRow}>
      <View style={[styles.audioPlayBtn, { backgroundColor: isMe ? "rgba(255,255,255,0.25)" : theme.accent }]}>
        {playing ? <IconPauseSmall /> : <IconPlaySmall />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: isMe ? "#fff" : theme.text }}>
            {label}
          </Text>
        ) : null}
        <View style={styles.waveRow}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height: 4 + ((i * 37) % 14), backgroundColor: isMe ? "rgba(255,255,255,0.6)" : theme.sub },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={{ fontSize: 10, color: isMe ? "rgba(85, 137, 87, 0.85)" : theme.sub, marginLeft: 6 }}>
        {formatDuration(duration)}
      </Text>
    </TouchableOpacity>
  );
}

function VideoMessageBubble({ uri, onPress }) {
  const videoRef = useRef(null);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.videoBubble}
        resizeMode={ResizeMode.COVER}
        isMuted
        isLooping={false}
      />
      <View style={styles.videoPlayOverlay}>
        <IconPlaySmall size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

function FileMessageBubble({ fileName, fileSize, isMe, theme, onOpen }) {
  return (
    <TouchableOpacity onPress={onOpen} activeOpacity={0.85} style={styles.fileBubbleRow}>
      <View style={[styles.filesIconWrap, { backgroundColor: isMe ? "rgba(255,255,255,0.25)" : theme.card }]}>
        <IconDocument color={isMe ? "#fff" : theme.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: isMe ? "#fff" : theme.text }}>
          {fileName || "Fayl"}
        </Text>
        {fileSize ? (
          <Text style={{ fontSize: 11, color: isMe ? "rgba(85, 137, 87, 0.85)" : theme.sub }}>
            {formatFileSize(fileSize)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VOICE RECORD BUTTON — press & hold to record, release to send,
//  slide left to cancel (Telegram-style gesture)
// ════════════════════════════════════════════════════════════════════════════

function VoiceRecordButton({ recorder, onRecorded, theme }) {
  const dragX = useRef(new Animated.Value(0)).current;
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);

  const resetDrag = () => {
    Animated.timing(dragX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cancelledRef.current = false;
        startedRef.current = true;
        dragX.setValue(0);
        // Fire and forget — recording begins as soon as the finger touches down
        recorder.start();
      },
      onPanResponderMove: (evt, gesture) => {
        if (!startedRef.current) return;
        if (gesture.dx < 0) {
          dragX.setValue(Math.max(gesture.dx, -140));
          if (gesture.dx < -VOICE_CANCEL_DRAG_PX) {
            cancelledRef.current = true;
          } else {
            cancelledRef.current = false;
          }
        } else {
          dragX.setValue(0);
          cancelledRef.current = false;
        }
      },
      onPanResponderRelease: async () => {
        if (!startedRef.current) return;
        startedRef.current = false;
        resetDrag();
        if (cancelledRef.current) {
          await recorder.cancel();
          return;
        }
        const result = await recorder.stop();
        if (result?.uri && result.duration >= MIN_VOICE_MS) {
          // FIX: Keep the recording in the composer first. The user can now
          // review it, delete it, or send it with the airplane button.
          onRecorded(result);
        }
        // Too short a press-and-release (an accidental tap) — nothing is sent.
      },
      onPanResponderTerminate: async () => {
        if (!startedRef.current) return;
        startedRef.current = false;
        resetDrag();
        await recorder.cancel();
      },
    })
  ).current;

  return (
    <Animated.View style={{ transform: [{ translateX: dragX }] }} {...panResponder.panHandlers}>
      <View style={[styles.sendBtn, { backgroundColor: theme.accent }]}>
        <IconMic />
      </View>
    </Animated.View>
  );
}

function MediaDeleteButton({ onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Delete media message"
      style={[styles.mediaDeleteBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <IconTrash size={13} color="#EF4444" />
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  THEMES
// ════════════════════════════════════════════════════════════════════════════

const LIGHT = {
  bg: "#F3F5FC", surface: "#FFFFFF", card: "#ECEEF8", inputBg: "#F3F5FC",
  border: "#DDE0F0", text: "#111827", sub: "#6B7280", accent: "#6366F1",
  bubbleMe: "#6366F1", bubbleOther: "#FFFFFF", textMe: "#FFFFFF",
};
const DARK = {
  bg: "#0D0F18", surface: "#14161F", card: "#1B1E2E", inputBg: "#1B1E2E",
  border: "#232640", text: "#E8EAF6", sub: "#6B7280", accent: "#818CF8",
  bubbleMe: "#4F52CC", bubbleOther: "#1B1E2E", textMe: "#FFFFFF",
};

// ════════════════════════════════════════════════════════════════════════════
//  MAIN CHAT SCREEN
// ════════════════════════════════════════════════════════════════════════════

function ChatScreenInner() {
  const router = useRouter();

  const [myUsername, setMyUsername] = useState("me");
  const [myUserId, setMyUserId] = useState(null);
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("list"); // "list" | "chat"

  const [users, setUsers] = useState([]);
  const [lastMsgMap, setLastMsgMap] = useState({});
  const [unreadCountMap, setUnreadCountMap] = useState({});
  const [usersLoading, setUsersLoading] = useState(true);
  const [onlineMap, setOnlineMap] = useState({});
  const [readMap, setReadMap] = useState({}); // room -> ISO timestamp of when it was last opened

  const [activeUser, setActiveUser] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [input, setInput] = useState("");
  const [histLoading, setHistLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [pendingVoice, setPendingVoice] = useState(null);

  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [msgMenuFor, setMsgMenuFor] = useState(null);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [wallpaperSheetVisible, setWallpaperSheetVisible] = useState(false);
  const [wallpaper, setWallpaper] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(null); // index into current chat's image list
  const [viewerVideoUri, setViewerVideoUri] = useState(null);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingSentAt = useRef(0);

  const { messages, setMessages, connected, connecting, typing, sendMessage, sendTyping, reconnect } = useChat(roomName);
  const recorder = useVoiceRecorder();

  const t = dark ? DARK : LIGHT;

  useEffect(() => {
    // FIX: Reload identity from storage on every screen mount. Do not reuse a
    // previous account's module-level cached username.
    Promise.all([getMyUser(), getMyUserId()]).then(([username, userId]) => {
      setMyUsername(username);
      setMyUserId(userId);
    });
  }, []);

  // Load users, last messages, and locally-tracked read state
  useEffect(() => {
    (async () => {
      try {
        const me = await getMyUser();
        const all = await fetchUsers();
        // FIX: Filter the logged-in account by both username and ID. This
        // remains correct even if one identity field is stale or differs in
        // casing between login and the users endpoint.
        const currentId = await getMyUserId();
        const others = all.filter((u) => u.username !== me && String(u.id) !== String(currentId));
        setUsers(others);
        setUsersLoading(false);
        const reads = await loadAllReadTimestamps();
        const messageMap = await fetchAllLastMessages(others, me, currentId, reads);
        const lastMap = {};
        const unreadMap = {};
        Object.entries(messageMap).forEach(([username, value]) => {
          lastMap[username] = value.last;
          unreadMap[username] = value.unreadCount;
        });
        setLastMsgMap(lastMap);
        setUnreadCountMap(unreadMap);
        setReadMap(reads);
      } catch (err) {
        console.error("[ChatScreen] initial load error:", err);
        setUsersLoading(false);
      }
    })();
  }, []);

  // FIX: Keep Telegram-style unread badges current while the user list is
  // open. The active chat already receives messages through its WebSocket;
  // this refresh covers messages arriving in other conversations.
  useEffect(() => {
    if (view !== "list" || !myUsername || users.length === 0) return undefined;
    let cancelled = false;
    const refreshUnreadCounts = async () => {
      const messageMap = await fetchAllLastMessages(users, myUsername, myUserId, readMap);
      if (cancelled) return;
      const nextLast = {};
      const nextUnread = {};
      Object.entries(messageMap).forEach(([username, value]) => {
        nextLast[username] = value.last;
        nextUnread[username] = value.unreadCount;
      });
      setLastMsgMap(nextLast);
      setUnreadCountMap(nextUnread);
    };
    const timer = setInterval(refreshUnreadCounts, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [view, users, myUsername, myUserId, readMap]);

  // Presence WebSocket (uses same host/config as chat socket)
  useEffect(() => {
    let ws;
    let retryTimer;

    const tryConnect = () => {
      try {
        ws = new WebSocket(`${wsBase()}/ws/presence/`);
        ws.onopen = () => console.log("[presence-ws] connected - ws host:", wsBase());
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === "presence" && Array.isArray(d.online_users)) {
              const m = {};
              d.online_users.forEach((u) => { m[u] = true; });
              setOnlineMap(m);
            }
            if (d.type === "user_status" && d.username) {
              setOnlineMap((prev) => ({ ...prev, [d.username]: !!d.online }));
            }
          } catch (err) {
            console.error("[presence-ws] parse error:", err);
          };
        };
        ws.onerror = (e) => console.error("[presence-ws] error:", e?.message || e);
        ws.onclose = () => { retryTimer = setTimeout(tryConnect, 5000); };
      } catch (err) {
        console.error("[presence-ws] connect error:", err);
        retryTimer = setTimeout(tryConnect, 5000);
      }
    };
    tryConnect();
    return () => { ws?.close(); clearTimeout(retryTimer); };
  }, []);

  // Auto-scroll to bottom when the keyboard opens, Telegram-style
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(showEvt, () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 60);
    });
    return () => sub.remove();
  }, []);

  // While a chat is open, any newly-arrived message is immediately considered
  // "read" — this keeps the unread dot from re-appearing on a chat you're
  // actively looking at.
  useEffect(() => {
    if (view === "chat" && roomName && messages.length > 0) {
      const nowIso = new Date().toISOString();
      saveReadTimestamp(roomName, nowIso);
      setReadMap((prev) => ({ ...prev, [roomName]: nowIso }));
    }
  }, [messages.length, view, roomName]);

  const sortedUsers = [...users].sort((a, b) => {
    const la = lastMsgMap[a.username];
    const lb = lastMsgMap[b.username];
    if (la && lb) return new Date(lb.timestamp || lb.created_at) - new Date(la.timestamp || la.created_at);
    if (la) return -1;
    if (lb) return 1;
    return (a.full_name || a.username).localeCompare(b.full_name || b.username);
  });

  const filteredUsers = sortedUsers.filter(
    (u) =>
      !search.trim() ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const isOnline = (username) => !!onlineMap[username];

  const loadWallpaper = async (room) => {
    try {
      const saved = await AsyncStorage.getItem(`wallpaper_${room}`);
      setWallpaper(saved ? JSON.parse(saved) : null);
    } catch (err) {
      console.error("[wallpaper] load error:", err);
      setWallpaper(null);
    }
  };

  const openChat = async (user) => {
    setActiveUser(user);
    const room = buildRoomName(myUsername, user.username);
    setRoomName(room);
    setMessages([]);
    setView("chat");
    setShowMsgSearch(false);
    setMsgSearch("");
    setEditingMsg(null);
    setInput("");
    setHistLoading(true);
    await loadWallpaper(room);
    const hist = await fetchHistory(room);
    setMessages(hist);
    setHistLoading(false);
    if (hist.length > 0) setLastMsgMap((prev) => ({ ...prev, [user.username]: hist[hist.length - 1] }));
    setUnreadCountMap((prev) => ({ ...prev, [user.username]: 0 }));

    // Mark this conversation as read the moment it's opened — the unread
    // indicator for this user disappears from the list immediately.
    const nowIso = new Date().toISOString();
    await saveReadTimestamp(room, nowIso);
    setReadMap((prev) => ({ ...prev, [room]: nowIso }));
  };

  // ── TEXT MESSAGES ────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = sanitizeText(input.trim());
    if (!text || sending) return;
    setSending(true);

    try {
      if (editingMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMsg.id ? { ...m, message: text, content: text, is_edited: true } : m))
        );
        const headers = await authHeader();
        await API.patch(`/messages/message/${editingMsg.id}/`, { content: text }, { headers }).catch((err) => {
          console.error("[editMessage] error:", err?.response?.data || err.message);
          console.log("[editMessage] id:", editingMsg.id, "text:", text);
        });
        setEditingMsg(null);
        setInput("");
        inputRef.current?.focus();
        return;
      }

      const localId = `local_${Date.now()}`;
      const localMsg = {
        id: localId, type: MSG_TYPE.TEXT, message: text, content: text,
        sender: myUsername, sender_username: myUsername,
        timestamp: new Date().toISOString(), created_at: new Date().toISOString(),
        _local: true,
      };
      setMessages((prev) => [...prev, localMsg]);
      setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: localMsg }));
      setInput("");
      inputRef.current?.focus();

      const sent = sendMessage(text);
      if (!sent) {
        const headers = await authHeader();
        API.post(`/messages/message/`, { room: roomName, content: text }, { headers })
          .then((res) => {
            setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, ...res.data, _local: false } : m)));
            setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: res.data }));
          })
          .catch((err) => {
            console.error("[sendMessage:http] error:", err?.response?.data || err.message);
            setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, _failed: true } : m)));
          });
      }
    } catch (err) {
      console.error("[handleSend] error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleTypingInput = (text) => {
    setInput(text.slice(0, MAX_TEXT_LENGTH));
    if (connected) {
      const now = Date.now();
      if (now - lastTypingSentAt.current > 800) {
        sendTyping();
        lastTypingSentAt.current = now;
      }
    }
  };

  const startEdit = (msg) => {
    setEditingMsg(msg);
    setInput(msg.message || msg.content || "");
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const deleteMsg = async (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      const headers = await authHeader();
      await API.delete(`/messages/message/${msgId}/`, { headers });
    } catch (err) {
      console.error("[deleteMsg] error:", err?.response?.data || err.message);
    }
  };

  const confirmDeleteMsg = (msgId) => {
    Alert.alert("Xabarni o'chirish", "Ushbu xabarni o'chirmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "O'chirish", style: "destructive", onPress: () => deleteMsg(msgId) },
    ]);
  };

  const clearHistory = async () => {
    setMessages([]);
    if (activeUser) setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: null }));
    try {
      const headers = await authHeader();
      await API.delete(`/messages/history/clear/?room=${roomName}`, { headers });
    } catch (err) {
      console.error("[clearHistory] error:", err?.response?.data || err.message);
    }
  };

  const confirmClearHistory = () => {
    Alert.alert("Tarixni tozalash", "Ushbu suhbatdagi barcha xabarlar o'chib ketadi. Davom etasizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Tozalash", style: "destructive", onPress: clearHistory },
    ]);
  };

  const refreshChat = async () => {
    if (!roomName) return;
    setHistLoading(true);
    const hist = await fetchHistory(roomName);
    setMessages(hist);
    setHistLoading(false);
    if (hist.length > 0 && activeUser) {
      setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: hist[hist.length - 1] }));
    }
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, typing]);

  const filteredMessages = msgSearch.trim()
    ? messages.filter((m) => (m.message || m.content || "").toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  // FIX: API messages use message_type/attachments, while local messages use
  // type/media_url. Normalize both shapes before rendering.
  const getMessageType = (msg) => msg?.message_type || msg?.type || MSG_TYPE.TEXT;
  const getMediaUri = (msg) => {
    const attachment = msg?.attachments?.[0];
    const rawUri = msg?.media_url || attachment?.file || attachment?.url || msg?.file;
    if (!rawUri || typeof rawUri !== "string") return null;
    if (/^(https?:|file:|content:|data:|blob:)/i.test(rawUri)) return rawUri;
    const baseUrl = String(API.defaults?.baseURL || "").replace(/\/$/, "");
    return rawUri.startsWith("/") ? `${baseUrl}${rawUri}` : rawUri;
  };
  const getAttachment = (msg) => msg?.attachments?.[0] || {};

  // All images sent in this conversation, in order — powers the swipeable gallery
  // FIX: Include API messages (`message_type` + attachments) as well as local
  // messages (`type` + media_url) in the image gallery.
  const chatImageMessages = messages
    .filter((m) => getMessageType(m) === MSG_TYPE.IMAGE && getMediaUri(m))
    .map((m) => ({ ...m, media_url: getMediaUri(m) }));

  const openImageGallery = (msg) => {
    const idx = chatImageMessages.findIndex((m) => m.id === msg.id);
    setGalleryIndex(idx >= 0 ? idx : 0);
  };

  // ── MEDIA MESSAGES ───────────────────────────────────────────────────────

  const sendMediaMessage = async ({ uri, type, text, fileName, mimeType, fileSize, duration, replyTo }) => {
    if (!roomName || !activeUser || !uri) return;

    const limits = { [MSG_TYPE.IMAGE]: MAX_IMAGE_BYTES, [MSG_TYPE.VIDEO]: MAX_VIDEO_BYTES, [MSG_TYPE.AUDIO]: MAX_AUDIO_BYTES, [MSG_TYPE.VOICE]: MAX_AUDIO_BYTES };
    if (fileSize && limits[type] && fileSize > limits[type]) {
      Alert.alert("Fayl juda katta", `Maksimal hajm: ${formatFileSize(limits[type])}`);
      return;
    }

    const localId = `local_${Date.now()}`;
    const localMsg = {
      id: localId, type, media_url: uri, file_name: fileName, mime_type: mimeType,
      file_size: fileSize, duration, sender: myUsername, sender_username: myUsername,
      timestamp: new Date().toISOString(), created_at: new Date().toISOString(),
      _local: true, _uploading: true,
    };
    setMessages((prev) => [...prev, localMsg]);
    setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: localMsg }));

    try {
        const headers = await authHeader();
        const form = new FormData();

        form.append("receiver", activeUser.id);
        form.append("message_type", type);
        form.append("content", text || "");

        if (replyTo)
            form.append("reply_to", replyTo);

        form.append("attachment_type", type);

        form.append(
            "file",
            {
                uri,
                name: fileName,
                type: mimeType,
            }
        );

        try {
          const res = await API.post(
              "/messages/message/",
              form,
              {
                  headers: {
                      ...headers,
                      "Content-Type": "multipart/form-data",
                  },
              }
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === localId
                ? { ...msg, ...res.data, _uploading: false, _local: false }
                : msg
            )
          );
          setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: { ...localMsg, ...res.data, _uploading: false, _local: false } }));
        } catch (err) {
            console.log("========== BACKEND ERROR ==========");
            console.log("status:", err.response?.status);
            console.log("data:", JSON.stringify(err.response?.data, null, 2));
            console.log("==================================");
            setMessages((prev) => prev.map((msg) => (msg.id === localId ? { ...msg, _uploading: false, _failed: true } : msg)));
        }
    } catch (err) {
        console.log("========== ERROR ==========");
        console.log("message:", err.message);
        console.log("response:", err.response);
        console.log("data:", err.response?.data);
        console.log("status:", err.response?.status);
        console.log("===========================");
    }
  };

  const pickAndSendImage = async () => {
      try {
          const ok = await ensureMediaLibraryPermission();
          if (!ok) return;

          const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: false,
              quality: 0.8,
          });


          if (result.canceled) return;

          const asset = result.assets[0];

          await sendMediaMessage({
              uri: asset.uri,
              type: MSG_TYPE.IMAGE,
              fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
              mimeType: asset.mimeType ?? "image/jpeg",
              fileSize: asset.fileSize ?? 0,
          });
      } catch (e) {
          console.error("pick image error", e);
      }
  };

  const pickAndSendVideo = async () => {
    try {
      const ok = await ensureMediaLibraryPermission();
      if (!ok) return;
      const res = await ImagePicker.launchImageLibraryAsync({
                                      mediaTypes: ["videos"],
                                      quality: 0.7,
                                    });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      await sendMediaMessage({
        uri: asset.uri, type: MSG_TYPE.VIDEO,
        fileName: asset.fileName || "video.mp4", mimeType: asset.mimeType || "video/mp4",
        fileSize: asset.fileSize, duration: asset.duration ? asset.duration * 1000 : null,
      });
    } catch (err) {
      console.error("[pickAndSendVideo] error:", err);
    }
  };

  const openCameraAndSend = async () => {
    try {
      const ok = await ensureCameraPermission();
      if (!ok) return;
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      const isVideo = asset.type === "video";
      await sendMediaMessage({
        uri: asset.uri, type: isVideo ? MSG_TYPE.VIDEO : MSG_TYPE.IMAGE,
        fileName: isVideo ? "video.mp4" : "photo.jpg", mimeType: isVideo ? "video/mp4" : "image/jpeg",
        fileSize: asset.fileSize, duration: asset.duration ? asset.duration * 1000 : null,
      });
    } catch (err) {
      console.error("[openCameraAndSend] error:", err);
    }
  };

  const sendMusicFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      await sendMediaMessage({
        uri: file.uri,
        type: MSG_TYPE.MUSIC,
        fileName: file.name,
        mimeType: file.mimeType || "audio/mpeg",
        fileSize: file.size,
        duration: 0,
      });
    } catch (err) {
      console.error("[sendMusicFile]", err);
    }
  };

  const pickAndSendDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;

      const asset = res.assets?.[0];
      if (!asset) return;

      await sendMediaMessage({
        uri: asset.uri,
        type: MSG_TYPE.FILE,
        fileName: asset.name,
        mimeType: asset.mimeType || "application/octet-stream",
        fileSize: asset.size,
      });
    } catch (err) {
      console.error("[pickAndSendDocument] error:", err);
    }
  };

  const handleVoiceRecorded = (result) => {
    setPendingVoice(result);
  };

  const sendRecordingNow = async () => {
    // FIX: Allow sending directly from the recording row. Stopping first
    // finalizes the native file before it is uploaded.
    const result = await recorder.stop();
    if (result?.uri && result.duration >= MIN_VOICE_MS) {
      await sendMediaMessage({
        uri: result.uri,
        type: MSG_TYPE.VOICE,
        duration: result.duration,
        fileName: "voice.m4a",
        mimeType: "audio/m4a",
      });
    }
  };

  const sendPendingVoice = async () => {
    if (!pendingVoice?.uri) return;
    const voice = pendingVoice;
    setPendingVoice(null);
    await sendMediaMessage({
      uri: voice.uri,
      type: MSG_TYPE.VOICE,
      duration: voice.duration,
      fileName: "voice.m4a",
      mimeType: "audio/m4a",
    });
  };

  // ── WALLPAPER ────────────────────────────────────────────────────────────

  const applyWallpaperGradient = async (colors) => {
    const wp = { type: "gradient", colors };
    setWallpaper(wp);
    try {
      await AsyncStorage.setItem(`wallpaper_${roomName}`, JSON.stringify(wp));
    } catch (err) {
      console.error("[wallpaper] save gradient error:", err);
    }
  };

  const applyWallpaperCustom = async () => {
    try {
      const ok = await ensureMediaLibraryPermission();
      if (!ok) return;
      const res = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ["images"],
                                        quality: 0.8,
                                      });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      const wp = { type: "image", uri };
      setWallpaper(wp);
      await AsyncStorage.setItem(`wallpaper_${roomName}`, JSON.stringify(wp));
    } catch (err) {
      console.error("[wallpaper] custom error:", err);
    }
  };

  const resetWallpaper = async () => {
    setWallpaper(null);
    try {
      await AsyncStorage.removeItem(`wallpaper_${roomName}`);
    } catch (err) {
      console.error("[wallpaper] reset error:", err);
    }
  };

  // ── RENDER: USER LIST ────────────────────────────────────────────────────

  const renderUserRow = ({ item: u }) => {
    const isActive = activeUser?.username === u.username;
    const online = isOnline(u.username);
    const lastMsg = lastMsgMap[u.username];
    const unreadCount = unreadCountMap[u.username] || 0;
    const lastType = lastMsg ? getMessageType(lastMsg) : null;
    const lastIsMedia = lastMsg && lastType !== MSG_TYPE.TEXT;
    const mediaLabel = { image: "📷 Rasm", video: "🎥 Video", audio: "🎵 Audio", music: "🎵 Musiqa", voice: "🎤 Ovozli xabar", file: "📎 Fayl" }[lastType];
    const lastText = lastMsg ? (lastIsMedia ? mediaLabel : lastMsg.message || lastMsg.content || "") : null;
    const lastTime = lastMsg ? timeOnly(lastMsg.timestamp || lastMsg.created_at) : null;
    const isLastMine = lastMsg && (
      String(lastMsg.sender) === String(myUserId) ||
      lastMsg.sender === myUsername ||
      lastMsg.sender_username === myUsername
    );

    // Unread = the other person sent the last message, and it's newer than
    // the last time we opened this room (tracked locally).
    const isUnread = unreadCount > 0;

    const isTyping = typing[roomName] && typing[roomName].includes(u.username);

    return (
      <TouchableOpacity
        onPress={() => openChat(u)}
        style={[
          styles.userRow,
          {
            backgroundColor: isActive ? t.card : "transparent",
            borderLeftColor: isActive ? t.accent : "transparent",
          },
        ]}
      >
        <Avatar name={u.full_name || u.username} size={46} showRing={isActive} src={u.avatar} online={online} accentColor={t.accent} bgColor={t.bg} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <Text style={[styles.userName, { color: t.text, fontWeight: isUnread ? "800" : "700" }]} numberOfLines={1}>
              {u.full_name || u.username}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {isTyping ? (
                <Text style={{ fontSize: 11, color: t.accent, fontStyle: "italic" }}>Typing...</Text>
              ) : lastTime ? (
                <Text style={{ fontSize: 11, color: isUnread ? t.accent : t.sub, fontWeight: isUnread ? "700" : "400" }}>{lastTime}</Text>
              ) : null}
              {isUnread ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {lastText ? (
            <Text style={[styles.userSub, { color: isUnread ? t.text : t.sub, fontWeight: isUnread ? "600" : "400" }]} numberOfLines={1}>
              {isLastMine ? <Text style={{ color: t.accent, fontWeight: "600" }}>You: </Text> : null}
              {lastText.length > 36 ? lastText.slice(0, 36) + "…" : lastText}
            </Text>
          ) : (
            <Text style={[styles.userSub, { color: online ? "#22C55E" : t.sub, fontWeight: "500" }]}>
              {online ? "● Online" : "○ Offline"}
            </Text>
          )}
        </View>
        <IconChevronRight color={t.sub} />
      </TouchableOpacity>
    );
  };

  // ── RENDER: MESSAGE BUBBLE ───────────────────────────────────────────────

  const renderMessageContent = (msg, isMe) => {
    const messageType = getMessageType(msg);
    const mediaUri = getMediaUri(msg);
    const attachment = getAttachment(msg);
    switch (messageType) {
      case MSG_TYPE.IMAGE:
        return (
          <TouchableOpacity onPress={() => mediaUri && openImageGallery(msg)} activeOpacity={0.9} disabled={!mediaUri}>
            {mediaUri ? <Image source={{ uri: mediaUri }} style={styles.imageBubbleImg} /> : (
              <View style={[styles.imageBubbleImg, styles.mediaPlaceholder]}>
                <Text style={{ color: "#fff", fontSize: 12 }}>Rasm mavjud emas</Text>
              </View>
            )}
            {msg._uploading ? (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#bfc1bf" />
              </View>
            ) : null}
          </TouchableOpacity>
        );

      case MSG_TYPE.VIDEO:
        return <VideoMessageBubble uri={mediaUri} onPress={() => mediaUri && setViewerVideoUri(mediaUri)} />;
      case MSG_TYPE.VOICE:
        return <AudioMessageBubble uri={mediaUri} duration={msg.duration} isMe={isMe} theme={t} label="Ovozli xabar" />;
      case MSG_TYPE.AUDIO:
        return <AudioMessageBubble uri={mediaUri} duration={msg.duration} isMe={isMe} theme={t} label={msg.file_name || attachment.file_name} />;
      case MSG_TYPE.MUSIC:
        return <AudioMessageBubble uri={mediaUri} duration={msg.duration} isMe={isMe} theme={t} label={msg.file_name || attachment.file_name || "Musiqa"} />;
      case MSG_TYPE.FILE:
        return (
          <FileMessageBubble
            fileName={msg.file_name || attachment.file_name}
            fileSize={msg.file_size || attachment.file_size}
            isMe={isMe}
            theme={t}
            onOpen={() => mediaUri && Linking.openURL(mediaUri).catch((e) => console.error("[openFile] error:", e))}
          />
        );
      default:
        return (
          <Text style={{ color: isMe ? t.textMe : t.text, fontSize: 14, lineHeight: 20 }}>
            {msg.message || msg.content || ""}
            {(msg.edited || msg.is_edited) ? <Text style={{ fontSize: 10, opacity: 0.6 }}>  edited</Text> : null}
            {msg._local ? <Text style={{ fontSize: 10, opacity: 0.6 }}>  ⏳</Text> : null}
            {msg._failed ? <Text style={{ fontSize: 10, color: "#EF4444" }}>  ✕ yuborilmadi</Text> : null}
          </Text>
        );
    }
  };



  const renderMessage = ({ item: msg, index: i }) => {
    // FIX: History uses numeric sender IDs, while optimistic messages use
    // usernames. Compare both forms so each account sees the correct side.
    const isMe =
      String(msg.sender) === String(myUserId) ||
      msg.sender === myUsername ||
      msg.sender_username === myUsername;
    // FIX: Media detection must support both API and local message fields.
    const messageType = getMessageType(msg);
    const isMedia = [MSG_TYPE.IMAGE, MSG_TYPE.VIDEO].includes(messageType);
    const isDeletableMedia = [MSG_TYPE.IMAGE, MSG_TYPE.VIDEO, MSG_TYPE.VOICE, MSG_TYPE.AUDIO, MSG_TYPE.MUSIC, MSG_TYPE.FILE].includes(messageType);
    const prev = filteredMessages[i - 1];
    const next = filteredMessages[i + 1];
    const prevSender = prev?.sender || prev?.sender_username;
    const nextSender = next?.sender || next?.sender_username;
    const curSender = msg.sender || msg.sender_username;
    const showTop = prevSender !== curSender;
    const showBot = nextSender !== curSender;

    const bubbleRadius = isMe
      ? { borderTopLeftRadius: 18, borderTopRightRadius: showTop ? 18 : 4, borderBottomRightRadius: showBot ? 18 : 4, borderBottomLeftRadius: 18 }
      : { borderTopLeftRadius: showTop ? 18 : 4, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: showBot ? 18 : 4 };

    return (
      <View style={[styles.msgRow, { flexDirection: isMe ? "row-reverse" : "row", marginTop: showTop ? 10 : 2 }]}>
        {!isMe ? (
          <View style={{ width: 32 }}>
            {showBot ? <Avatar name={msg.sender_username || msg.sender} size={28} src={activeUser?.avatar} /> : null}
          </View>
        ) : null}
        <View style={[styles.bubbleWrap, { alignItems: isMe ? "flex-end" : "flex-start" }]}>
          {!isMe && showTop ? (
            <Text style={[styles.senderLabel, { color: t.sub }]}>@{msg.sender_username || msg.sender}</Text>
          ) : null}
          <TouchableOpacity
            onLongPress={() => setMsgMenuFor(msg)}
            activeOpacity={0.85}
            style={[
              isMedia ? styles.bubbleMedia : styles.bubble,
              bubbleRadius,
              {
                backgroundColor: isMedia ? "transparent" : (isMe ? t.bubbleMe : t.bubbleOther),
                opacity: msg._local && !msg._failed ? 0.85 : 1,
              },
            ]}
          >
            {renderMessageContent(msg, isMe)}
          </TouchableOpacity>
          {isMe && isDeletableMedia && !msg._local ? (
            <MediaDeleteButton onPress={() => confirmDeleteMsg(msg.id)} theme={t} />
          ) : null}
          {showBot ? (
            <Text style={[styles.msgTime, { color: t.sub, textAlign: isMe ? "right" : "left" }]}>
              {timeOnly(msg.timestamp || msg.created_at)}
              {msg._local && !msg._failed ? <Text style={{ color: "#F59E0B" }}> · sending</Text> : null}
              {msg._failed ? <Text style={{ color: "#EF4444" }}> · yuborilmadi</Text> : null}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const navItems = [
    { href: "/pages/home", active: false, Icon: IconHome },
    { href: "/pages/message", active: true, Icon: IconLogoGlobe },
    { href: "/pages/createPost", active: false, Icon: IconCreate, isCenter: true },
    { href: "/pages/reals", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: false, Icon: IconPerson },
  ];

  const msgMenuItems = msgMenuFor
    ? (
      String(msgMenuFor.sender) === String(myUserId) ||
      msgMenuFor.sender === myUsername ||
      msgMenuFor.sender_username === myUsername
      ? [
            ...(msgMenuFor.message_type === MSG_TYPE.TEXT || !msgMenuFor.message_type
              ? [{ label: "Edit", icon: <IconEdit color={t.text} />, action: () => startEdit(msgMenuFor) }]
              : []),
            { label: "Delete", icon: <IconTrash color="#EF4444" />, action: () => confirmDeleteMsg(msgMenuFor.id), danger: true },
          ]
        : [
            {
              label: "Copy",
              icon: <IconCopy color={t.text} />,
              action: () => Clipboard.setString(msgMenuFor.message || msgMenuFor.content || ""),
            },
          ])
    : [];

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.bg }]}>
      <DropMenu visible={headerMenuVisible} onClose={() => setHeaderMenuVisible(false)} theme={t} items={[
        { label: "Suhbat foni", icon: <IconPalette color={t.text} />, action: () => setWallpaperSheetVisible(true) },
        { label: "Refresh chat", icon: <IconRefresh color={t.text} />, action: refreshChat },
        { label: "Clear history", icon: <IconTrash color="#EF4444" />, action: confirmClearHistory, danger: true },
        { label: "Close chat", icon: <IconClose color={t.text} />, action: () => { setView("list"); setActiveUser(null); setRoomName(null); setMessages([]); } },
        { label: dark ? "Light mode" : "Dark mode", icon: dark ? <IconSun color={t.text} /> : <IconMoon color={t.text} />, action: () => setDark((d) => !d) },
      ]} />
      <DropMenu visible={!!msgMenuFor} onClose={() => setMsgMenuFor(null)} theme={t} items={msgMenuItems} />
      <AttachSheet
        visible={attachSheetVisible}
        onClose={() => setAttachSheetVisible(false)}
        theme={t}
        onPickImage={pickAndSendImage}
        onPickVideo={pickAndSendVideo}
        onSendMusicFile={sendMusicFile}
        onPickDocument={pickAndSendDocument}
        onOpenCamera={openCameraAndSend}
      />
      <WallpaperSheet
        visible={wallpaperSheetVisible}
        onClose={() => setWallpaperSheetVisible(false)}
        theme={t}
        onSelectGradient={applyWallpaperGradient}
        onSelectCustom={applyWallpaperCustom}
        onReset={resetWallpaper}
      />
      <ImageGalleryModal
        images={chatImageMessages}
        index={galleryIndex}
        onClose={() => setGalleryIndex(null)}
        onChangeIndex={setGalleryIndex}
      />
      <VideoViewerModal uri={viewerVideoUri} visible={!!viewerVideoUri} onClose={() => setViewerVideoUri(null)} />

      {/* ── LIST VIEW ── */}
      {view === "list" ? (
        <>
          <View style={[styles.listHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Messages</Text>
                <Text style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>@{myUsername}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDark((d) => !d)}
                style={[styles.iconBtn, { backgroundColor: t.card, borderColor: t.border }]}
              >
                {dark ? <IconSun color={t.sub} /> : <IconMoon color={t.sub} />}
              </TouchableOpacity>
            </View>
            <View style={[styles.searchWrap, { backgroundColor: t.card, borderColor: t.border }]}>
              <IconSearch color={t.sub} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search users..."
                placeholderTextColor={t.sub}
                style={[styles.searchInput, { color: t.text }]}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <IconClose color={t.sub} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {usersLoading ? (
            <View style={styles.centerFlex}>
              <ActivityIndicator size="large" color={t.accent} />
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: t.card }]}>
                <IconUsers color={t.sub} />
              </View>
              <Text style={{ color: t.sub, fontSize: 14 }}>No users found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item, i) => String(item.id || i)}
              renderItem={renderUserRow}
              contentContainerStyle={{ paddingBottom: 70 }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Bottom nav */}
          <View style={[styles.bottomNav, { backgroundColor: t.surface, borderTopColor: t.border }]}>
            {navItems.map((item, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(item.href)} style={styles.navItem}>
                <item.Icon color={item.active ? t.accent : t.sub} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        /* ── CHAT VIEW ── */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 15}
        >
          {!activeUser ? (
            <View style={styles.centerFlex}>
              <View style={[styles.emptyIconCircle, { backgroundColor: t.card }]}>
                <IconChatBubble size={32} color={t.sub} />
              </View>
              <Text style={{ color: t.sub, fontSize: 14, marginTop: 12 }}>Select a conversation</Text>
            </View>
          ) : (
            <>
              {/* Chat header */}
              <View style={[styles.chatHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
                <TouchableOpacity
                  onPress={() => { setView("list"); setShowMsgSearch(false); setMsgSearch(""); setEditingMsg(null); }}
                  style={styles.backBtn}
                >
                  <IconBack color={t.accent} />
                </TouchableOpacity>

                <Avatar name={activeUser.full_name || activeUser.username} size={38} src={activeUser.avatar} online={isOnline(activeUser.username)} bgColor={t.surface} />

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.chatTitle, { color: t.text }]} numberOfLines={1}>
                    {activeUser.full_name || activeUser.username}
                  </Text>
                  <Text style={[styles.chatStatus, { color: isOnline(activeUser.username) ? "#22C55E" : t.sub }]}>
                    {connecting ? "Connecting..." : isOnline(activeUser.username) ? "● Online" : "○ Offline"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => { setShowMsgSearch((s) => !s); setMsgSearch(""); }}
                  style={[
                    styles.iconBtn,
                    { backgroundColor: showMsgSearch ? t.accent : t.card, borderColor: t.border },
                  ]}
                >
                  <IconSearch color={showMsgSearch ? "#fff" : t.sub} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setHeaderMenuVisible(true)} style={[styles.iconBtn, { backgroundColor: t.card, borderColor: t.border }]}>
                  <IconMoreVertical color={t.sub} />
                </TouchableOpacity>
              </View>

              {/* In-chat search */}
              {showMsgSearch ? (
                <View style={{ padding: 10, paddingHorizontal: 14, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border }}>
                  <View style={[styles.searchWrap, { backgroundColor: t.card, borderColor: t.accent }]}>
                    <IconSearch color={t.sub} />
                    <TextInput
                      autoFocus
                      value={msgSearch}
                      onChangeText={setMsgSearch}
                      placeholder="Search messages..."
                      placeholderTextColor={t.sub}
                      style={[styles.searchInput, { color: t.text }]}
                    />
                    {msgSearch ? (
                      <TouchableOpacity onPress={() => setMsgSearch("")}>
                        <IconClose color={t.sub} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {msgSearch ? (
                    <Text style={{ fontSize: 11, color: t.sub, marginTop: 5, paddingLeft: 2 }}>
                      {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""} found
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* Messages + wallpaper */}
              <View style={{ flex: 1 }}>
                {wallpaper?.type === "gradient" ? (
                  <LinearGradient colors={wallpaper.colors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                ) : wallpaper?.type === "image" ? (
                  <ImageBackground source={{ uri: wallpaper.uri }} style={StyleSheet.absoluteFill} resizeMode="cover">
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.18)" }]} />
                  </ImageBackground>
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg }]} />
                )}

                {histLoading ? (
                  <View style={styles.centerFlex}>
                    <ActivityIndicator size="large" color={t.accent} />
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={filteredMessages}
                    keyExtractor={(item, i) => String(item.id || i)}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 14, paddingBottom: 8, flexGrow: 1 }}
                    style={{ backgroundColor: "transparent" }}
                    ListEmptyComponent={
                      <View style={[styles.emptyState, { marginTop: 60 }]}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: t.card }]}>
                          <IconChatBubble size={28} color={t.sub} />
                        </View>
                        <Text style={{ color: t.sub, fontSize: 14 }}>
                          {msgSearch ? "No messages found" : "Send the first message!"}
                        </Text>
                      </View>
                    }
                    ListFooterComponent={
                      typing ? (
                        <View style={[styles.msgRow, { marginTop: 8 }]}>
                          <View style={[styles.typingBubble, { backgroundColor: t.bubbleOther }]}>
                            {[0, 1, 2].map((d) => (
                              <TypingDot key={d} delay={d * 180} color={t.sub} />
                            ))}
                          </View>
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>

              {/* Input area */}
              <View style={[styles.inputArea, { backgroundColor: t.surface, borderTopColor: t.border }]}>
                {editingMsg ? (
                  <View style={[styles.editingBar, { backgroundColor: t.card, borderColor: t.accent }]}>
                    <IconEdit size={12} color={t.accent} />
                    <Text style={{ flex: 1, fontSize: 12, color: t.sub, marginLeft: 8 }}>
                      Editing: <Text style={{ color: t.text, fontStyle: "italic" }}>
                        {(editingMsg.message || "").slice(0, 42)}{(editingMsg.message || "").length > 42 ? "…" : ""}
                      </Text>
                    </Text>
                    <TouchableOpacity onPress={() => { setEditingMsg(null); setInput(""); }}>
                      <IconClose size={14} color={t.sub} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {!connected && !connecting ? (
                  <View style={[styles.offlineBar, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text>⚠️</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: t.sub, marginLeft: 6 }}>
                      Offline — messages will be saved
                    </Text>
                    <TouchableOpacity onPress={reconnect}>
                      <Text style={{ color: t.accent, fontSize: 12, fontWeight: "700" }}>Reconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {recorder.isRecording ? (
                  <View style={[styles.recordingRow, { backgroundColor: t.inputBg, borderColor: "#EF4444" }]}>
                    <View style={styles.recDot} />
                    <Text style={{ color: t.text, fontSize: 13, fontWeight: "700" }}>{formatDuration(recorder.durationMs)}</Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                      <IconChevronLeft size={13} color={t.sub} />
                      <Text style={{ color: t.sub, fontSize: 12, marginLeft: 2 }}>Bekor qilish uchun suring</Text>
                    </View>
                    <TouchableOpacity
                      onPress={sendRecordingNow}
                      accessibilityLabel="Send voice message now"
                      style={[styles.voiceActionBtn, { backgroundColor: t.accent }]}
                    >
                      <IconSend size={15} color="#1525b3" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {pendingVoice ? (
                  <View style={[styles.voicePreviewRow, { backgroundColor: t.inputBg, borderColor: t.accent }]}> 
                    <AudioMessageBubble
                      uri={pendingVoice.uri}
                      duration={pendingVoice.duration}
                      isMe={false}
                      theme={t}
                      label="Ovozli xabar"
                    />
                    <View style={styles.voicePreviewActions}>
                      <TouchableOpacity
                        onPress={() => setPendingVoice(null)}
                        accessibilityLabel="Delete recorded voice message"
                        style={[styles.voiceActionBtn, { backgroundColor: "#FEE2E2" }]}
                      >
                        <IconTrash size={14} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={sendPendingVoice}
                        accessibilityLabel="Send recorded voice message"
                        style={[styles.voiceActionBtn, { backgroundColor: t.accent }]}
                      >
                        <IconSend size={15} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={[styles.inputWrap, { backgroundColor: t.inputBg, borderColor: editingMsg ? t.accent : t.border, display: recorder.isRecording || pendingVoice ? "none" : "flex" }]}> 
                  <TouchableOpacity onPress={() => setAttachSheetVisible(true)} style={styles.attachBtn}>
                    <IconPaperclip color={t.sub} />
                  </TouchableOpacity>
                  <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={handleTypingInput}
                    placeholder={editingMsg ? "Enter new text..." : `Message @${activeUser.username}...`}
                    placeholderTextColor={t.sub}
                    multiline
                    maxLength={MAX_TEXT_LENGTH}
                    style={[styles.msgInput, { color: t.text }]}
                  />
                  {input.trim() ? (
                    <TouchableOpacity
                      onPress={handleSend}
                      disabled={sending}
                      style={[styles.sendBtn, { backgroundColor: t.accent, opacity: sending ? 0.6 : 1 }]}
                    >
                      {editingMsg ? <IconCheck /> : <IconSend />}
                    </TouchableOpacity>
                  ) : (
                    <VoiceRecordButton recorder={recorder} onRecorded={handleVoiceRecorded} theme={t} />
                  )}
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TYPING DOT (animated)
// ════════════════════════════════════════════════════════════════════════════

function TypingDot({ delay = 0, color = "#6B7280" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <Animated.View
      style={{
        width: 6, height: 6, borderRadius: 3, backgroundColor: color,
        marginHorizontal: 2, transform: [{ translateY }],
      }}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ERROR BOUNDARY — catches unexpected render errors and logs them to console
// ════════════════════════════════════════════════════════════════════════════

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[ChatScreen] Uncaught render error:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F3F5FC" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#111827" }}>Nimadir xato ketdi</Text>
          <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>
            Chat ekranida kutilmagan xatolik yuz berdi. Iltimos ilovani qayta oching. Batafsil ma'lumot terminalda ko'rsatildi.
          </Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function ChatScreen() {
  return (
    <ChatErrorBoundary>
      <ChatScreenInner />
    </ChatErrorBoundary>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },

  // List header
  listHeader: { padding: 18, paddingTop: 16, gap: 12, borderBottomWidth: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, paddingHorizontal: 12, height: 42, borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // User row
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderLeftWidth: 3 },
  userName: { fontSize: 14, fontWeight: "700" },
  userSub: { fontSize: 12, marginTop: 2 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#3B82F6" },
  unreadBadge: { minWidth: 24, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Empty / center
  centerFlex: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },

  // Bottom nav
  bottomNav: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", height: 56, borderTopWidth: 1 },
  navItem: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // Chat header
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6, borderRadius: 10 },
  chatTitle: { fontSize: 15, fontWeight: "700" },
  chatStatus: { fontSize: 11, marginTop: 1, fontWeight: "500" },

  // Messages
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  bubbleWrap: { maxWidth: "75%" },
  senderLabel: { fontSize: 10, fontWeight: "600", marginBottom: 3, marginLeft: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMedia: { padding: 3, overflow: "hidden" },
  msgTime: { fontSize: 10, marginTop: 3, marginHorizontal: 3, fontWeight: "500" },
  typingBubble: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18, marginLeft: 40,
  },

  // Media bubbles
  imageBubbleImg: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.55, borderRadius: 36 },
  // FIX: Prevent an invisible/empty image bubble when the attachment URL is missing.
  mediaPlaceholder: { backgroundColor: "#475569", alignItems: "center", justifyContent: "center" },
  videoBubble: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.55, borderRadius: 16, backgroundColor: "#000" },
  videoPlayOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  uploadOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", borderRadius: 16,
  },
  audioBubbleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, minWidth: 190, maxWidth: 240 },
  audioPlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginRight: 10 },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3, height: 16 },
  waveBar: { width: 2.5, borderRadius: 2 },
  fileBubbleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, minWidth: 190, maxWidth: 240 },
  filesIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },

  // Fullscreen viewers
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  viewerCloseBtn: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
  viewerCounter: { position: "absolute", top: 55, alignSelf: "center", color: "#fff", fontSize: 13, fontWeight: "600", zIndex: 10 },
  viewerPage: { width: SCREEN_W, alignItems: "center", justifyContent: "center" },
  viewerImage: { width: SCREEN_W, height: "80%" },
  viewerVideo: { width: SCREEN_W, height: "60%" },

  // Input area
  inputArea: { padding: 10, paddingHorizontal: 14, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
  editingBar: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  offlineBar: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1.5,
  },
  attachBtn: { width: 30, height: 36, alignItems: "center", justifyContent: "center" },
  msgInput: { flex: 1, fontSize: 14, maxHeight: 100, paddingTop: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recordingRow: { flexDirection: "row", alignItems: "center", padding: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, gap: 8 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#EF4444" },
  recCancelBtn: { padding: 6 },
  voicePreviewRow: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1.5, paddingLeft: 4, paddingRight: 8 },
  voicePreviewActions: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 6 },
  voiceActionBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mediaDeleteBtn: { alignSelf: "flex-end", width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 4 },

  // Dropdown menu
  dropOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  dropMenuCard: { width: 200, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  dropMenuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 },

  // Bottom sheets (attach / wallpaper)
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheetCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingTop: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  sheetItem: { width: (SCREEN_W - 40 - 54) / 4, alignItems: "center" },
  sheetIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },

  wallpaperCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingTop: 10, paddingBottom: 30 },
  catTabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  wallGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  wallSwatchWrap: { width: (SCREEN_W - 40 - 36) / 4, height: 70, borderRadius: 14, overflow: "hidden" },
  wallSwatch: { width: "100%", height: "100%" },
  resetWallBtn: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", marginBottom: 16 },
  customWallBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
  },
});