import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, FlatList,
  ActivityIndicator, Modal, Platform, KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import ImageViewing from "react-native-image-viewing";
import { api as API } from "../../../api/server"; // loyihangizga qarab yo'lni moslang
import Avatar from "./Avatar";
import { IconClose, IconHeart, IconComment, IconPlayBadge } from "../constants/icons";
import {
  getMediaThumb, isVideoItem, getCommentAuthor, getCommentAvatar,
  getCommentBody, getCommentTime, fmtNum,
} from "../utils/helpers";
import { styles } from "../styles/styles";

export default function PostModal({ post, username, userAvatar, visible, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const listRef = useRef(null);
  const [visibleImage, setVisibleImage] = useState(false);

  useEffect(() => {
    if (!post) return;
    setLiked(post.is_liked ?? false);
    setLikeCount(post.likes_count ?? post.likes ?? 0);

    let cancelled = false;
    setCommentsLoading(true);
    (async () => {
      const token = await AsyncStorage.getItem("token");
      API.get(`/comments/comments/?post=${post.id}`, {
        headers: { Authorization: `Bearer ${token?.trim()}` },
      })
        .then((res) => {
          if (!cancelled) {
            const data = Array.isArray(res.data)
              ? res.data
              : res.data?.results || res.data?.comments || [];
            setComments(data);
          }
        })
        .catch((err) => {
          console.log("Comments load error:", err);
          if (!cancelled) setComments([]);
        })
        .finally(() => { if (!cancelled) setCommentsLoading(false); });
    })();
    return () => { cancelled = true; };
  }, [post?.id]);

  if (!post) return null;

  const submit = async () => {
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");
      const res = await API.post(
        `/comments/comments/`,
        { post_id: post.id, text: t, user: userId },
        { headers: { Authorization: `Bearer ${token?.trim()}` } }
      );
      if (res.status === 200 || res.status === 201) {
        const newC = res.data?.id ? res.data : {
          id: Date.now(), text: t, body: t,
          author: { username, avatar: userAvatar },
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [...prev, newC]);
        setText("");
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.log("Comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    const wasCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount(post.likes_count || post.likes || wasCount + (wasLiked ? -1 : 1));

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.post(`/posts/post/${post.id}/like/`, {}, { headers: { Authorization: `Bearer ${token?.trim()}` } });

      if (res.data?.likes_count !== undefined) setLikeCount(res.data.likes_count);
      if (res.data?.is_liked !== undefined) setLiked(res.data.is_liked);
    } catch (err) {
      console.log("Like error:", err);
      setLiked(wasLiked);
      setLikeCount(wasCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const imgSrc = getMediaThumb(post);
  const caption = post.caption || post.description || "";
  const isVideo = isVideoItem(post);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalCard}
          behavior={Platform.OS === "ios" ? "padding" : 0}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Avatar src={userAvatar} name={username} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.modalUsername}>@{username}</Text>
              <Text style={styles.modalTime}>
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <IconClose />
            </TouchableOpacity>
          </View>

          {/* Rasm / Video preview */}
          <View>
            <TouchableOpacity onPress={() => setVisibleImage(true)} activeOpacity={0.8}>
              <Image source={{ uri: imgSrc }} style={styles.modalImage} resizeMode="cover" />
              {isVideo && (
                <View style={styles.modalPlayOverlay}>
                  <IconPlayBadge size={40} />
                </View>
              )}
            </TouchableOpacity>
            {/* <ImageViewing
                images={[{ uri: imgSrc }]}
                imageIndex={0}
                visible={visibleImage}
                onRequestClose={() => setVisibleImage(false)}
              /> */}
          </View>

          {/* Caption */}
          {caption ? (
            <View style={styles.modalCaptionWrap}>
              <Text style={styles.modalCaptionText}>
                <Text style={{ fontWeight: "700" }}>@{username}</Text> {caption}
              </Text>
            </View>
          ) : null}

          {/* Comments */}
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
                  name={getCommentAuthor(c)}
                  size={28}
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

          {/* Like + comment count */}
          <View style={styles.modalActionsRow}>
            <TouchableOpacity onPress={toggleLike} disabled={likeLoading} style={styles.actionBtn}>
              <IconHeart filled={liked} color={liked ? "#cf222e" : "#57606a"} />
              <Text style={[styles.actionCount, liked && { color: "#cf222e" }]}>{fmtNum(likeCount)}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <IconComment />
              <Text style={styles.actionCount}>{commentsLoading ? "…" : comments.length}</Text>
            </View>
          </View>

          {/* Comment input */}
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