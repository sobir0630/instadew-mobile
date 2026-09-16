import { StyleSheet } from "react-native";

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // Blobs
  blob1: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(99,102,241,0.12)",
    top: -80,
    left: -60,
  },
  blob2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(139,92,246,0.10)",
    bottom: -60,
    right: -60,
  },
  blob3: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(59,130,246,0.08)",
    top: "40%",
    right: "10%",
  },

  // Card
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },

  // Logo
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
  },

  // Field
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    paddingVertical: 0,
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fieldErrorText: {
    fontSize: 11,
    color: "rgba(248,113,113,0.9)",
  },

  // Password row
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  forgotText: {
    fontSize: 12,
    color: "rgba(99,102,241,0.85)",
    fontWeight: "600",
  },

  // Error banner
  errorBanner: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: "rgba(248,113,113,0.9)",
    flex: 1,
  },

  // Submit
  submitBtn: {
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Footer
  footer: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  footerLink: {
    fontSize: 13,
    color: "#818cf8",
    fontWeight: "700",
  },

  // Shimmer
  shimmerLine: {
    height: 1,
    width: "100%",
    maxWidth: 420,
    marginTop: 2,
    borderRadius: 1,
  },
});