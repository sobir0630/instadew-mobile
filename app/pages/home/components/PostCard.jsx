import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "./Avatar";
import { PostMedia } from "./PostMedia";
import { IconBookmark, IconComment, IconHeart, IconMore, IconShare } from "./icons";
import { fetchComments, toggleLikeAPI } from "../api/FeedApi";
import { fmtNum, getInitials } from "../utils/Formatters";
import { styles } from "../styles/FeedStyles";

// `activeId` — hozir ekranda ko'rinib turgan post ID'si (FlatList
// viewability orqali aniqlanadi). Faqat shu post'ning videosi avtoijro qiladi.
export function PostCard({ post, onOpenModal, onLikeChange, activeId }) {
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes_count ?? post.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count ?? post.comment_count ?? null);

  useEffect(() => {
    if (commentCount !== null) return;
    fetchComments(post.id).then((data) => setCommentCount(data.length)).catch(() => setCommentCount(0));
  }, [post.id]);

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

  const username = post.author?.username || post.author?.user || post.username || "user";
  const initials = getInitials(post.author?.full_name || post.name || username);
  const caption = post.caption || post.description || "";
  const timeStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : "";
  const authorAvatar = post.author?.avatar || post.author?.profile_picture || post.author?.image || post.avatar || null;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar src={authorAvatar} initials={initials} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postUsername}>@{username}</Text>
          <Text style={styles.postTime}>{timeStr}</Text>
        </View>
        <TouchableOpacity style={{ padding: 4 }}>
          <IconMore />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={onOpenModal}>
        <PostMedia post={post} active={String(post.id) === String(activeId)} />
      </TouchableOpacity>

      <View style={styles.postActionsRow}>
        <TouchableOpacity onPress={handleLike} disabled={likeLoading} style={{ marginRight: 14 }}>
          <IconHeart filled={liked} color={liked ? "#cf222e" : "#57606a"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenModal} style={{ marginRight: 14 }}>
          <IconComment />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 14 }}>
          <IconShare />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity>
          <IconBookmark />
        </TouchableOpacity>
      </View>

      <View style={styles.postFooter}>
        <Text style={styles.likesText}>{fmtNum(likeCount)} likes</Text>
        {caption ? (
          <Text style={styles.captionText}>
            <Text style={{ fontWeight: "700" }}>@{username}</Text> {caption}
          </Text>
        ) : null}
        {commentCount === null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <ActivityIndicator size="small" color="#8c959f" />
            <Text style={styles.viewCommentsText}>Loading…</Text>
          </View>
        ) : commentCount > 0 ? (
          <TouchableOpacity onPress={onOpenModal}>
            <Text style={styles.viewCommentsText}>
              View all {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onOpenModal}>
            <Text style={styles.viewCommentsText}>Add a comment…</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}