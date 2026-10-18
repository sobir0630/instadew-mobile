// ════════════════════════════════════════════════════════════════════════════
//  KONFIGURATSIYA — xabar turlari, limitlar, fon (wallpaper) presetlari
// ════════════════════════════════════════════════════════════════════════════

export const MSG_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  VOICE: "voice",
  MUSIC: "music",
  FILE: "file",
};

export const MAX_TEXT_LENGTH = 4000;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB
export const MAX_AUDIO_BYTES = 30 * 1024 * 1024; // 30MB
export const MIN_VOICE_MS = 700;
export const VOICE_CANCEL_DRAG_PX = 90;

export const WALLPAPER_CATEGORIES = [
  { key: "none", label: "Standart" },
  { key: "love", label: "Sevgi" },
  { key: "friends", label: "Do'stlar" },
  { key: "alone", label: "Yolg'iz" },
  { key: "business", label: "Biznes" },
];

export const WALLPAPER_PRESETS = {
  love: [
    ["#ff9a9e", "#fecfef"],
    ["#ff6a88", "#ff99ac"],
    ["#f857a6", "#ff5858"],
    ["#ffafbd", "#ffc3a0"],
  ],
  friends: [
    ["#f6d365", "#fda085"],
    ["#84fab0", "#8fd3f4"],
    ["#fccb90", "#d57eeb"],
    ["#a1c4fd", "#c2e9fb"],
  ],
  alone: [
    ["#2c3e50", "#4b6584"],
    ["#232526", "#414345"],
    ["#0f2027", "#2c5364"],
    ["#141e30", "#243b55"],
  ],
  business: [
    ["#1e3c72", "#2a5298"],
    ["#373b44", "#4286f4"],
    ["#0f0c29", "#302b63"],
    ["#134e5e", "#71b280"],
  ],
};

export const PALETTES = [
  ["#6366F1", "#8B5CF6"], ["#EC4899", "#F43F5E"], ["#14B8A6", "#06B6D4"],
  ["#F59E0B", "#EF4444"], ["#10B981", "#3B82F6"], ["#8B5CF6", "#EC4899"],
  ["#06B6D4", "#6366F1"], ["#F97316", "#EAB308"], ["#84CC16", "#14B8A6"],
];