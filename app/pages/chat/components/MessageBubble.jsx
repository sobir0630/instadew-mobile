import { ActivityIndicator, Image, Linking, Text, TouchableOpacity, View } from "react-native";
import { MSG_TYPE } from "../constants/config";
import { styles } from "../constants/styles";
import { timeOnly } from "../utils/helpers";
import Avatar from "./Avatar";
import { AudioMessageBubble, FileMessageBubble, MusicMessageBubble, VideoMessageBubble } from "./MediaBubbles";
import MediaDeleteButton from "./MediaDeleteButton";

// msg'ning turi va media manzilini API/lokal ikkala shakldan ham olish
export function getMessageType(msg) { return msg?.message_type || msg?.type || MSG_TYPE.TEXT; }
export function getAttachment(msg) { return msg?.attachments?.[0] || {}; }
export function getMediaUri(msg, apiBaseUrl) {
  const attachment = getAttachment(msg);
  const rawUri = msg?.media_url || attachment?.file || attachment?.url || msg?.file;
  if (!rawUri || typeof rawUri !== "string") return null;
  if (/^(https?:|file:|content:|data:|blob:)/i.test(rawUri)) return rawUri;
  const baseUrl = String(apiBaseUrl || "").replace(/\/$/, "");
  return rawUri.startsWith("/") ? `${baseUrl}${rawUri}` : rawUri;
}

export default function MessageBubble({
  msg, isMe, showTop, showBot, theme: t, activeUserAvatar,
  onLongPress, onOpenImageGallery, onOpenVideoGallery, onOpenMusicPlayer, onDeleteMedia,
}) {
  const messageType = getMessageType(msg);
  const attachment = getAttachment(msg);
  const isMedia = [MSG_TYPE.IMAGE, MSG_TYPE.VIDEO].includes(messageType);
  const isDeletableMedia = [MSG_TYPE.IMAGE, MSG_TYPE.VIDEO, MSG_TYPE.VOICE, MSG_TYPE.AUDIO, MSG_TYPE.MUSIC, MSG_TYPE.FILE].includes(messageType);

  const bubbleRadius = isMe
    ? { borderTopLeftRadius: 18, borderTopRightRadius: showTop ? 18 : 4, borderBottomRightRadius: showBot ? 18 : 4, borderBottomLeftRadius: 18 }
    : { borderTopLeftRadius: showTop ? 18 : 4, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: showBot ? 18 : 4 };

  const replyText = msg.reply_to?.content ?? msg.reply_to?.message ?? msg.reply_to?.text ?? "";
  const replyUser = msg.reply_to?.sender_username ?? msg.reply_to?.sender ?? "user";

  const renderContent = () => {
    switch (messageType) {
      case MSG_TYPE.IMAGE:
        return (
          <TouchableOpacity onPress={() => onOpenImageGallery(msg)} activeOpacity={0.9}>
            {msg._mediaUri ? <Image source={{ uri: msg._mediaUri }} style={styles.imageBubbleImg} /> : (
              <View style={[styles.imageBubbleImg, styles.mediaPlaceholder]}>
                <Text style={{ color: "#fff", fontSize: 12 }}>Rasm mavjud emas</Text>
              </View>
            )}
            {msg._uploading ? (
              <View style={styles.uploadOverlay}><ActivityIndicator color="#bfc1bf" /></View>
            ) : null}
          </TouchableOpacity>
        );
      case MSG_TYPE.VIDEO:
        return <VideoMessageBubble uri={msg._mediaUri} onPress={() => onOpenVideoGallery(msg)} />;
      case MSG_TYPE.VOICE:
        return <AudioMessageBubble uri={msg._mediaUri} duration={msg.duration} isMe={isMe} theme={t} label="Ovozli xabar" />;
      case MSG_TYPE.AUDIO:
        return <AudioMessageBubble uri={msg._mediaUri} duration={msg.duration} isMe={isMe} theme={t} label={msg.file_name || attachment.file_name} />;
      case MSG_TYPE.MUSIC:
        return (
          <MusicMessageBubble
            title={msg.file_name || attachment.file_name || "Musiqa"}
            artist={msg.sender_username || msg.sender}
            isMe={isMe}
            theme={t}
            onOpenPlayer={() => onOpenMusicPlayer(msg)}
          />
        );
      case MSG_TYPE.FILE:
        return (
          <FileMessageBubble
            fileName={msg.file_name || attachment.file_name}
            fileSize={msg.file_size || attachment.file_size}
            isMe={isMe} theme={t}
            onOpen={() => msg._mediaUri && Linking.openURL(msg._mediaUri).catch((e) => console.error("[openFile] error:", e))}
          />
        );
      default:
        return (
          <Text style={{ color: isMe ? t.textMe : t.text, fontSize: 14, lineHeight: 20 }}>
            {msg.message || msg.content || ""}
            {(msg.edited || msg.is_edited) ? <Text style={{ fontSize: 10, opacity: 0.6 }}> edited</Text> : null}
            {msg._local ? <Text style={{ fontSize: 10, opacity: 0.6 }}> ⏳</Text> : null}
            {msg._failed ? <Text style={{ fontSize: 10, color: "#EF4444" }}> ✕ yuborilmadi</Text> : null}
          </Text>
        );
    }
  };

  return (
    <View style={[styles.msgRow, { flexDirection: isMe ? "row-reverse" : "row", marginTop: showTop ? 10 : 2 }]}>
      {!isMe ? (
        <View style={{ width: 32 }}>
          {showBot ? <Avatar name={msg.sender_username || msg.sender} size={28} src={activeUserAvatar} /> : null}
        </View>
      ) : null}
      <View style={[styles.bubbleWrap, { alignItems: isMe ? "flex-end" : "flex-start" }]}>
        {!isMe && showTop ? (
          <Text style={[styles.senderLabel, { color: t.sub }]}>@{msg.sender_username || msg.sender}</Text>
        ) : null}
        {msg.reply_to || msg.reply_to_id ? (
          <View style={{ marginBottom: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: isMe ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)", borderLeftWidth: 2, borderLeftColor: isMe ? "#655c5c" : t.accent }}>
            <Text style={{ fontSize: 10, color: t.sub, fontWeight: "700" }}>Reply</Text>
            <Text style={{ fontSize: 11, color: isMe ? t.textMe : t.text, opacity: 0.8 }} numberOfLines={1}>
              {replyText || `@${replyUser}` || "Media"}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          onLongPress={(event) => onLongPress(msg, event)}
          activeOpacity={0.85}
          style={[
            isMedia ? styles.bubbleMedia : styles.bubble, bubbleRadius,
            { backgroundColor: isMedia ? "transparent" : (isMe ? t.bubbleMe : t.bubbleOther), opacity: msg._local && !msg._failed ? 0.85 : 1 },
          ]}
        >
          {renderContent()}
        </TouchableOpacity>
        {isMe && isDeletableMedia && !msg._local ? (
          <MediaDeleteButton onPress={() => onDeleteMedia(msg.id)} theme={t} />
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
}