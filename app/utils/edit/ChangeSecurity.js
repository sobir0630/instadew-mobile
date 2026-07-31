// ChangePassword.js — React Native versiyasi
// API va mantiq (debounce bilan eski parolni tekshirish, kuch (strength) hisoblash,
// step-by-step unlock, muvaffaqiyatdan keyin token/user_id ni tozalab login'ga qaytarish)
// aynan asl holicha qoldirildi. Faqat DOM/CSS -> RN komponentlariga o'girildi va
// localStorage -> AsyncStorage (async) ishlatildi.

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
} from "lucide-react-native";
import { router, usePathname } from "expo-router";
import API from "../../api/server";


// ════════════════════════════════════════════════════════════════════════════
//  UTILS — o'zgartirilmadi
// ════════════════════════════════════════════════════════════════════════════

function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLOR = ["#d0d7de", "#cf222e", "#f59e0b", "#2da44e", "#0969da"];

// ════════════════════════════════════════════════════════════════════════════
//  ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Spinner({ size = 16, color = "#fff" }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        borderTopColor: "transparent",
        transform: [{ rotate }],
      }}
    />
  );
}

function FadeIn({ children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

// ════════════════════════════════════════════════════════════════════════════
//  OLD PASSWORD FIELD — debounce bilan server tekshiruv (mantiq bir xil)
// ════════════════════════════════════════════════════════════════════════════

function OldPasswordField({ value, onChangeText, onVerified, error }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "valid" | "invalid"
  const timerRef = useRef(null);

  const handleChange = (val) => {
    onChangeText(val);
    setStatus("idle");
    onVerified(false);
    clearTimeout(timerRef.current);

    if (!val) {
      setChecking(false);
      return;
    }

    setChecking(true);
    timerRef.current = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        // /users/check-password/ — sizning ishlaydigan endpoint
        const res = await API.post(
          "/users/check-password/",
          { password: val },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // res.data.valid: true -> to'g'ri, false -> xato
        if (res.data.valid === true) {
          setStatus("valid");
          onVerified(true);
        } else {
          setStatus("invalid");
          onVerified(false);
        }
      } catch (err) {
        setStatus("invalid");
        onVerified(false);
        console.log("check-password error:", err.response?.data);
      } finally {
        setChecking(false);
      }
    }, 700);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const isError = status === "invalid";
  const isSuccess = status === "valid";
  const borderColor = isError ? "#cf222e" : isSuccess ? "#2da44e" : focused ? "#0969da" : "#d0d7de";
  const iconColor = isError ? "#cf222e" : isSuccess ? "#2da44e" : focused ? "#0969da" : "#8c959f";

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>Current Password</Text>

      <View style={[styles.inputBox, { borderColor }]}>
        <Lock size={16} color={iconColor} style={{ marginRight: 10 }} />
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder="Enter current password"
          placeholderTextColor="#8c959f"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {checking && <Spinner size={14} color="#8c959f" />}
          {!checking && isSuccess && <Check size={16} color="#2da44e" strokeWidth={2.5} />}
          {!checking && isError && <X size={16} color="#cf222e" strokeWidth={2.5} />}
          <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={8}>
            {visible ? (
              <EyeOff size={17} color="#8c959f" />
            ) : (
              <Eye size={17} color="#8c959f" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {checking && (
        <View style={styles.statusRow}>
          <Spinner size={10} color="#8c959f" />
          <Text style={styles.statusTextMuted}>Verifying…</Text>
        </View>
      )}
      {!checking && isSuccess && (
        <View style={styles.statusRow}>
          <Check size={11} color="#2da44e" strokeWidth={2.5} />
          <Text style={styles.statusTextSuccess}>Password verified ✓</Text>
        </View>
      )}
      {!checking && isError && (
        <View style={styles.statusRow}>
          <AlertCircle size={11} color="#cf222e" strokeWidth={2.5} />
          <Text style={styles.statusTextError}>Incorrect password. Please try again.</Text>
        </View>
      )}
      {error && (
        <View style={styles.statusRow}>
          <AlertCircle size={11} color="#cf222e" strokeWidth={2.5} />
          <Text style={styles.statusTextError}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  NEW PASSWORD FIELD
// ════════════════════════════════════════════════════════════════════════════

function PasswordField({ label, value, onChangeText, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderColor = error ? "#cf222e" : focused ? "#0969da" : "#d0d7de";
  const iconColor = error ? "#cf222e" : focused ? "#0969da" : "#8c959f";

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, { borderColor }]}>
        <Lock size={16} color={iconColor} style={{ marginRight: 10 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8c959f"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={8}>
          {visible ? <EyeOff size={17} color="#8c959f" /> : <Eye size={17} color="#8c959f" />}
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.statusRow}>
          <AlertCircle size={11} color="#cf222e" strokeWidth={2.5} />
          <Text style={styles.statusTextError}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STRENGTH BAR
// ════════════════════════════════════════════════════════════════════════════

function StrengthBar({ password }) {
  const s = getStrength(password);
  const color = STRENGTH_COLOR[s];

  const rules = [
    { ok: password.length >= 8, text: "At least 8 characters" },
    { ok: /[A-Z]/.test(password), text: "One uppercase letter" },
    { ok: /[0-9]/.test(password), text: "One number" },
    { ok: /[^A-Za-z0-9]/.test(password), text: "One special character" },
  ];

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= s ? color : "#d0d7de",
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 11, color: "#57606a" }}>Password strength</Text>
        <Text style={{ fontSize: 11, fontWeight: "700", color }}>{STRENGTH_LABEL[s]}</Text>
      </View>
      <View style={styles.rulesGrid}>
        {rules.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5, width: "50%" }}>
            <Check size={12} color={r.ok ? "#2da44e" : "#d0d7de"} strokeWidth={2.5} />
            <Text style={{ fontSize: 11, color: r.ok ? "#24292f" : "#8c959f" }}>{r.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function ChangePassword() {
  const navigation = useNavigation();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [oldVerified, setOldVerified] = useState(false);
  const [done, setDone] = useState(false);

  const handleOldChange = useCallback((val) => {
    setOldPassword(val);
    setErrors((prev) => ({ ...prev, old_password: null }));
  }, []);

  const handleNewChange = useCallback((val) => {
    setNewPassword(val);
    setErrors((prev) => ({ ...prev, new_password: null }));
  }, []);

  const handleConfirmChange = useCallback((val) => {
    setConfirmPassword(val);
    setErrors((prev) => ({ ...prev, confirm_password: null }));
  }, []);

  const validate = () => {
    const e = {};
    if (!oldPassword) e.old_password = "Current password is required";
    else if (!oldVerified) e.old_password = "Please verify your current password first";
    if (!newPassword) e.new_password = "New password is required";
    else if (newPassword.length < 8) e.new_password = "Must be at least 8 characters";
    else if (newPassword === oldPassword) e.new_password = "New password must differ from current";
    if (!confirmPassword) e.confirm_password = "Please confirm your new password";
    else if (confirmPassword !== newPassword) e.confirm_password = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.patch(
        "/users/change-password/",
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setDone(true);
        setTimeout(async () => {
          await AsyncStorage.multiRemove(["token", "user_id"]);
          router.push("../../auth/login");
        }, 2000);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.old_password) {
        setErrors({ old_password: Array.isArray(data.old_password) ? data.old_password[0] : data.old_password });
        setOldVerified(false);
      } else if (data?.new_password) {
        setErrors({ new_password: Array.isArray(data.new_password) ? data.new_password[0] : data.new_password });
      } else {
        setErrors({ general: data?.error || "Something went wrong. Try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  const strength = getStrength(newPassword);
  const newLocked = !oldVerified;
  const canSubmit = oldVerified && newPassword && confirmPassword && !saving;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f6f8fa" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <ChevronLeft size={18} color="#0969da" strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Lock size={20} color="#fff" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Password & Security</Text>
            <Text style={styles.bannerSubtitle}>Verify current password, then set a new one</Text>
          </View>
        </View>

        {/* ── SUCCESS ── */}
        {done && (
          <FadeIn style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Check size={28} color="#2da44e" strokeWidth={2.5} />
            </View>
            <Text style={styles.successTitle}>Password updated!</Text>
            <Text style={styles.successText}>Your password has been changed successfully.</Text>
            <Text style={styles.successHint}>Redirecting to login…</Text>
          </FadeIn>
        )}

        {/* ── FORM ── */}
        {!done && (
          <View style={styles.card}>
            <View style={{ padding: 20, gap: 20 }}>
              {/* General error */}
              {errors.general && (
                <View style={styles.generalError}>
                  <AlertCircle size={15} color="#cf222e" strokeWidth={2} />
                  <Text style={{ fontSize: 13, color: "#cf222e", flex: 1 }}>{errors.general}</Text>
                </View>
              )}

              {/* Step 1 */}
              <View style={{ gap: 10 }}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepBadge, { backgroundColor: oldVerified ? "#2da44e" : "#0969da" }]}>
                    {oldVerified ? (
                      <Check size={12} color="#fff" strokeWidth={3} />
                    ) : (
                      <Text style={styles.stepBadgeText}>1</Text>
                    )}
                  </View>
                  <Text style={styles.stepLabel}>Verify your current password</Text>
                </View>

                <OldPasswordField
                  value={oldPassword}
                  onChangeText={handleOldChange}
                  onVerified={setOldVerified}
                  error={errors.old_password}
                />
              </View>

              {/* Unlock separator */}
              <View style={[styles.unlockRow, { opacity: oldVerified ? 1 : 0.45 }]}>
                <View style={styles.unlockLine} />
                <View
                  style={[
                    styles.unlockPill,
                    {
                      backgroundColor: oldVerified ? "#dcfce7" : "#f6f8fa",
                      borderColor: oldVerified ? "#86efac" : "#d0d7de",
                    },
                  ]}
                >
                  {oldVerified ? (
                    <ShieldCheck size={12} color="#2da44e" strokeWidth={2.5} />
                  ) : (
                    <Lock size={12} color="#8c959f" strokeWidth={2} />
                  )}
                  <Text style={{ fontSize: 11, fontWeight: "600", color: oldVerified ? "#2da44e" : "#8c959f" }}>
                    {oldVerified ? "Unlocked" : "Locked"}
                  </Text>
                </View>
                <View style={styles.unlockLine} />
              </View>

              {/* Steps 2 & 3 */}
              <View pointerEvents={newLocked ? "none" : "auto"} style={{ gap: 16, opacity: newLocked ? 0.4 : 1 }}>
                {/* Step 2 */}
                <View style={{ gap: 10 }}>
                  <View style={styles.stepRow}>
                    <View style={[styles.stepBadge, { backgroundColor: newLocked ? "#d0d7de" : "#0969da" }]}>
                      <Text style={styles.stepBadgeText}>2</Text>
                    </View>
                    <Text style={[styles.stepLabel, newLocked && { color: "#8c959f" }]}>Set new password</Text>
                  </View>

                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChangeText={handleNewChange}
                    placeholder="Create a strong password"
                    error={errors.new_password}
                  />

                  {newPassword && !newLocked && <StrengthBar password={newPassword} />}
                </View>

                {/* Step 3 */}
                <View style={{ gap: 10 }}>
                  <View style={styles.stepRow}>
                    <View style={[styles.stepBadge, { backgroundColor: newLocked ? "#d0d7de" : "#0969da" }]}>
                      <Text style={styles.stepBadgeText}>3</Text>
                    </View>
                    <Text style={[styles.stepLabel, newLocked && { color: "#8c959f" }]}>Confirm new password</Text>
                  </View>

                  <PasswordField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={handleConfirmChange}
                    placeholder="Repeat new password"
                    error={errors.confirm_password}
                  />

                  {confirmPassword && newPassword && !newLocked && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      {confirmPassword === newPassword ? (
                        <>
                          <Check size={13} color="#2da44e" strokeWidth={2.5} />
                          <Text style={{ fontSize: 12, color: "#2da44e", fontWeight: "600" }}>Passwords match</Text>
                        </>
                      ) : (
                        <>
                          <X size={13} color="#cf222e" strokeWidth={2.5} />
                          <Text style={{ fontSize: 12, color: "#cf222e", fontWeight: "600" }}>
                            Passwords do not match
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={{ padding: 20, gap: 10 }}>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={!canSubmit}
                activeOpacity={0.85}
                style={[styles.submitBtn, { backgroundColor: !canSubmit ? "#d0d7de" : "#0969da" }]}
              >
                {saving ? (
                  <>
                    <Spinner />
                    <Text style={styles.submitBtnText}>Updating…</Text>
                  </>
                ) : (
                  <>
                    <Lock size={15} color={!canSubmit ? "#8c959f" : "#fff"} strokeWidth={2.5} />
                    <Text style={[styles.submitBtnText, { color: !canSubmit ? "#8c959f" : "#fff" }]}>
                      Update Password
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.footerNote}>After changing, you'll be redirected to login.</Text>
            </View>
          </View>
        )}

        {/* Tip */}
        <View style={styles.tipBox}>
          <AlertCircle size={15} color="#d97706" strokeWidth={2} style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>
            Use a mix of <Text style={{ fontWeight: "700" }}>uppercase, numbers and symbols</Text> for a stronger
            password.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: "#f6f8fa",
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backText: { color: "#0969da", fontSize: 14, fontWeight: "500" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#24292f" },

  banner: {
    backgroundColor: "#0969da",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bannerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  bannerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 3 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 14,
    overflow: "hidden",
  },
  cardDivider: { height: 1, backgroundColor: "#d0d7de", marginHorizontal: 20 },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#57606a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontSize: 14, color: "#24292f", padding: 0 },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusTextMuted: { fontSize: 11, color: "#8c959f" },
  statusTextSuccess: { fontSize: 11, color: "#2da44e" },
  statusTextError: { fontSize: 11, color: "#cf222e" },

  rulesGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 4 },

  stepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  stepLabel: { fontSize: 13, fontWeight: "600", color: "#24292f" },

  unlockRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  unlockLine: { flex: 1, height: 1, backgroundColor: "#d0d7de" },
  unlockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },

  generalError: {
    backgroundColor: "#fff1f0",
    borderWidth: 1,
    borderColor: "#ffcdd0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  submitBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { fontWeight: "700", fontSize: 14 },
  footerNote: { textAlign: "center", fontSize: 11, color: "#8c959f", lineHeight: 16 },

  successCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  successIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#dcfce7",
    borderWidth: 2,
    borderColor: "#86efac",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: { fontSize: 17, fontWeight: "700", color: "#24292f", marginBottom: 6 },
  successText: { fontSize: 13, color: "#57606a", marginBottom: 4, textAlign: "center" },
  successHint: { fontSize: 12, color: "#8c959f" },

  tipBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  tipText: { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 18 },
});