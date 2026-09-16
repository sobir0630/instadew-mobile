import AsyncStorage from "@react-native-async-storage/async-storage";
import { api as API } from "../../../api/server";

// ═══════════════════════════════════════════════════════════════════════
//  AUTH HELPERS
// ═══════════════════════════════════════════════════════════════════════

export const getToken = async () => await AsyncStorage.getItem("token");
export const authHeader = async () => {
  const token = (await getToken())?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ═══════════════════════════════════════════════════════════════════════
//  FEED API
// ═══════════════════════════════════════════════════════════════════════

export async function fetchPosts() {
  const res = await API.get("/posts/post/", { headers: await authHeader() });
  return Array.isArray(res.data) ? res.data : res.data?.results || [];
}

export async function fetchVideos() {
  const res = await API.get("/videos/reals-videos/", { headers: await authHeader() });
  return Array.isArray(res.data) ? res.data : res.data?.results || [];
}

export async function fetchCurrentUser() {
  const id = await AsyncStorage.getItem("user_id");
  if (!id) throw new Error("ID topilmadi");
  const res = await API.get(`/users/register/${id}/`, { headers: await authHeader() });
  return res.data;
}

export async function fetchUsers() {
  const res = await API.get(`/users/register/`, { headers: await authHeader() });
  return Array.isArray(res.data) ? res.data : res.data?.results || [];
}

export async function fetchComments(postId) {
  const res = await API.get(`/comments/comments/?post=${postId}`, { headers: await authHeader() });
  const d = res.data;
  return Array.isArray(d) ? d : d?.results || d?.comments || [];
}

export async function submitComment(postId, text) {
  const id = await AsyncStorage.getItem("user_id");
  const res = await API.post(`/comments/comments/`, { post_id: postId, text, user: id }, { headers: await authHeader() });
  return res.data;
}

export async function toggleLikeAPI(postId) {
  const res = await API.post(`/posts/post/${postId}/like/`, {}, { headers: await authHeader() });
  return res.data;
}