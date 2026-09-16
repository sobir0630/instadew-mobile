import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import Avatar from "./Avatar";
import { IconChevronRight } from "../constants/icons";
import { timeOnly } from "../utils/helpers";
import { MSG_TYPE } from "../constants/config";
import { styles } from "../constants/styles";

const MEDIA_LABELS = { image: "📷 Rasm", video: "🎥 Video", audio: "🎵 Audio", music: "🎵 Musiqa", voice: "🎤 Ovozli xabar", file: "📎 Fayl" };

export default function UserListRow({
  user: u, theme: t, isActive, online, lastMsg, unreadCount, isTyping,
  myUsername, myUserId, onPress,
}) {
  const lastType = lastMsg ? (lastMsg.message_type || lastMsg.type || MSG_TYPE.TEXT) : null;
  const lastIsMedia = lastMsg && lastType !== MSG_TYPE.TEXT;
  const lastText = lastMsg ? (lastIsMedia ? MEDIA_LABELS[lastType] : lastMsg.message || lastMsg.content || "") : null;
  const lastTime = lastMsg ? timeOnly(lastMsg.timestamp || lastMsg.created_at) : null;
  const isLastMine = lastMsg && (
    String(lastMsg.sender) === String(myUserId) ||
    lastMsg.sender === myUsername ||
    lastMsg.sender_username === myUsername
  );
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.userRow, { backgroundColor: isActive ? t.card : "transparent", borderLeftColor: isActive ? t.accent : "transparent" }]}
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
}