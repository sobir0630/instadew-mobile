// ═══════════════════════════════════════════════════════════════════════
//  VIDEO NORMALIZERS — backend javobini UI komponentlari kutgan shaklga keltiradi
// ═══════════════════════════════════════════════════════════════════════

export function normalizeVideoForDiscover(video, index = 0) {
  const thumbnail = video.thumbnail || video.cover || video.image || video.poster || video.video_thumbnail || null;
  const mediaUrl = video.video || video.video_url || video.url || video.file || null;
  return {
    ...video,
    id: video.id ?? `${video.title || "video"}-${index}`,
    thumbnail,
    video_url: mediaUrl,
    is_video: true,
    tall: index % 3 === 0,
    username: video.username || video.user?.username || video.author?.username || "user",
    views: video.views || video.views_count || video.view_count || 0,
    duration: video.duration || video.video_duration || 0,
  };
}

export function normalizeVideoForReel(video, index = 0) {
  const normalized = normalizeVideoForDiscover(video, index);
  return {
    ...normalized,
    thumbnail: normalized.thumbnail || "",
    username: normalized.username,
    views: normalized.views,
    duration: normalized.duration,
  };
}