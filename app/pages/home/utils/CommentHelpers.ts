// ═══════════════════════════════════════════════════════════════════════
//  COMMENT HELPERS — turli backend formatlaridan bir xil maydonlarni olish
// ═══════════════════════════════════════════════════════════════════════

export function getCommentAuthor(c) {
  return c.author?.username || c.author?.full_name || c.username || c.user?.username || "user";
}
export function getCommentAvatar(c) {
  return c.author?.avatar || c.author?.profile_picture || c.author?.image || c.user?.avatar || c.user?.profile_picture || null;
}
export function getCommentBody(c) {
  return c.body || c.text || c.content || "";
}
export function getCommentTime(c) {
  const raw = c.created_at || c.time || "";
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString(); } catch { return raw; }
}