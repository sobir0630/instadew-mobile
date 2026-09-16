import { Dimensions } from "react-native";

// ═══════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

export const { width: SCREEN_W } = Dimensions.get("window");

export const AVATAR_COLORS = [
  ["#667eea", "#764ba2"], ["#10b981", "#059669"], ["#f59e0b", "#d97706"],
  ["#ef4444", "#dc2626"], ["#0969da", "#0550ae"], ["#ec4899", "#db2777"], ["#6366f1", "#4f46e5"],
];

export const SEEN_STORAGE_KEY = "instadew_seen_stories";
export const UNSEEN_GRADIENT = ["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"];
export const SEEN_GRADIENT = ["#d0d7de", "#d0d7de"];