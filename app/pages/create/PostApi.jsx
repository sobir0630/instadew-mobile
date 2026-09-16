import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../api/server";

// ════════════════════════════════════════════════════════════════════════════
//  API HELPERS
// ════════════════════════════════════════════════════════════════════════════

export async function getToken() {
  return await AsyncStorage.getItem("token");
}

export async function searchUsers(query) {
  if (!query.trim()) return [];
  const token = await getToken();
  const res = await API.get(`/users/register/?search=${query}`, {
    headers: { Authorization: `Bearer ${token?.trim()}` },
  });
  const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
  return data.slice(0, 8);
}