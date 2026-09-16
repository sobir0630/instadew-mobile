import { StyleSheet } from "react-native";

// ═══════════════════════════════════════════════════════════════════════
//  STORY VIEWER STYLES — Instagram uslubidagi to'liq ekran ko'rinish
// ═══════════════════════════════════════════════════════════════════════

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  progressRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  avatarWrap: { width: 34, height: 34, borderRadius: 17, overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%", height: "100%", borderRadius: 17, backgroundColor: "#667eea",
    alignItems: "center", justifyContent: "center",
  },
  avatarFallbackText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  username: { color: "#fff", fontWeight: "700", fontSize: 13 },
  timeText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  closeBtn: { padding: 6 },

  mediaArea: { flex: 1, backgroundColor: "#000" },
  media: { width: "100%", height: "100%" },
  loadingWrap: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  tapLeft: { position: "absolute", top: 0, bottom: 0, left: 0, width: "35%" },
  tapRight: { position: "absolute", top: 0, bottom: 0, right: 0, width: "65%" },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 13,
  },
  likeBtn: { padding: 4 },
  sendBtn: { paddingHorizontal: 4 },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  likeCountText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
    paddingBottom: 10,
  },

  emptyStoryWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyStoryText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
});