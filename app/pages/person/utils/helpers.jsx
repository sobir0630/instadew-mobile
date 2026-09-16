export function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n ?? 0);
}
export function getInitials(name = "") {
  return (
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??"
  );
}
export function getCommentAuthor(c) {
  return c.author?.username || c.author?.full_name || c.username || c.user?.username || "user";
}
export function getCommentAvatar(c) {
  return (
    c.author?.avatar ||
    c.author?.profile_picture ||
    c.author?.image ||
    c.user?.avatar ||
    c.user?.profile_picture ||
    null
  );
}
export function getCommentBody(c) {
  return c.body || c.text || c.content || "";
}
export function getCommentTime(c) {
  const raw = c.created_at || c.time || "";
  if (!raw) return "";
  try { return new Date(raw).toLocaleDateString(); } catch { return raw; }
}

// Post/video/saved elementidan preview rasm manzilini olish.
export function getMediaThumb(item) {
  return (
    item.thumbnail ||
    item.cover ||
    item.picture ||
    item.image ||
    item.preview ||
    item.src ||
    ""
  );
}

// Berilgan element video ekanligini aniqlash.
export function isVideoItem(item, fallbackType) {
  if (item?.type) return item.type === "video";
  if (item?.media_type) return item.media_type === "video";
  if (item?.video || item?.video_url || item?.video_file) return true;
  return fallbackType === "video";
}

// Video elementining o'zi (video fayl manzili).
export function getVideoSrc(item) {
  return item.video || item.video_url || item.video_file || item.src || "";
}