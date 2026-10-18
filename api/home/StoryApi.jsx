import AsyncStorage from "@react-native-async-storage/async-storage";

// ═══════════════════════════════════════════════════════════════════════
//  STORY API  —  hozircha MOCK (sinov) qatlam
// ═══════════════════════════════════════════════════════════════════════
//
// Backendda /stories/ endpointlari hali yo'q. Shu sabab bu fayl AsyncStorage
// ustida ishlaydigan "soxta backend" vazifasini bajaradi — like va comment
// haqiqatan ham saqlanadi (ilova qayta ochilganda ham turadi), shuning uchun
// UI qismini (StoryViewer) to'liq sinab ko'rish mumkin.
//
// ── KELAJAKDA HAQIQIY BACKEND ULANGANDA ──────────────────────────────────
// Faqat quyidagi funksiyalar ichidagi mock-logikani almashtiring, boshqa
// hech qanday komponentni o'zgartirish shart emas (ular faqat shu
// funksiyalarni chaqiradi):
//
//   fetchStoryGroups()        →  GET  /stories/groups/
//   toggleStoryLike(id)       →  POST /stories/{id}/like/
//   submitStoryComment(...)   →  POST /stories/{id}/comments/
//
// Kutilayotgan javob shakli (`StoryGroup`):
//   {
//     user: { id, username, full_name, avatar },
//     stories: [
//       {
//         id, media_type: "photo" | "video", media_url, thumbnail,
//         duration, created_at, likes_count, is_liked,
//         comments: [{ id, author, text, created_at }],
//       },
//     ],
//   }

const STORY_DB_KEY = "instadew_story_mock_db";

// Sinov uchun: bitta video-story (umumiy ochiq test video havolasi).
const DEFAULT_MOCK_DB = {
  groups: [
    {
      user: {
        id: "demo-story-user",
        username: "instadew_demo",
        full_name: "Instadew Demo",
        avatar: null,
      },
      stories: [
        {
          id: "story-1",
          media_type: "video",
          media_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          thumbnail: "https://picsum.photos/seed/instadew-story/400/700",
          duration: 8000,
          created_at: new Date().toISOString(),
          likes_count: 3,
          is_liked: false,
          comments: [
            { id: "c1", author: "aziz_dev", text: "Zo'r ekan!", created_at: new Date().toISOString() },
          ],
        },
      ],
    },
  ],
};

async function loadDB() {
  try {
    const raw = await AsyncStorage.getItem(STORY_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  await saveDB(DEFAULT_MOCK_DB);
  return DEFAULT_MOCK_DB;
}

async function saveDB(db) {
  await AsyncStorage.setItem(STORY_DB_KEY, JSON.stringify(db));
}

export async function fetchStoryGroups() {
  const db = await loadDB();
  return db.groups;
}

export async function toggleStoryLike(storyId) {
  const db = await loadDB();
  for (const group of db.groups) {
    const story = group.stories.find((s) => s.id === storyId);
    if (story) {
      story.is_liked = !story.is_liked;
      story.likes_count = Math.max(0, story.likes_count + (story.is_liked ? 1 : -1));
      await saveDB(db);
      return { is_liked: story.is_liked, likes_count: story.likes_count };
    }
  }
  return null;
}

export async function submitStoryComment(storyId, text, authorUsername = "you") {
  const db = await loadDB();
  for (const group of db.groups) {
    const story = group.stories.find((s) => s.id === storyId);
    if (story) {
      const comment = {
        id: `c-${Date.now()}`,
        author: authorUsername,
        text,
        created_at: new Date().toISOString(),
      };
      story.comments.push(comment);
      await saveDB(db);
      return comment;
    }
  }
  return null;
}