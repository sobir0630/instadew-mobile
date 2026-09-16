import { StyleSheet } from "react-native";

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f5f8" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ebebef",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: "#e8eaed", backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23" },
  headerPublishBtn: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 10 },
  headerPublishText: { fontWeight: "700", fontSize: 13 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Error
  errorBanner: {
    backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 12, padding: 12, marginBottom: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  errorText: { fontSize: 13, color: "#cf222e", flex: 1 },

  // Media toggle
  mediaToggleWrap: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e8eaed", padding: 4, marginBottom: 16,
  },
  mediaToggleBtn: {
    flex: 1, height: 40, borderRadius: 10, backgroundColor: "transparent",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  mediaToggleText: { fontWeight: "700", fontSize: 14, color: "#8c959f" },

  // Upload zone
  uploadZone: {
    width: "100%", aspectRatio: 1, borderRadius: 18,
    borderWidth: 2, borderColor: "#d8dae0", borderStyle: "dashed",
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", gap: 16,
  },
  uploadIconCircle: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: "#f4f5f7",
    borderWidth: 1.5, borderColor: "#e2e4e9",
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23", marginBottom: 6 },
  uploadSubtitle: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 19 },
  uploadSelectBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingVertical: 9, paddingHorizontal: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e2e4e9", backgroundColor: "#f9fafb",
  },
  uploadSelectText: { fontSize: 13, fontWeight: "600", color: "#1a1d23" },

  // Media preview
  mediaPreviewWrap: {
    width: "100%", aspectRatio: 1, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "#e2e4e9", position: "relative",
  },
  mediaPreview: { width: "100%", height: "100%" },
  mediaPreviewActions: { position: "absolute", top: 12, right: 12, flexDirection: "row", gap: 8 },
  mediaActionBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(15,20,30,0.65)",
    alignItems: "center", justifyContent: "center",
  },

  // Caption
  captionCard: {
    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e8eaed",
    marginBottom: 12, padding: 16,
  },
  cardLabel: {
    fontSize: 11, fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8,
  },
  captionInput: {
    fontSize: 15, color: "#1a1d23", lineHeight: 22, minHeight: 90,
    textAlignVertical: "top", padding: 0,
  },
  captionFooterRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10,
  },
  captionCounter: { fontSize: 11, color: "#b0b4be", fontWeight: "500" },

  // Options
  optionsCard: {
    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e8eaed",
    marginBottom: 12, overflow: "hidden",
  },
  optionsCardLabel: {
    fontSize: 11, fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.7, padding: 16, paddingBottom: 6,
  },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  optionIconWrap: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  optionLabel: { fontSize: 14, fontWeight: "500", color: "#1a1d23" },
  optionValue: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  optionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  optionBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  optionDivider: { height: 1, backgroundColor: "#f4f5f7", marginHorizontal: 16 },

  // Hashtag preview
  hashtagPreviewWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  hashtagPreviewChip: { backgroundColor: "#f3e9ff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  hashtagPreviewText: { fontSize: 13, color: "#6f42c1", fontWeight: "500" },

  // Footer
  footer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: "#ebebef", backgroundColor: "#fff",
  },
  footerBtn: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  footerBtnContent: { flexDirection: "row", alignItems: "center", gap: 9 },
  footerBtnText: { fontWeight: "700", fontSize: 16, color: "#fff" },
  footerHint: { textAlign: "center", fontSize: 11, color: "#b0b4be", marginTop: 8 },

  // ── BOTTOM SHEET (shared) ──
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,20,30,0.6)", justifyContent: "flex-end" },
  sheetCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "75%", minHeight: "40%",
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#d0d7de", alignSelf: "center", marginTop: 12 },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: "#f0f2f4",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23" },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  sheetSearchWrap: { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f0f2f4" },
  sheetSearchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f4f5f7", borderRadius: 12, paddingHorizontal: 14, height: 40,
  },
  sheetSearchInput: { flex: 1, fontSize: 14, color: "#1a1d23" },

  taggedChipsWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f2f4",
  },
  taggedChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#dbeafe", borderRadius: 20, paddingVertical: 4, paddingLeft: 4, paddingRight: 10,
  },
  taggedChipAvatar: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#667eea",
    alignItems: "center", justifyContent: "center",
  },
  taggedChipAvatarText: { fontSize: 9, fontWeight: "700", color: "#fff" },
  taggedChipText: { fontSize: 12, fontWeight: "600", color: "#0550ae" },

  sheetEmptyWrap: { padding: 28, alignItems: "center" },
  sheetEmptyText: { fontSize: 13, color: "#8c959f" },

  userRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f8f9fa",
  },
  userRowAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#667eea",
    alignItems: "center", justifyContent: "center",
  },
  userRowAvatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  userRowUsername: { fontSize: 14, fontWeight: "600", color: "#1a1d23" },
  userRowFullname: { fontSize: 12, color: "#8c959f", marginTop: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#d0d7de",
    alignItems: "center", justifyContent: "center",
  },
  checkCircleActive: { backgroundColor: "#0969da", borderColor: "#0969da" },

  sheetFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#f0f2f4" },
  sheetDoneBtnBlue: {
    width: "100%", paddingVertical: 12, borderRadius: 12, backgroundColor: "#0969da",
    alignItems: "center",
  },
  sheetDoneBtnPurple: {
    width: "100%", paddingVertical: 12, borderRadius: 12, backgroundColor: "#8250df",
    alignItems: "center",
  },
  sheetDoneBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sheetDoneBtnOutline: {
    width: "100%", paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#d0d7de", alignItems: "center",
  },
  sheetDoneBtnOutlineText: { color: "#24292f", fontWeight: "600", fontSize: 15 },

  // Location
  locationRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  locationIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#f4f5f7",
    alignItems: "center", justifyContent: "center",
  },
  locationText: { fontSize: 14, color: "#1a1d23", flex: 1 },
  locationTextActive: { fontWeight: "600", color: "#0969da" },
  locationAddText: { fontSize: 14, fontWeight: "500", color: "#1a1d23" },
  locationRemoveText: { fontSize: 14, fontWeight: "500", color: "#cf222e" },

  // Hashtag panel
  hashtagInputWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f2f4" },
  hashtagInputBox: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, minHeight: 44,
    backgroundColor: "#f4f5f7", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center",
  },
  hashtagChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(130,80,223,0.1)", borderWidth: 1, borderColor: "rgba(130,80,223,0.15)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  hashtagChipText: { fontSize: 13, fontWeight: "600", color: "#6f42c1" },
  hashtagTextInput: { flex: 1, minWidth: 80, fontSize: 14, color: "#1a1d23" },
  hashtagHelpText: { fontSize: 11, color: "#8c959f", marginTop: 6 },

  suggestionsLabel: {
    fontSize: 11, fontWeight: "700", color: "#8c959f",
    textTransform: "uppercase", letterSpacing: 0.6, marginVertical: 10,
  },
  suggestionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 16 },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#d0d7de", backgroundColor: "#fff",
  },
  suggestionChipText: { fontSize: 13, fontWeight: "500", color: "#1a1d23" },

  // Advanced panel
  advancedRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  advancedIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  advancedLabel: { fontSize: 14, fontWeight: "600", color: "#1a1d23" },
  advancedDesc: { fontSize: 12, color: "#8c959f", marginTop: 2 },
  advancedDivider: { height: 1, backgroundColor: "#f0f2f4", marginHorizontal: 20 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, position: "relative" },
  toggleThumb: {
    position: "absolute", top: 2, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#fff",
  },
});