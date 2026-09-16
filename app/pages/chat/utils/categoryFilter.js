// ════════════════════════════════════════════════════════════════════════════
//  CATEGORY FILTER — Telegramdagidek "All / Unread / Channels / Bots / Groups"
//  tab'lari uchun filtr mantig'i. BUTUN FAYL ATAYLAB shu joyga izolyatsiya
//  qilingan — kelajakda backend javobi o'zgarsa, FAQAT shu faylni tahrirlang.
// ════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "channels", label: "Channels" },
  { key: "bots", label: "Bots" },
  { key: "groups", label: "Groups" },
];

// ── ⚠️ DIQQAT / KEYINCHALIK O'ZGARTIRISH UCHUN ──────────────────────────────
// Hozirgi holatda /users/register/ backend endpointi oddiy foydalanuvchi
// obyektini qaytaradi va unda "bu bot/kanal/guruhmi" degan aniq maydon yo'q.
// Shu sabab quyidagi getUserKind() funksiyasi ehtimoliy bir nechta maydon
// nomini (is_bot, is_channel, is_group, chat_type, kind) tekshiradi.
//
// Backend'ga shu maydonlar qo'shilgach (masalan `chat_type: "bot"`), FAQAT
// shu funksiya ichini o'zgartiring — CategoryTabs.jsx yoki ChatScreen.jsx'ga
// tegishning shart emas, ular shu funksiyaga tayanadi.
export function getUserKind(user) {
  if (!user) return "user";
  if (user.is_bot || user.chat_type === "bot" || user.kind === "bot") return "bots";
  if (user.is_channel || user.chat_type === "channel" || user.kind === "channel") return "channels";
  if (user.is_group || user.chat_type === "group" || user.kind === "group") return "groups";
  return "user"; // oddiy shaxsiy (1:1) suhbat
}

// users — suhbati bor foydalanuvchilar ro'yxati (allaqachon lastMsgMap bo'yicha filtrlangan)
// categoryKey — tanlangan tab (CATEGORIES dagi key)
// unreadCountMap — { username: unreadCount }
export function filterByCategory(users, categoryKey, { unreadCountMap = {} } = {}) {
  switch (categoryKey) {
    case "unread":
      return users.filter((u) => (unreadCountMap[u.username] || 0) > 0);
    case "channels":
      return users.filter((u) => getUserKind(u) === "channels");
    case "bots":
      return users.filter((u) => getUserKind(u) === "bots");
    case "groups":
      return users.filter((u) => getUserKind(u) === "groups");
    case "all":
    default:
      return users;
  }
}