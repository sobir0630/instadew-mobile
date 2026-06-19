import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/server";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Animated,
  Clipboard,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Polygon } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

// ════════════════════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════════════════════

let _myUsernameCache = null;
async function getMyUser() {
  if (_myUsernameCache) return _myUsernameCache;
  const u = (await AsyncStorage.getItem("username")) || (await AsyncStorage.getItem("login_username")) || "me";
  _myUsernameCache = u;
  return u;
}
async function authHeader() {
  const token = await AsyncStorage.getItem("token");
  return { Authorization: `Bearer ${token?.trim()}` };
}

export function buildRoomName(u1, u2) {
  return [u1, u2].sort().join("_");
}

async function fetchHistory(roomName) {
  try {
    const headers = await authHeader();
    const res = await API.get(`/messages/history/`, { params: { room: roomName }, headers });
    const d = res.data;
    return Array.isArray(d) ? d : d?.results || d?.messages || [];
  } catch {
    return [];
  }
}

async function fetchUsers() {

  const token = await AsyncStorage.getItem("token");

  try {
    const headers = await authHeader();
    const res = await API.get(`/users/register/`, { headers });
    const d = res.data;
    return Array.isArray(d) ? d : d?.results || [];
  } catch (err) {
        console.log("FULL ERROR:", err);
        console.log("MESSAGE:", err?.message);
        console.log("RESPONSE:", err?.response);
        console.log("REQUEST:", err?.request);
        return [];
  }
}

async function fetchAllLastMessages(users, myUsername) {
  const entries = await Promise.all(
    users.map(async (u) => {
      const room = buildRoomName(myUsername, u.username);
      const hist = await fetchHistory(room);
      const last = hist.length > 0 ? hist[hist.length - 1] : null;
      return [u.username, last];
    })
  );
  return Object.fromEntries(entries);
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
  } catch {
    return "";
  }
}

