import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../../api/server";

// ═══════════════════════════════════════════════════════════════════════
//  AUTH HELPER
// ═══════════════════════════════════════════════════════════════════════

const authHeader = async () => {
  const token = (await AsyncStorage.getItem("token"))?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ═══════════════════════════════════════════════════════════════════════
//  REELS FEED
// ═══════════════════════════════════════════════════════════════════════

export async function fetchReelsVideos(url) {
  const res = await API.get(url, { headers: await authHeader() });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════
//  COMMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function fetchVideoComments(videoId) {
  const res = await API.get(`/comments/comments/?video=${videoId}`, { headers: await authHeader() });
  const data = res.data;
  return data.results || data;
}

export async function submitVideoComment(videoId, text) {
  const res = await API.post(
    `/comments/comments/`,
    { video_id: videoId, text: text.trim() },
    { headers: await authHeader() }
  );
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════
//  LIKE
// ═══════════════════════════════════════════════════════════════════════

export async function toggleVideoLike(video) {
  const res = await API.post(
    `/videos/video/${video.id}/like/`,
    { id: video.id, type: video },
    { headers: await authHeader() }
  );
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════
//  FOYDALANUVCHI AVATARI
// ═══════════════════════════════════════════════════════════════════════

export async function fetchUserAvatar(userId) {
  const res = await API.get(`/users/user-view/${userId}/`, { headers: await authHeader() });
  return res.data?.avatar || null;
}