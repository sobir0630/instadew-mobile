import AsyncStorage from "@react-native-async-storage/async-storage";
import { WS_URL } from "../../../api/config"; // loyihangizga qarab moslang
import { PALETTES } from "../constants/config";

export async function getMyUser() {
  try {
    return (
      (await AsyncStorage.getItem("login_username")) ||
      (await AsyncStorage.getItem("username")) ||
      "me"
    );
  } catch (err) {
    console.error("[getMyUser] error:", err);
    return "me";
  }
}

export async function getMyUserId() {
  try {
    return await AsyncStorage.getItem("user_id");
  } catch (err) {
    console.error("[getMyUserId] error:", err);
    return null;
  }
}

export async function authHeader() {
  try {
    const token = await AsyncStorage.getItem("token");
    return { Authorization: `Bearer ${token?.trim()}` };
  } catch (err) {
    console.error("[authHeader] error:", err);
    return {};
  }
}

export function buildRoomName(u1, u2) {
  return [u1, u2].sort().join("_");
}

export function wsBase() {
  const base = WS_URL || "ws://10.84.119.60:8000";
  return base;
}

export function timeOnly(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (err) {
    console.error("[timeOnly] error:", err);
    return "";
  }
}

export function getInitials(name = "") {
  const s = String(name || "").trim();
  if (!s) return "?";
  return (
    s.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"
  );
}

export function formatDuration(ms = 0) {
  const totalSec = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatFileSize(bytes = 0) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function sanitizeText(text, maxLen) {
  return String(text || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .slice(0, maxLen);
}

export function getPalette(name = "") {
  if (!name || typeof name !== "string") return PALETTES[0];
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length;
  return PALETTES[idx];
}