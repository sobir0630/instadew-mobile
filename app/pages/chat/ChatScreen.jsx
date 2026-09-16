import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert,
  Clipboard,
  FlatList, ImageBackground, Keyboard,
  KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";

import API from "../../api/server"; // loyihangizga qarab moslang

import { MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, MAX_TEXT_LENGTH, MAX_VIDEO_BYTES, MIN_VOICE_MS, MSG_TYPE } from "./constants/config";
import {
  IconBack,
  IconChatBubble,
  IconCheck,
  IconChevronLeft,
  IconClose,
  IconCopy,
  IconCreate,
  IconEdit,
  IconHome, IconLogoGlobe,
  IconMoon,
  IconMoreVertical,
  IconMovie,
  IconPalette,
  IconPaperclip,
  IconPerson,
  IconRefresh,
  IconSearch,
  IconSend,
  IconSun,
  IconTrash,
  IconUsers,
} from "./constants/icons";
import { styles } from "./constants/styles";
import { DARK, LIGHT } from "./constants/theme";

import { filterByCategory } from "./utils/categoryFilter";
import { fetchAllLastMessages, fetchHistory, fetchUsers } from "./utils/chatApi";
import { authHeader, buildRoomName, formatDuration, formatFileSize, getMyUser, getMyUserId, sanitizeText } from "./utils/helpers";
import { ensureCameraPermission, ensureMediaLibraryPermission } from "./utils/permissions";
import { loadAllReadTimestamps, saveReadTimestamp } from "./utils/readTracking";

import { useChat } from "./hooks/useChat";
import { useMusicPlayer } from "./hooks/useMusicPlayer";
import { usePresence } from "./hooks/usePresence";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";

import AttachSheet from "./components/AttachSheet";
import Avatar from "./components/Avatar";
import CategoryTabs from "./components/CategoryTabs";
import ChatErrorBoundary from "./components/ChatErrorBoundary";
import DropMenu from "./components/DropMenu";
import ImageGalleryViewer from "./components/media/ImageGalleryViewer";
import MusicPlayerModal from "./components/media/MusicPlayerModal";
import VideoGalleryViewer from "./components/media/VideoGalleryViewer";
import { AudioMessageBubble } from "./components/MediaBubbles";
import MessageBubble, { getMediaUri, getMessageType } from "./components/MessageBubble";
import TypingDot from "./components/TypingDot";
import UserListRow from "./components/UserListRow";
import VoiceRecordButton from "./components/VoiceRecordButton";
import WallpaperSheet from "./components/WallpaperSheet";

// ════════════════════════════════════════════════════════════════════════════
//  ChatScreenInner — asosiy ekran. Bu fayl faqat ORKESTRATSIYA qiladi:
//  hook'lardan holatni oladi, komponentlarga uzatadi. Har bir alohida mantiq
//  (API, websocket, ovoz yozish, musiqa) o'z fayliga chiqarilgan.
// ════════════════════════════════════════════════════════════════════════════

