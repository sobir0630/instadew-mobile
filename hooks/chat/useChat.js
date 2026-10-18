import { useCallback, useEffect, useRef, useState } from "react";
import { MSG_TYPE } from "../../constants/chat/config";
import { getMyUser, wsBase } from "../../utils/chat/helpers";

export function useChat(roomName) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // indicators
  const [typing, setTyping] = useState(false);

  const [imageSending, setImageSending] = useState(false);
  const [cameraSending, setCameraSending] = useState(false);
  const [fileSending, setFileSending] = useState(false);
  const [musicSending, setMusicSending] = useState(false);
  const [videoSending, setVideoSending] = useState(false);
  const [voiceSending, setVoiceSending] = useState(false);

  const imageSendingTimerRef = useRef(null);
  const cameraSendingTimerRef = useRef(null);
  const fileSendingTimerRef = useRef(null);
  const musicSendingTimerRef = useRef(null);
  const videoSendingTimerRef = useRef(null);
  const voiceSendingTimerRef = useRef(null);

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

            timerRef.current = setTimeout(() => {
              setTyping(false);
            }, 5500);

            return;
          }


          // ================= IMAGE =================
          if (t === "image_sending" && data.sender !== myUserRef.current) {
            setImageSending(true);

            clearTimeout(imageSendingTimerRef.current);

            imageSendingTimerRef.current = setTimeout(() => {
              setImageSending(false);
            }, 10000);

            return;
          }


          // ================= CAMERA =================
          if (t === "camera_sending" && data.sender !== myUserRef.current) {
            setCameraSending(true);

            clearTimeout(cameraSendingTimerRef.current);

            cameraSendingTimerRef.current = setTimeout(() => {
              setCameraSending(false);
            }, 10000);

            return;
          }


          // ================= FILE =================
          if (t === "file_sending" && data.sender !== myUserRef.current) {
            setFileSending(true);

            clearTimeout(fileSendingTimerRef.current);

            fileSendingTimerRef.current = setTimeout(() => {
              setFileSending(false);
            }, 10000);

            return;
          }


          // ================= MUSIC =================
          if (t === "music_sending" && data.sender !== myUserRef.current) {
            setMusicSending(true);

            clearTimeout(musicSendingTimerRef.current);

            musicSendingTimerRef.current = setTimeout(() => {
              setMusicSending(false);
            }, 10000);

            return;
          }


          // ================= VIDEO =================
          if (t === "video_sending" && data.sender !== myUserRef.current) {
            setVideoSending(true);

            clearTimeout(videoSendingTimerRef.current);

            videoSendingTimerRef.current = setTimeout(() => {
              setVideoSending(false);
            }, 10000);

            return;
          }


          // ================= VOICE =================
          if (t === "voice_sending" && data.sender !== myUserRef.current) {
            setVoiceSending(true);

            clearTimeout(voiceSendingTimerRef.current);

            voiceSendingTimerRef.current = setTimeout(() => {
              setVoiceSending(false);
            }, 10000);

            return;
          }

          if (t === "chat_message" || data.message || data.media_url) {
            const msgText = data.message || data.text || data.content || "";
            const sender = data.sender || data.username || data.sender_username || "?";
            const replyToId = data.reply_to_id?.id ?? data.reply_to?.content ?? null;

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
                reply_to: data.reply_to ?? null,
                reply_to_id: replyToId,
                is_edited: !!(data.is_edited || data.edited),
                edited: !!(data.edited || data.is_edited),
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
    try { wsRef.current?.close(); } catch (err) { console.error("[chat-ws] disconnect error:", err); }
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((text, extra = {}) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
    try {
      const payload = {
        type: "chat_message",
        message: text,
        sender: myUserRef.current,
        timestamp: new Date().toISOString(),
        ...extra,
      };
      wsRef.current.send(JSON.stringify(payload));
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

  const sendMediaSending = useCallback((mediaType) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.log("[chat-ws] WebSocket ulanmagan");
      return false;
    }

    try {
      const payload = {
        type: `${mediaType}_sending`,
        sender: myUserRef.current,
      };

      wsRef.current.send(JSON.stringify(payload));

      console.log(
        "[chat-ws] media sending yuborildi:",
        payload
      );

      return true;
    } catch (err) {
      console.error(
        "[chat-ws] media sending error:",
        err
      );

      return false;
    }
  }, []);

  const stopMediaSending = useCallback((mediaType) => {
    switch (mediaType) {
      case "image":
        clearTimeout(imageSendingTimerRef.current);
        setImageSending(false);
        break;

      case "camera":
        clearTimeout(cameraSendingTimerRef.current);
        setCameraSending(false);
        break;

      case "file":
        clearTimeout(fileSendingTimerRef.current);
        setFileSending(false);
        break;

      case "music":
        clearTimeout(musicSendingTimerRef.current);
        setMusicSending(false);
        break;

      case "video":
        clearTimeout(videoSendingTimerRef.current);
        setVideoSending(false);
        break;

      case "voice":
        clearTimeout(voiceSendingTimerRef.current);
        setVoiceSending(false);
        break;

      default:
        console.warn(
          "[chat-ws] Noma'lum media type:",
          mediaType
        );
    }
  }, []);

  useEffect(() => {
    if (roomName) {
      connect();
      return () => disconnect();
    }
  }, [roomName]);

  return {
    messages,
    setMessages,
    connected,
    connecting,

    typing,

    imageSending,
    cameraSending,
    fileSending,
    musicSending,
    videoSending,
    voiceSending,

    sendMessage,
    sendTyping,

    sendMediaSending,
    stopMediaSending,

    reconnect: connect,
  };
}