function getInitials(name = "") {
  const s = String(name || "").trim();
  if (!s) return "?";
  return s.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
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

  const WS_URL = "ws://10.13.93.81:8000";

  useEffect(() => {
    getMyUser().then((u) => (myUserRef.current = u));
  }, []);

  const connect = useCallback(() => {
    if (!roomName) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setConnecting(true);
    const ws = new WebSocket(`${WS_URL}/ws/chat/${roomName}/`);
    wsRef.current = ws;

    ws.onopen = () => { setConnected(true); setConnecting(false); };
    ws.onerror = () => { setConnecting(false); };
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

        if (t === "chat_message" || data.message) {
          const msgText = data.message || data.text || data.content || "";
          const sender = data.sender || data.username || data.sender_username || "?";

          setMessages((prev) => {
            const newMsg = {
              id: data.id || `ws_${Date.now()}`,
              message: msgText,
              content: msgText,
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
      } catch {}
    };
  }, [roomName]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((text) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
    wsRef.current.send(
      JSON.stringify({ type: "chat_message", message: text, sender: myUserRef.current, timestamp: new Date().toISOString() })
    );
    return true;
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", sender: myUserRef.current }));
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
const IconCreate = ({ size = 22, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 3h18v18H3z" opacity="0" />
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

// ════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ════════════════════════════════════════════════════════════════════════════

function Avatar({ name = "", size = 40, showRing = false, src = null, online = null, accentColor, bgColor }) {
  const [c1, c2] = getPalette(name);
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
          <Text style={{ fontSize: size * 0.36, fontWeight: "700", color: "#fff" }}>{getInitials(name)}</Text>
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

export default function ChatScreen() {
  const router = useRouter();

  const [myUsername, setMyUsername] = useState("me");
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("list"); // "list" | "chat"

  const [users, setUsers] = useState([]);
  const [lastMsgMap, setLastMsgMap] = useState({});
  const [usersLoading, setUsersLoading] = useState(true);
  const [onlineMap, setOnlineMap] = useState({});

  const [activeUser, setActiveUser] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [input, setInput] = useState("");
  const [histLoading, setHistLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);

  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [msgMenuFor, setMsgMenuFor] = useState(null); // message currently showing action menu

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);

  const { messages, setMessages, connected, connecting, typing, sendMessage, sendTyping, reconnect } = useChat(roomName);

  const t = dark ? DARK : LIGHT;

  useEffect(() => {
    getMyUser().then(setMyUsername);
  }, []);

  // Load users + last messages
  useEffect(() => {
    (async () => {
      const me = await getMyUser();
      const all = await fetchUsers();
      const others = all.filter((u) => u.username !== me);
      setUsers(others);
      setUsersLoading(false);
      const map = await fetchAllLastMessages(others, me);
      setLastMsgMap(map);
    })();
  }, []);

  // Presence WebSocket
  useEffect(() => {
    let ws, retryTimer;
    const WS_URL2 = "ws://10.13.93.81:8000";

    const tryConnect = () => {
      try {
        ws = new WebSocket(`${WS_URL2}/ws/presence/`);
        ws.onopen = () => console.log("presence ws connected");
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
          } catch {}
        };
        ws.onclose = () => { retryTimer = setTimeout(tryConnect, 5000); };
      } catch {}
    };
    tryConnect();
    return () => { ws?.close(); clearTimeout(retryTimer); };
  }, []);

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
    const hist = await fetchHistory(room);
    setMessages(hist);
    setHistLoading(false);
    if (hist.length > 0) setLastMsgMap((prev) => ({ ...prev, [user.username]: hist[hist.length - 1] }));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (editingMsg) {
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMsg.id ? { ...m, message: text, content: text, is_edited: true } : m))
      );
      const headers = await authHeader();
      API.patch(`/messages/message/${editingMsg.id}/`, { content: text }, { headers }).catch(() => {});
      setEditingMsg(null);
      setInput("");
      inputRef.current?.focus();
      return;
    }

    const localId = `local_${Date.now()}`;
    const localMsg = {
      id: localId, message: text, content: text,
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
        .catch(() => {});
    }
  };

  const handleTypingInput = (text) => {
    setInput(text);
    clearTimeout(typingRef.current);
    if (connected) {
      sendTyping();
      typingRef.current = setTimeout(() => {}, 1000);
    }
  };

  const startEdit = (msg) => {
    setEditingMsg(msg);
    setInput(msg.message || msg.content || "");
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const deleteMsg = async (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    const headers = await authHeader();
    API.delete(`/messages/message/${msgId}/`, { headers }).catch(() => {});
  };

  const clearHistory = async () => {
    setMessages([]);
    if (activeUser) setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: null }));
    const headers = await authHeader();
    API.delete(`/messages/history/clear/?room=${roomName}`, { headers }).catch(() => {});
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

  // ── RENDER: USER LIST ───────────────────────────────────────────────────

  const renderUserRow = ({ item: u }) => {
    const isActive = activeUser?.username === u.username;
    const online = isOnline(u.username);
    const lastMsg = lastMsgMap[u.username];
    const lastText = lastMsg ? lastMsg.message || lastMsg.content || "" : null;
    const lastTime = lastMsg ? timeOnly(lastMsg.timestamp || lastMsg.created_at) : null;
    const isLastMine = lastMsg && (lastMsg.sender === myUsername || lastMsg.sender_username === myUsername);

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
            <Text style={[styles.userName, { color: t.text }]} numberOfLines={1}>
              {u.full_name || u.username}
            </Text>
            {lastTime ? <Text style={{ fontSize: 11, color: t.sub }}>{lastTime}</Text> : null}
          </View>
          {lastText ? (
            <Text style={[styles.userSub, { color: t.sub }]} numberOfLines={1}>
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

  const renderMessage = ({ item: msg, index: i }) => {
    const isMe = msg.sender === myUsername || msg.sender_username === myUsername;
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
              styles.bubble,
              bubbleRadius,
              {
                backgroundColor: isMe ? t.bubbleMe : t.bubbleOther,
                opacity: msg._local ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: isMe ? t.textMe : t.text, fontSize: 14, lineHeight: 20 }}>
              {msg.message || msg.content || ""}
              {(msg.edited || msg.is_edited) ? <Text style={{ fontSize: 10, opacity: 0.6 }}>  edited</Text> : null}
              {msg._local ? <Text style={{ fontSize: 10, opacity: 0.6 }}>  ⏳</Text> : null}
            </Text>
          </TouchableOpacity>
          {showBot ? (
            <Text style={[styles.msgTime, { color: t.sub, textAlign: isMe ? "right" : "left" }]}>
              {timeOnly(msg.timestamp || msg.created_at)}
              {msg._local ? <Text style={{ color: "#F59E0B" }}> · sending</Text> : null}
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
    { href: "/pages/movie", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: false, Icon: IconPerson },
  ];

  const msgMenuItems = msgMenuFor
    ? (msgMenuFor.sender === myUsername || msgMenuFor.sender_username === myUsername
        ? [
            { label: "Edit", icon: <IconEdit color={t.text} />, action: () => startEdit(msgMenuFor) },
            { label: "Delete", icon: <IconTrash color="#EF4444" />, action: () => deleteMsg(msgMenuFor.id), danger: true },
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
        { label: "Refresh chat", icon: <IconRefresh color={t.text} />, action: refreshChat },
        { label: "Clear history", icon: <IconTrash color="#EF4444" />, action: clearHistory, danger: true },
        { label: "Close chat", icon: <IconClose color={t.text} />, action: () => { setView("list"); setActiveUser(null); setRoomName(null); setMessages([]); } },
        { label: dark ? "Light mode" : "Dark mode", icon: dark ? <IconSun color={t.text} /> : <IconMoon color={t.text} />, action: () => setDark((d) => !d) },
      ]} />
      <DropMenu visible={!!msgMenuFor} onClose={() => setMsgMenuFor(null)} theme={t} items={msgMenuItems} />

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
            <TouchableOpacity
                key={i}
                onPress={() => router.push(item.href)}
                style={styles.navItem}
                >
                <item.Icon color={item.active ? t.accent : t.sub} />
            </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        /* ── CHAT VIEW ── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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

              {/* Messages */}
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
                        <Avatar name={activeUser.username} size={28} />
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

                <View style={[styles.inputWrap, { backgroundColor: t.inputBg, borderColor: editingMsg ? t.accent : t.border }]}>
                  <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={handleTypingInput}
                    placeholder={editingMsg ? "Enter new text..." : `Message @${activeUser.username}...`}
                    placeholderTextColor={t.sub}
                    multiline
                    style={[styles.msgInput, { color: t.text }]}
                  />
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={!input.trim()}
                    style={[styles.sendBtn, { backgroundColor: input.trim() ? t.accent : t.border }]}
                  >
                    {editingMsg ? <IconCheck /> : <IconSend />}
                  </TouchableOpacity>
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
  msgTime: { fontSize: 10, marginTop: 3, marginHorizontal: 3, fontWeight: "500" },
  typingBubble: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18, marginLeft: 6,
  },

  // Input area
  inputArea: { padding: 10, paddingHorizontal: 14, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
  editingBar: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  offlineBar: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5,
  },
  msgInput: { flex: 1, fontSize: 14, maxHeight: 100, paddingTop: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // Dropdown menu
  dropOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  dropMenuCard: { width: 200, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  dropMenuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 },
});