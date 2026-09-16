import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f8fa" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#24292f", flex: 1, textAlign: "center" },
  settingsBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1, borderColor: "#d0d7de", backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },

  // Avatar ring
  avatarRing: {
    width: 84, height: 84, borderRadius: 42, padding: 2,
    backgroundColor: "#e53935",
  },
  avatarRingInner: {
    width: "100%", height: "100%", borderRadius: 40, padding: 2,
    backgroundColor: "#f6f8fa", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },

  // Stats
  statValue: { fontSize: 18, fontWeight: "700", color: "#24292f" },
  statLabel: { fontSize: 12, color: "#57606a", marginTop: 3 },

  // Bio
  fullNameText: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  usernameText: { fontSize: 13, color: "#57606a", marginTop: 3 },
  websiteText: { fontSize: 13, color: "#0969da", marginTop: 3 },
  bioText: { fontSize: 13, color: "#24292f", marginTop: 8, lineHeight: 19 },

  // Buttons
  editProfileBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center",
    backgroundColor: "#0969da", borderWidth: 1, borderColor: "#0969da",
  },
  editProfileBtnText: { fontWeight: "600", fontSize: 13, color: "#fff" },
  editPostsBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center",
    backgroundColor: "#f6f8fa", borderWidth: 1, borderColor: "#d0d7de",
  },
  editPostsBtnText: { fontWeight: "600", fontSize: 13, color: "#24292f" },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    borderTopWidth: 1, borderTopColor: "#d0d7de",
    borderBottomWidth: 1, borderBottomColor: "#d0d7de",
    backgroundColor: "#fff",
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#0969da" },

  // YANGI: pinch-zoom haqida qisqa maslahat matni
  zoomHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#8c959f",
    paddingVertical: 6,
    backgroundColor: "#fff",
  },

  // Grid — endi o'lcham (width/height/margin) PinchZoomGrid ichida
  // dinamik hisoblab, inline beriladi, shu yerda faqat umumiy stillar bor.
  gridImage: { width: "100%", height: "100%" },
  gridPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  gridSkeletonWrap: { flexDirection: "row", flexWrap: "wrap", padding: 2 },
  gridSkeletonItem: { width: "32%", aspectRatio: 1, margin: "0.6%", backgroundColor: "#e9ecef" },

  videoPlayOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: "#d0d7de",
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { fontSize: 14, color: "#8c959f" },
  createFirstPostBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: "#0969da",
  },
  createFirstPostBtnText: { fontSize: 13, fontWeight: "600", color: "#0969da" },

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
  modalOverlay: { flex: 1, backgroundColor: "rgba(36,41,47,0.65)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    height: "98%", overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 14,
    borderBottomWidth: 1, borderBottomColor: "#d0d7de",
  },
  modalUsername: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  modalTime: { fontSize: 11, color: "#57606a" },
  modalImage: { width: "100%", height: 460, backgroundColor: "#0d1117" },
  modalPlayOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, height: 260,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  modalCaptionWrap: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#d0d7de" },
  modalCaptionText: { fontSize: 13, color: "#24292f", lineHeight: 19 },
  commentsList: { flex: 1 },
  emptyCommentsText: { color: "#8c959f", fontSize: 13, textAlign: "center", marginTop: 24 },
  commentText: { fontSize: 13, color: "#24292f" },
  commentTime: { fontSize: 11, color: "#8c959f", marginTop: 2 },
  modalActionsRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "#d0d7de",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600", color: "#57606a" },
  commentInputRow: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 10, paddingHorizontal: 14,
    borderTopWidth: 1, borderTopColor: "#d0d7de",
  },
  commentInput: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1,
    borderColor: "#d0d7de", borderRadius: 8, fontSize: 13,
    backgroundColor: "#f6f8fa", color: "#24292f",
  },
  postBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    minWidth: 52, alignItems: "center", justifyContent: "center",
  },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});