function ChatScreenInner() {
  const router = useRouter();

  const [myUsername, setMyUsername] = useState("me");
  const [myUserId, setMyUserId] = useState(null);
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("list");

  const [users, setUsers] = useState([]);
  const [lastMsgMap, setLastMsgMap] = useState({});
  const [unreadCountMap, setUnreadCountMap] = useState({});
  const [usersLoading, setUsersLoading] = useState(true);
  const [readMap, setReadMap] = useState({});

  // 🆕 Tanlangan kategoriya (All / Unread / Channels / Bots / Groups)
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [activeUser, setActiveUser] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [input, setInput] = useState("");
  const [histLoading, setHistLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [pendingVoice, setPendingVoice] = useState(null);

  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [msgMenuFor, setMsgMenuFor] = useState(null);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [wallpaperSheetVisible, setWallpaperSheetVisible] = useState(false);
  const [wallpaper, setWallpaper] = useState(null);

  const openMsgMenu = (msg, event) => {
    const pageY = event?.nativeEvent?.pageY ?? 180;
    const pageX = event?.nativeEvent?.pageX ?? 220;
    setMsgMenuFor({ msg, anchor: { top: Math.max(40, pageY - 80), left: Math.max(12, Math.min(pageX - 110, 220)) } });
  };

  // 🆕 Rasm / video galereya va musiqa pleyeri holatlari
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [videoGalleryIndex, setVideoGalleryIndex] = useState(null);
  const [musicPlayerVisible, setMusicPlayerVisible] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingSentAt = useRef(0);

  const { messages, setMessages, connected, connecting, typing, sendMessage, sendTyping, reconnect } = useChat(roomName);
  const { isOnline } = usePresence();
  const recorder = useVoiceRecorder();
  const musicPlayer = useMusicPlayer(); // 🆕 to'liq musiqa pleyeri

  const t = dark ? DARK : LIGHT;

  useEffect(() => {
    Promise.all([getMyUser(), getMyUserId()]).then(([username, userId]) => {
      setMyUsername(username);
      setMyUserId(userId);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyUser();
        const all = await fetchUsers();
        const currentId = await getMyUserId();
        const others = all.filter((u) => u.username !== me && String(u.id) !== String(currentId));
        setUsers(others);
        setUsersLoading(false);
        const reads = await loadAllReadTimestamps();
        const messageMap = await fetchAllLastMessages(others, me, currentId, reads);
        const lastMap = {}; const unreadMap = {};
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

  useEffect(() => {
    if (view !== "list" || !myUsername || users.length === 0) return undefined;
    let cancelled = false;
    const refreshUnreadCounts = async () => {
      const messageMap = await fetchAllLastMessages(users, myUsername, myUserId, readMap);
      if (cancelled) return;
      const nextLast = {}; const nextUnread = {};
      Object.entries(messageMap).forEach(([username, value]) => {
        nextLast[username] = value.last;
        nextUnread[username] = value.unreadCount;
      });
      setLastMsgMap(nextLast);
      setUnreadCountMap(nextUnread);
    };
    const timer = setInterval(refreshUnreadCounts, 10000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [view, users, myUsername, myUserId, readMap]);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(showEvt, () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 60);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (view === "chat" && roomName && messages.length > 0) {
      const nowIso = new Date().toISOString();
      saveReadTimestamp(roomName, nowIso);
      setReadMap((prev) => ({ ...prev, [roomName]: nowIso }));
    }
  }, [messages.length, view, roomName]);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, typing]);

  const sortedUsers = [...users].sort((a, b) => {
    const la = lastMsgMap[a.username];
    const lb = lastMsgMap[b.username];
    if (la && lb) return new Date(lb.timestamp || lb.created_at) - new Date(la.timestamp || la.created_at);
    if (la) return -1;
    if (lb) return 1;
    return (a.full_name || a.username).localeCompare(b.full_name || b.username);
  });

  const searchedUsers = sortedUsers.filter(
    (u) =>
      lastMsgMap[u.username] && (
        !search.trim() ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
      )
  );

  // 🆕 Kategoriya bo'yicha filtr (All / Unread / Channels / Bots / Groups)
  const filteredUsers = filterByCategory(searchedUsers, selectedCategory, { unreadCountMap });

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
    const nowIso = new Date().toISOString();
    await saveReadTimestamp(room, nowIso);
    setReadMap((prev) => ({ ...prev, [room]: nowIso }));
  };

  // ── TEXT MESSAGES ────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = sanitizeText(input.trim(), MAX_TEXT_LENGTH);
    if (!text || sending) return;
    setSending(true);
    try {
      if (editingMsg) {
        setMessages((prev) => prev.map((m) => (m.id === editingMsg.id ? { ...m, message: text, content: text, is_edited: true, edited: true } : m)));
        const headers = await authHeader();
        await API.patch(`/messages/message/${editingMsg.id}/`, { content: text, is_edited: true }, { headers }).catch((err) => {
          console.error("[editMessage] error:", err?.response?.data || err.message);
        });
        setEditingMsg(null);
        setReplyTo(null);
        setInput("");
        inputRef.current?.focus();
        return;
      }

      const replyToId = replyTo?.id ?? null;
      const localMsg = {
        id: `local_${Date.now()}`, type: MSG_TYPE.TEXT, message: text, content: text,
        sender: myUsername, sender_username: myUsername,
        timestamp: new Date().toISOString(), created_at: new Date().toISOString(),
        _local: true,
        ...(replyToId ? { reply_to: { ...replyTo, id: replyToId, content: replyTo.message || replyTo.content || replyTo.file_name || "Media" }, reply_to_id: replyToId } : {}),
      };
      setMessages((prev) => [...prev, localMsg]);
      setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: localMsg }));
      setInput("");
      setReplyTo(null);
      inputRef.current?.focus();

      const sent = sendMessage(text, replyToId ? { reply_to: replyToId, reply_to_id: replyToId } : {});
      if (!sent) {
        const headers = await authHeader();
        API.post(`/messages/message/`, { room: roomName, content: text, reply_to: replyToId }, { headers })
          .then((res) => {
            setMessages((prev) => prev.map((m) => (m.id === localMsg.id ? { ...m, ...res.data, _local: false } : m)));
            setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: res.data }));
          })
          .catch((err) => {
            console.error("[sendMessage:http] error:", err?.response?.data || err.message);
            setMessages((prev) => prev.map((m) => (m.id === localMsg.id ? { ...m, _failed: true } : m)));
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
      if (now - lastTypingSentAt.current > 800) { sendTyping(); lastTypingSentAt.current = now; }
    }
  };

  const startEdit = (msg) => {
    setReplyTo(null);
    setEditingMsg(msg);
    setInput(msg.message || msg.content || "");
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const startReply = (msg) => {
    setEditingMsg(null);
    setReplyTo(msg);
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

  const cancelReply = () => setReplyTo(null);

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
    if (hist.length > 0 && activeUser) setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: hist[hist.length - 1] }));
  };

  const filteredMessages = msgSearch.trim()
    ? messages.filter((m) => (m.message || m.content || "").toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  const apiBaseUrl = API.defaults?.baseURL;
  const messagesWithUri = filteredMessages.map((m) => ({ ...m, _mediaUri: getMediaUri(m, apiBaseUrl) }));

  // 🆕 Galereyalar uchun ro'yxatlar (chatdagi barcha rasm / video / musiqa)
  const chatImageMessages = messagesWithUri.filter((m) => getMessageType(m) === MSG_TYPE.IMAGE && m._mediaUri)
    .map((m) => ({ ...m, media_url: m._mediaUri }));
  const chatVideoMessages = messagesWithUri.filter((m) => getMessageType(m) === MSG_TYPE.VIDEO && m._mediaUri)
    .map((m) => ({ ...m, media_url: m._mediaUri }));
  const chatMusicMessages = messagesWithUri.filter((m) => getMessageType(m) === MSG_TYPE.MUSIC && m._mediaUri);

  const openImageGallery = (msg) => {
    const idx = chatImageMessages.findIndex((m) => m.id === msg.id);
    setGalleryIndex(idx >= 0 ? idx : 0);
  };

  const openVideoGallery = (msg) => {
    const idx = chatVideoMessages.findIndex((m) => m.id === msg.id);
    setVideoGalleryIndex(idx >= 0 ? idx : 0);
  };

  // 🆕 Musiqa: bosilgan trekdan boshlab, chatdagi BARCHA musiqa xabarlaridan
  // navbat (queue) tuziladi va to'liq pleyer ochiladi.
  const openMusicPlayer = (msg) => {
    const idx = chatMusicMessages.findIndex((m) => m.id === msg.id);
    const tracks = chatMusicMessages.map((m) => ({
      id: m.id,
      uri: m._mediaUri,
      title: m.file_name || m.attachments?.[0]?.file_name || "Musiqa",
      artist: m.sender_username || m.sender,
    }));
    musicPlayer.playQueue(tracks, idx >= 0 ? idx : 0);
    setMusicPlayerVisible(true);
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
    const replyToId = replyTo?.id ?? null;
    const localMsg = {
      id: localId, type, media_url: uri, file_name: fileName, mime_type: mimeType,
      file_size: fileSize, duration, sender: myUsername, sender_username: myUsername,
      timestamp: new Date().toISOString(), created_at: new Date().toISOString(), _local: true, _uploading: true,
      ...(replyToId ? { reply_to: { ...replyTo, id: replyToId, content: replyTo.message || replyTo.content || replyTo.file_name || "Media" }, reply_to_id: replyToId } : {}),
    };
    setMessages((prev) => [...prev, localMsg]);
    setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: localMsg }));

    try {
      const headers = await authHeader();
      const form = new FormData();
      form.append("receiver", activeUser.id);
      form.append("message_type", type);
      form.append("content", text || "");
      if (replyToId) form.append("reply_to", replyToId);
      form.append("attachment_type", type);
      form.append("file", { uri, name: fileName, type: mimeType });

      const res = await API.post("/messages/message/", form, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
      setMessages((prev) => prev.map((msg) => (msg.id === localId ? { ...msg, ...res.data, _uploading: false, _local: false } : msg)));
      setLastMsgMap((prev) => ({ ...prev, [activeUser.username]: { ...localMsg, ...res.data, _uploading: false, _local: false } }));
    } catch (err) {
      console.error("[sendMediaMessage] error:", err?.response?.data || err.message);
      setMessages((prev) => prev.map((msg) => (msg.id === localId ? { ...msg, _uploading: false, _failed: true } : msg)));
    }
  };

  const pickAndSendImage = async () => {
    try {
      const ok = await ensureMediaLibraryPermission();
      if (!ok) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      await sendMediaMessage({
        uri: asset.uri, type: MSG_TYPE.IMAGE,
        fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg", fileSize: asset.fileSize ?? 0,
        replyTo,
      });
    } catch (err) { console.error("[pickAndSendImage] error:", err); }
  };

  const pickAndSendVideo = async () => {
    try {
      const ok = await ensureMediaLibraryPermission();
      if (!ok) return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.7 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      await sendMediaMessage({
        uri: asset.uri, type: MSG_TYPE.VIDEO,
        fileName: asset.fileName || "video.mp4", mimeType: asset.mimeType || "video/mp4",
        fileSize: asset.fileSize, duration: asset.duration ? asset.duration * 1000 : null,
        replyTo,
      });
    } catch (err) { console.error("[pickAndSendVideo] error:", err); }
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
        replyTo,
      });
    } catch (err) { console.error("[openCameraAndSend] error:", err); }
  };

  const sendMusicFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const file = result.assets[0];
      await sendMediaMessage({ uri: file.uri, type: MSG_TYPE.MUSIC, fileName: file.name, mimeType: file.mimeType || "audio/mpeg", fileSize: file.size, duration: 0, replyTo });
    } catch (err) { console.error("[sendMusicFile] error:", err); }
  };

  const pickAndSendDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true, multiple: false });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      await sendMediaMessage({ uri: asset.uri, type: MSG_TYPE.FILE, fileName: asset.name, mimeType: asset.mimeType || "application/octet-stream", fileSize: asset.size, replyTo });
    } catch (err) { console.error("[pickAndSendDocument] error:", err); }
  };

  const handleVoiceRecorded = (result) => setPendingVoice(result);

  const sendRecordingNow = async () => {
    const result = await recorder.stop();
    if (result?.uri && result.duration >= MIN_VOICE_MS) {
      await sendMediaMessage({ uri: result.uri, type: MSG_TYPE.VOICE, duration: result.duration, fileName: "voice.m4a", mimeType: "audio/m4a", replyTo });
    }
  };

  const sendPendingVoice = async () => {
    if (!pendingVoice?.uri) return;
    const voice = pendingVoice;
    setPendingVoice(null);
    await sendMediaMessage({ uri: voice.uri, type: MSG_TYPE.VOICE, duration: voice.duration, fileName: "voice.m4a", mimeType: "audio/m4a", replyTo });
  };

  // ── WALLPAPER ────────────────────────────────────────────────────────────

  const applyWallpaperGradient = async (colors) => {
    const wp = { type: "gradient", colors };
    setWallpaper(wp);
    try { await AsyncStorage.setItem(`wallpaper_${roomName}`, JSON.stringify(wp)); }
    catch (err) { console.error("[wallpaper] save gradient error:", err); }
  };

  const applyWallpaperCustom = async () => {
    try {
      const ok = await ensureMediaLibraryPermission();
      if (!ok) return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      const wp = { type: "image", uri };
      setWallpaper(wp);
      await AsyncStorage.setItem(`wallpaper_${roomName}`, JSON.stringify(wp));
    } catch (err) { console.error("[wallpaper] custom error:", err); }
  };

  const resetWallpaper = async () => {
    setWallpaper(null);
    try { await AsyncStorage.removeItem(`wallpaper_${roomName}`); }
    catch (err) { console.error("[wallpaper] reset error:", err); }
  };

  // ── RENDER HELPERS ───────────────────────────────────────────────────────

  const navItems = [
    { href: "/pages/home/FeedScreen", active: false, Icon: IconHome },
    { href: "/pages/message", active: true, Icon: IconLogoGlobe },
    { href: "/pages/createPost", active: false, Icon: IconCreate },
    { href: "/pages/reals", active: false, Icon: IconMovie },
    { href: "/pages/profile", active: false, Icon: IconPerson },
  ];

  const msgMenuItems = msgMenuFor?.msg
    ? [
        { label: "Reply", icon: <IconEdit color={t.text} />, action: () => startReply(msgMenuFor.msg) },
        ...(String(msgMenuFor.msg.sender) === String(myUserId) || msgMenuFor.msg.sender === myUsername || msgMenuFor.msg.sender_username === myUsername
          ? [
              ...(msgMenuFor.msg.message_type === MSG_TYPE.TEXT || !msgMenuFor.msg.message_type
                ? [{ label: "Edit", icon: <IconEdit color={t.text} />, action: () => startEdit(msgMenuFor.msg) }]
                : []),
              { label: "Delete", icon: <IconTrash color="#EF4444" />, action: () => confirmDeleteMsg(msgMenuFor.msg.id), danger: true },
            ]
          : []),
        ...((msgMenuFor.msg.message || msgMenuFor.msg.content)
          ? [{ label: "Copy", icon: <IconCopy color={t.text} />, action: () => Clipboard.setString(msgMenuFor.msg.message || msgMenuFor.msg.content || "") }]
          : []),
      ]
    : [];

  const renderUserRow = ({ item: u }) => (
    <UserListRow
      user={u} theme={t}
      isActive={activeUser?.username === u.username}
      online={isOnline(u.username)}
      lastMsg={lastMsgMap[u.username]}
      unreadCount={unreadCountMap[u.username] || 0}
      isTyping={typing[roomName]?.includes?.(u.username)}
      myUsername={myUsername} myUserId={myUserId}
      onPress={() => openChat(u)}
    />
  );

  const renderMessage = ({ item: msg, index: i }) => {
    const isMe = String(msg.sender) === String(myUserId) || msg.sender === myUsername || msg.sender_username === myUsername;
    const prev = messagesWithUri[i - 1];
    const next = messagesWithUri[i + 1];
    const curSender = msg.sender || msg.sender_username;
    const showTop = (prev?.sender || prev?.sender_username) !== curSender;
    const showBot = (next?.sender || next?.sender_username) !== curSender;

    return (
      <MessageBubble
        msg={msg} isMe={isMe} showTop={showTop} showBot={showBot} theme={t}
        activeUserAvatar={activeUser?.avatar}
        onLongPress={openMsgMenu}
        onOpenImageGallery={openImageGallery}
        onOpenVideoGallery={openVideoGallery}
        onOpenMusicPlayer={openMusicPlayer}
        onDeleteMedia={confirmDeleteMsg}
      />
    );
  };

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.bg }]}>
      <DropMenu visible={headerMenuVisible} onClose={() => setHeaderMenuVisible(false)} theme={t} anchor={{ top: 88, right: 16 }} items={[
        { label: "Suhbat foni", icon: <IconPalette color={t.text} />, action: () => setWallpaperSheetVisible(true) },
        { label: "Refresh chat", icon: <IconRefresh color={t.text} />, action: refreshChat },
        { label: "Clear history", icon: <IconTrash color="#EF4444" />, action: confirmClearHistory, danger: true },
        { label: "Close chat", icon: <IconClose color={t.text} />, action: () => { setView("list"); setActiveUser(null); setRoomName(null); setMessages([]); } },
        { label: dark ? "Light mode" : "Dark mode", icon: dark ? <IconSun color={t.text} /> : <IconMoon color={t.text} />, action: () => setDark((d) => !d) },
      ]} />
      <DropMenu visible={!!msgMenuFor} onClose={() => setMsgMenuFor(null)} theme={t} anchor={msgMenuFor?.anchor || { top: 120, left: 18 }} items={msgMenuItems} />
      <AttachSheet
        visible={attachSheetVisible} onClose={() => setAttachSheetVisible(false)} theme={t}
        onPickImage={pickAndSendImage} onPickVideo={pickAndSendVideo}
        onSendMusicFile={sendMusicFile} onPickDocument={pickAndSendDocument} onOpenCamera={openCameraAndSend}
      />
      <WallpaperSheet
        visible={wallpaperSheetVisible} onClose={() => setWallpaperSheetVisible(false)} theme={t}
        onSelectGradient={applyWallpaperGradient} onSelectCustom={applyWallpaperCustom} onReset={resetWallpaper}
      />

      {/* 🆕 Rasm galereyasi (swipe + pastki filmstrip) */}
      <ImageGalleryViewer images={chatImageMessages} index={galleryIndex} onClose={() => setGalleryIndex(null)} onChangeIndex={setGalleryIndex} />
      {/* 🆕 Video galereyasi (swipe + pauzada pastki ro'yxat) */}
      <VideoGalleryViewer videos={chatVideoMessages} index={videoGalleryIndex} onClose={() => setVideoGalleryIndex(null)} onChangeIndex={setVideoGalleryIndex} />
      {/* 🆕 To'liq musiqa pleyeri */}
      <MusicPlayerModal visible={musicPlayerVisible} onClose={() => setMusicPlayerVisible(false)} theme={t} player={musicPlayer} />

      {view === "list" ? (
        <>
          <View style={[styles.listHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Messages</Text>
                <Text style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>@{myUsername}</Text>
              </View>
              <TouchableOpacity onPress={() => setDark((d) => !d)} style={[styles.iconBtn, { backgroundColor: t.card, borderColor: t.border }]}>
                {dark ? <IconSun color={t.sub} /> : <IconMoon color={t.sub} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: t.card, borderColor: t.border }]}>
              <IconSearch color={t.sub} />
              <TextInput
                value={search} onChangeText={setSearch} placeholder="Search users..." placeholderTextColor={t.sub}
                style={[styles.searchInput, { color: t.text }]}
              />
              {search ? <TouchableOpacity onPress={() => setSearch("")}><IconClose color={t.sub} /></TouchableOpacity> : null}
            </View>

            {/* 🆕 Telegram uslubidagi kategoriya tab'lari */}
            <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} theme={t} />
          </View>

          {usersLoading ? (
            <View style={styles.centerFlex}><ActivityIndicator size="large" color={t.accent} /></View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: t.card }]}><IconUsers color={t.sub} /></View>
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

          <View style={[styles.bottomNav, { backgroundColor: t.surface, borderTopColor: t.border }]}>
            {navItems.map((item, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(item.href)} style={styles.navItem}>
                <item.Icon color={item.active ? t.accent : t.sub} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 15}>
          {!activeUser ? (
            <View style={styles.centerFlex}>
              <View style={[styles.emptyIconCircle, { backgroundColor: t.card }]}><IconChatBubble size={32} color={t.sub} /></View>
              <Text style={{ color: t.sub, fontSize: 14, marginTop: 12 }}>Select a conversation</Text>
            </View>
          ) : (
            <>
              <View style={[styles.chatHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
                <TouchableOpacity onPress={() => { setView("list"); setShowMsgSearch(false); setMsgSearch(""); setEditingMsg(null); }} style={styles.backBtn}>
                  <IconBack color={t.accent} />
                </TouchableOpacity>
                <Avatar name={activeUser.full_name || activeUser.username} size={38} src={activeUser.avatar} online={isOnline(activeUser.username)} bgColor={t.surface} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.chatTitle, { color: t.text }]} numberOfLines={1}>{activeUser.full_name || activeUser.username}</Text>
                  <Text style={[styles.chatStatus, { color: isOnline(activeUser.username) ? "#22C55E" : t.sub }]}>
                    {connecting ? "Connecting..." : isOnline(activeUser.username) ? "● Online" : "○ Offline"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setShowMsgSearch((s) => !s); setMsgSearch(""); }} style={[styles.iconBtn, { backgroundColor: showMsgSearch ? t.accent : t.card, borderColor: t.border }]}>
                  <IconSearch color={showMsgSearch ? "#fff" : t.sub} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHeaderMenuVisible(true)} style={[styles.iconBtn, { backgroundColor: t.card, borderColor: t.border }]}>
                  <IconMoreVertical color={t.sub} />
                </TouchableOpacity>
              </View>

              {showMsgSearch ? (
                <View style={{ padding: 10, paddingHorizontal: 14, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border }}>
                  <View style={[styles.searchWrap, { backgroundColor: t.card, borderColor: t.accent }]}>
                    <IconSearch color={t.sub} />
                    <TextInput autoFocus value={msgSearch} onChangeText={setMsgSearch} placeholder="Search messages..." placeholderTextColor={t.sub} style={[styles.searchInput, { color: t.text }]} />
                    {msgSearch ? <TouchableOpacity onPress={() => setMsgSearch("")}><IconClose color={t.sub} /></TouchableOpacity> : null}
                  </View>
                </View>
              ) : null}

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
                  <View style={styles.centerFlex}><ActivityIndicator size="large" color={t.accent} /></View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={messagesWithUri}
                    keyExtractor={(item, i) => String(item.id || i)}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 14, paddingBottom: 8, flexGrow: 1 }}
                    style={{ backgroundColor: "transparent" }}
                    ListEmptyComponent={
                      <View style={[styles.emptyState, { marginTop: 60 }]}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: t.card }]}><IconChatBubble size={28} color={t.sub} /></View>
                        <Text style={{ color: t.sub, fontSize: 14 }}>{msgSearch ? "No messages found" : "Send the first message!"}</Text>
                      </View>
                    }
                    ListFooterComponent={
                      typing ? (
                        <View style={[styles.msgRow, { marginTop: 8 }]}>
                          <View style={[styles.typingBubble, { backgroundColor: t.bubbleOther }]}>
                            {[0, 1, 2].map((d) => <TypingDot key={d} delay={d * 180} color={t.sub} />)}
                          </View>
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>

              <View style={[styles.inputArea, { backgroundColor: t.surface, borderTopColor: t.border }]}>
                {editingMsg ? (
                  <View style={[styles.editingBar, { backgroundColor: t.card, borderColor: t.accent }]}>
                    <IconEdit size={12} color={t.accent} />
                    <Text style={{ flex: 1, fontSize: 12, color: t.sub, marginLeft: 8 }}>
                      Editing: <Text style={{ color: t.text, fontStyle: "italic" }}>{(editingMsg.message || "").slice(0, 42)}{(editingMsg.message || "").length > 42 ? "…" : ""}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => { setEditingMsg(null); setInput(""); }}><IconClose size={14} color={t.sub} /></TouchableOpacity>
                  </View>
                ) : null}

                {!connected && !connecting ? (
                  <View style={[styles.offlineBar, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text>⚠️</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: t.sub, marginLeft: 6 }}>Offline — messages will be saved</Text>
                    <TouchableOpacity onPress={reconnect}><Text style={{ color: t.accent, fontSize: 12, fontWeight: "700" }}>Reconnect</Text></TouchableOpacity>
                  </View>
                ) : null}

                {replyTo ? (
                  <View style={[styles.replyBlock, { backgroundColor: t.card, borderLeftColor: t.accent }]}>
                    <Text style={[styles.replyMeta, { color: t.accent }]}>Replying to @{replyTo.sender_username || replyTo.sender || "user"}</Text>
                    <Text style={[styles.replyText, { color: t.text }]} numberOfLines={2}>
                      {replyTo.message || replyTo.content || (replyTo.file_name || "Media")}
                    </Text>
                    <TouchableOpacity onPress={cancelReply} style={{ position: "absolute", right: 8, top: 8 }}>
                      <IconClose size={12} color={t.sub} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {recorder.isRecording ? (
                  <View style={[styles.recordingRow, { backgroundColor: t.inputBg, borderColor: "#EF4444" }]}>
                    <View style={styles.recDot} />
                    <Text style={{ color: t.text, fontSize: 13, fontWeight: "700" }} >{formatDuration(recorder.durationMs)}</Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                      <IconChevronLeft size={13} color={t.sub} />
                      <Text style={{ color: t.sub, fontSize: 12, marginLeft: 2 }}>Bekor qilish uchun suring</Text>
                    </View>

                    <TouchableOpacity onPress={sendRecordingNow} style={[styles.voiceActionBtn, { backgroundColor: "#6908d1" }]}>
                      <IconSend size={25} color="#fff" />
                    </TouchableOpacity>
                    
                  </View>
                ) : null}

                {pendingVoice ? (
                  <View style={[styles.voicePreviewRow, { backgroundColor: t.inputBg, borderColor: t.accent }]}>
                    <AudioMessageBubble uri={pendingVoice.uri} duration={pendingVoice.duration} isMe={false} theme={t} label="Ovozli xabar" />
                    <View style={styles.voicePreviewActions}>
                      <TouchableOpacity onPress={() => setPendingVoice(null)} style={[styles.voiceActionBtn, { backgroundColor: "#FEE2E2" }]}>
                        <IconTrash size={14} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={sendPendingVoice} style={[styles.voiceActionBtn, { backgroundColor: t.accent }]}>
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
                    ref={inputRef} value={input} onChangeText={handleTypingInput}
                    placeholder={editingMsg ? "Enter new text..." : replyTo ? "Reply to message..." : `Message @${activeUser.username}...`}
                    placeholderTextColor={t.sub} multiline maxLength={MAX_TEXT_LENGTH}
                    style={[styles.msgInput, { color: t.text }]}
                  />
                  {input.trim() ? (
                    <TouchableOpacity onPress={handleSend} disabled={sending} style={[styles.sendBtn, { backgroundColor: t.accent, opacity: sending ? 0.6 : 1 }]}>
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

export default function ChatScreen() {
  return (
    <ChatErrorBoundary>
      <ChatScreenInner />
    </ChatErrorBoundary>
  );
}