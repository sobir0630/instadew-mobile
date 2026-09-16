import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_HOST_WEB } from "../../../api/ip";
import API from "../../../api/server";

// ═══════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

export const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// O'zingizning domeningizga almashtiring (havolani nusxalash / ulashish uchun)

// Namuna kontaktlar ro'yxati — real kontaktlar/chat API bilan almashtiring
async function authHeader() {
  try {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token?.trim()}` };
  } catch (err) {
    console.error("[authHeader] error:", err);
    return {};
  }
}


async function fetchUsers() {
  try {
    
    const headers = await authHeader();
    const res = await API.get(`/users/register/`, { headers });
    const d = res.data;
    console.log("[fetchUsers] data:", d);
    return Array.isArray(d) ? d : d?.results || [];

  } catch (err) {
    console.error("[fetchUsers] error:", err?.response?.data || err.message);
    return [];
  }
}

export async function getUsers() {
  const users = await fetchUsers();
  return users.map(user => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar || `${API_HOST_WEB}media/avatars/user/no_user/avatar.png`, // default avatar
  }));
};
