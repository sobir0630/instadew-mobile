import { Dimensions, StyleSheet } from "react-native";

export const SCREEN_W = Dimensions.get("window").width;

export const styles = StyleSheet.create({
  root: { flex: 1 },

  // List header
  listHeader: { padding: 18, paddingTop: 16, gap: 12, borderBottomWidth: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, paddingHorizontal: 12, height: 42, borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // 🆕 Category tabs (All / Unread / Channels / Bots / Groups)
  categoryTabsRow: { flexDirection: "row", gap: 8 },
  categoryTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  categoryTabText: { fontSize: 12, fontWeight: "700" },

  // User row
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderLeftWidth: 3 },
  userName: { fontSize: 14, fontWeight: "700" },
  userSub: { fontSize: 12, marginTop: 2 },
  unreadBadge: { minWidth: 24, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Empty / center
  centerFlex: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },

  // Bottom nav
  bottomNav: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", height: 56, borderTopWidth: 1 },
  navItem: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // Chat header
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6, borderRadius: 10 },
  chatTitle: { fontSize: 15, fontWeight: "700" },
  chatStatus: { fontSize: 11, marginTop: 1, fontWeight: "500" },

  // Messages
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  bubbleWrap: { maxWidth: "75%" },
  senderLabel: { fontSize: 10, fontWeight: "600", marginBottom: 3, marginLeft: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMedia: { padding: 3, overflow: "hidden" },
  msgTime: { fontSize: 10, marginTop: 3, marginHorizontal: 3, fontWeight: "500" },
  typingBubble: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18, marginLeft: 40,
  },

  // Media bubbles
  imageBubbleImg: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.55, borderRadius: 16 },
  mediaPlaceholder: { backgroundColor: "#475569", alignItems: "center", justifyContent: "center" },
  videoBubble: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.55, borderRadius: 16, backgroundColor: "#000" },
  videoPlayOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  uploadOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", borderRadius: 16,
  },
  audioBubbleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, minWidth: 190, maxWidth: 240 },
  audioPlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginRight: 10 },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3, height: 16 },
  waveBar: { width: 2.5, borderRadius: 2 },
  fileBubbleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, minWidth: 190, maxWidth: 240 },
  filesIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },

  // Fullscreen viewers (rasm / video umumiy)
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  viewerCloseBtn: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
  viewerCounter: { position: "absolute", top: 55, alignSelf: "center", color: "#fff", fontSize: 13, fontWeight: "600", zIndex: 10 },
  viewerPage: { width: SCREEN_W, alignItems: "center", justifyContent: "center" },
  viewerImage: { width: SCREEN_W, height: "80%" },
  viewerVideo: { width: SCREEN_W, height: "70%" },
  viewerControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 96,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    zIndex: 20,
  },
  viewerControlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(17,24,39,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerControlBtnLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(17,24,39,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  replyBlock: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderLeftWidth: 2,
    marginBottom: 8,
  },
  replyMeta: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
  replyText: { fontSize: 11, lineHeight: 15 },

  // 🆕 Pastki filmstrip (rasm/video galereyasi uchun umumiy)
  bottomStripWrap: { position: "absolute", bottom: 30, left: 0, right: 0 },
  bottomThumb: { width: 52, height: 52, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  bottomThumbActive: { borderColor: "#fff" },
  bottomThumbImg: { width: "100%", height: "100%" },

  // Input area
  inputArea: { padding: 10, paddingHorizontal: 14, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
  editingBar: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  offlineBar: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1.5,
  },
  attachBtn: { width: 30, height: 36, alignItems: "center", justifyContent: "center" },
  msgInput: { flex: 1, fontSize: 14, maxHeight: 100, paddingTop: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recordingRow: { flexDirection: "row", alignItems: "center", padding: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, gap: 8 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#EF4444" },
  voicePreviewRow: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1.5, paddingLeft: 4, paddingRight: 8 },
  voicePreviewActions: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 6 },
  voiceActionBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mediaDeleteBtn: { alignSelf: "flex-end", width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 4 },

  // Dropdown menu
  dropOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  dropMenuCard: { width: 200, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  dropMenuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 },

  // Bottom sheets (attach / wallpaper)
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheetCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingTop: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  sheetItem: { width: (SCREEN_W - 40 - 54) / 4, alignItems: "center" },
  sheetIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },

  wallpaperCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingTop: 10, paddingBottom: 30 },
  catTabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  wallGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  wallSwatchWrap: { width: (SCREEN_W - 40 - 36) / 4, height: 70, borderRadius: 14, overflow: "hidden" },
  wallSwatch: { width: "100%", height: "100%" },
  resetWallBtn: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", marginBottom: 16 },
  customWallBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
  },

  // 🆕 Musiqa pleyeri (MusicPlayerModal)
  playerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  playerCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: "center" },
  playerArtwork: { width: SCREEN_W * 0.6, height: SCREEN_W * 0.6, borderRadius: 20, marginBottom: 20 },
  playerTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  playerArtist: { fontSize: 13, marginTop: 4, textAlign: "center" },
  playerSeekRow: { flexDirection: "row", alignItems: "center", width: "100%", gap: 8, marginTop: 18 },
  playerTimeText: { fontSize: 11, width: 38, textAlign: "center" },
  playerControlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 22 },
  playerPlayBtn: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" },
});