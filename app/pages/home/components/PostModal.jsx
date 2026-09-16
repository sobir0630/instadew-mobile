import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal,
  Platform, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Avatar } from "./Avatar";
import { IconClose, IconComment, IconHeart } from "./icons";
import { fetchComments, submitComment, toggleLikeAPI } from "../api/FeedApi";
import { getCommentAuthor, getCommentAvatar, getCommentBody, getCommentTime } from "../utils/CommentHelpers";
import { fmtNum, getInitials } from "../utils/Formatters";
import { styles } from "../styles/FeedStyles";

// Post ustiga bosilganda ochiladigan modal: rasm, caption, kommentlar
// ro'yxati, like tugmasi va komment yozish maydoni.
export function PostModal({ post, visible, onClose, onLikeChange }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(post?.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes_count ?? post?.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!post) return;
    setLiked(post.is_liked ?? false);
    setLikeCount(post.likes_count ?? post.likes ?? 0);
    let cancelled = false;
    setCommentsLoading(true);
    fetchComments(post.id)
      .then((data) => { if (!cancelled) setComments(data); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    return () => { cancelled = true; };
  }, [post?.id]);

  if (!post) return null;

  const authorAvatar = post.author?.avatar || post.author?.profile_picture || post.author?.image || post.avatar || null;
  const username = post.author?.username || post.author?.user || post.username || "user";
  const initials = getInitials(post.author?.full_name || post.name || username);
  const imageUrl = post.picture || post.img || "";
  const caption = post.caption || post.description || "";
  const timeStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : "";

  const submit = async () => {
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      const username2 = await AsyncStorage.getItem("login_username");
      const newC = await submitComment(post.id, t);
      const finalC = newC?.id ? newC : {
        id: Date.now(), text: t, body: t,
        author: { username: username2 || "you" },
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, finalC]);
      setText("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.log("Comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    const wasCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount(wasLiked ? wasCount - 1 : wasCount + 1);
    onLikeChange?.(post.id, !wasLiked, wasLiked ? wasCount - 1 : wasCount + 1);
    try {
      const res = await toggleLikeAPI(post.id);
      if (res?.is_liked !== undefined) setLiked(res.is_liked);
      if (res?.likes_count !== undefined) {
        setLikeCount(res.likes_count);
        onLikeChange?.(post.id, res.is_liked ?? !wasLiked, res.likes_count);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(wasCount);
      onLikeChange?.(post.id, wasLiked, wasCount);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalCard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <Avatar src={authorAvatar} initials={initials} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.modalUsername}>@{username}</Text>
              <Text style={styles.modalTime}>{timeStr}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <IconClose />
            </TouchableOpacity>
          </View>

          <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="cover" />

          {caption ? (
            <View style={styles.modalCaptionWrap}>
              <Text style={styles.modalCaptionText}>
                <Text style={{ fontWeight: "700" }}>@{username}</Text> {caption}
              </Text>
            </View>
          ) : null}

          <FlatList
            ref={listRef}
            data={commentsLoading ? [] : comments}
            keyExtractor={(c, i) => String(c.id || i)}
            style={styles.commentsList}
            contentContainerStyle={{ padding: 14, gap: 12 }}
            ListEmptyComponent={
              commentsLoading ? (
                <ActivityIndicator color="#0969da" />
              ) : (
                <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
              )
            }
            renderItem={({ item: c, index: i }) => (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Avatar
                  src={getCommentAvatar(c)}
                  initials={getInitials(getCommentAuthor(c))}
                  size={26}
                  index={i}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentText}>
                    <Text style={{ fontWeight: "700", color: "#24292f" }}>@{getCommentAuthor(c)}</Text>
                    {" "}{getCommentBody(c)}
                  </Text>
                  <Text style={styles.commentTime}>{getCommentTime(c)}</Text>
                </View>
              </View>
            )}
          />

          <View style={styles.modalActionsRow}>
            <TouchableOpacity onPress={handleLike} disabled={likeLoading} style={styles.actionBtn}>
              <IconHeart filled={liked} color={liked ? "#cf222e" : "#57606a"} size={20} />
              <Text style={[styles.actionCount, liked && { color: "#cf222e" }]}>{fmtNum(likeCount)}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <IconComment size={20} />
              <Text style={styles.actionCount}>{commentsLoading ? "…" : comments.length}</Text>
            </View>
          </View>

          <View style={styles.commentInputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              placeholderTextColor="#8c959f"
              editable={!submitting}
              style={styles.commentInput}
              onSubmitEditing={submit}
            />
            <TouchableOpacity
              onPress={submit}
              disabled={!text.trim() || submitting}
              style={[
                styles.postBtn,
                { backgroundColor: text.trim() && !submitting ? "#0969da" : "#d0d7de" },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}