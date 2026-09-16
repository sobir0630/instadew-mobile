import { StyleSheet } from "react-native";

// ═══════════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════════

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  logoBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#0969da", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 17, fontWeight: "800", color: "#0969da", letterSpacing: -0.4 },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 36,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#24292f", padding: 0 },
  searchDropdown: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 500,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  noResultsText: { padding: 14, fontSize: 13, color: "#8c959f" },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  suggestionRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f6f8fa" },
  suggestionUsername: { fontSize: 13, fontWeight: "600", color: "#24292f" },
  suggestionFullname: { fontSize: 11, color: "#57606a" },

  // Stories (legacy)
  storiesRow: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  storyItem: { alignItems: "center", gap: 6, width: 64 },
  storyRing: { width: 62, height: 62, borderRadius: 16, padding: 2, alignItems: "center", justifyContent: "center" },
  storyRingInner: {
    width: "100%", height: "100%", borderRadius: 14,
    backgroundColor: "#f6f8fa", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },

  divider: { height: 1, backgroundColor: "#d0d7de", marginBottom: 16 },

  // Error banner
  errorBanner: {
    marginHorizontal: 16, marginBottom: 16, padding: 14,
    borderRadius: 10, backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#ffcdd0",
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  errorText: { fontSize: 13, color: "#cf222e", flex: 1 },
  retryBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: "#cf222e" },
  retryBtnText: { fontSize: 12, fontWeight: "600", color: "#cf222e" },

  // Post card
  postCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 14 },
  postUsername: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  postTime: { fontSize: 11, color: "#8c959f" },
  postImage: { width: "100%", aspectRatio: 1, backgroundColor: "#f6f8fa" },
  postActionsRow: { flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 6 },
  postFooter: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  likesText: { fontSize: 13, fontWeight: "700", color: "#24292f" },
  captionText: { fontSize: 13, color: "#24292f", lineHeight: 19 },
  viewCommentsText: { fontSize: 13, color: "#8c959f" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: "#d0d7de",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#8c959f" },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 56,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  navItem: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navItemActive: { backgroundColor: "#dbeafe" },

  // ── MODAL ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(36,41,47,0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
  },
  modalUsername: { fontSize: 13, fontWeight: "700", color: "#24292f" },
  modalTime: { fontSize: 11, color: "#57606a" },
  modalImage: { width: "100%", height: 260, backgroundColor: "#0d1117" },
  modalCaptionWrap: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#d0d7de" },
  modalCaptionText: { fontSize: 13, color: "#24292f", lineHeight: 19 },
  commentsList: { flex: 1 },
  emptyCommentsText: { color: "#8c959f", fontSize: 13, textAlign: "center", marginTop: 20 },
  commentText: { fontSize: 13, color: "#24292f" },
  commentTime: { fontSize: 11, color: "#8c959f", marginTop: 2 },
  modalActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600", color: "#57606a" },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
  },
  commentInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: "#f6f8fa",
    color: "#24292f",
  },
  postBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // ── Stories v2 (gradient rings) ──
  storiesRowNew: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  storyItemNew: { alignItems: "center", width: 68, marginRight: 2 },
  storyRingNew: { width: 66, height: 66, borderRadius: 20, padding: 2.5, alignItems: "center", justifyContent: "center" },
  storyRingInnerNew: {
    width: "100%", height: "100%", borderRadius: 17,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  plusBadge: {
    position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#0969da", borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  plusText: { color: "#fff", fontSize: 13, fontWeight: "800", marginTop: -1 },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#2ecc71", borderWidth: 2, borderColor: "#fff",
  },
  storyUsername: { fontSize: 11, fontWeight: "600", color: "#24292f", marginTop: 6, width: 68, textAlign: "center" },

  // ── Video post ──
  videoWrap: { width: "100%", aspectRatio: 1, backgroundColor: "#000", overflow: "hidden" },
  playCircle: {
    position: "absolute", top: "50%", left: "50%", marginTop: -28, marginLeft: -28,
    width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  copyBadge: {
    position: "absolute", bottom: 12, left: 12,
    backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  copyText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Carousel dots ──
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 5, position: "absolute", bottom: 10, alignSelf: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#fff", width: 7, height: 7, borderRadius: 3.5 },

  // ── section heading (Discover / Reels) ──
  sectionHeading: { fontSize: 15, fontWeight: "700", color: "#24292f", paddingHorizontal: 16, marginBottom: 10 },

  // ── Discover grid ──
  discoverThumb: { width: "100%", height: "100%", borderRadius: 4, backgroundColor: "#e9ecef" },
  discoverPlayBadge: {
    position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },

  // ── Reels row ──
  reelCard: { width: 118, height: 196, borderRadius: 12, overflow: "hidden", backgroundColor: "#e9ecef" },
  reelThumb: { width: "100%", height: "100%" },
  reelPlayBadge: {
    position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  reelDurationBadge: {
    position: "absolute", bottom: 34, right: 8, backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  reelDurationText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  reelOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.35)" },
  reelViewsText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  reelUsernameText: { color: "#e9ecef", fontSize: 10, marginTop: 1 },
});