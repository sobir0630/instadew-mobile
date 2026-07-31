// UpdateProfile.js — React Native versiyasi
// API'lar asl holicha qoldirildi (endpoint, header, patch faqat o'zgargan fieldlarni yuborish mantiqi
// bir xil) — faqat localStorage -> AsyncStorage (chunki native'da localStorage yo'q) va
// web DOM elementlari (div/input/svg) -> RN komponentlariga (View/TextInput/lucide-react-native) o'girildi.

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  User,
  AtSign,
  Mail,
  RotateCcw,
  Check,
  AlertCircle,
  X,
  Save,
  Info,
} from "lucide-react-native";
import { router, usePathname } from "expo-router";
import API from "../../api/server";

// ════════════════════════════════════════════════════════════════════════════
//  API — o'zgartirilmadi, faqat AsyncStorage (async) bilan
// ════════════════════════════════════════════════════════════════════════════

async function fetchUser() {
  const token = await AsyncStorage.getItem("token");
  const id = await AsyncStorage.getItem("user_id");
  if (!token || !id) throw new Error("Token or ID not found");
  const res = await API.get(`/users/register/${id}/`, {
    headers: { Authorization: `Bearer ${token.trim()}` },
  });
  return res.data;
}

/** Faqat o'zgargan fieldlarni yuboradi */
async function patchUser(changed) {
  const token = await AsyncStorage.getItem("token");
  const id = await AsyncStorage.getItem("user_id");
  if (!token || !id) throw new Error("Token or ID not found");
  const res = await API.patch(`/users/register/${id}/`, changed, {
    headers: { Authorization: `Bearer ${token.trim()}` },
  });
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
//  ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Spinner({ size = 18, color = "#fff" }) {
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
        borderWidth: 2.5,
        borderColor: color,
        borderTopColor: "transparent",
        transform: [{ rotate }],
      }}
    />
  );
}

function SkeletonLine({ w = "100%", h = 14, r = 6 }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      style={{
        width: w,
        height: h,
        borderRadius: r,
        backgroundColor: "#e4e7ea",
        opacity,
      }}
    />
  );
}

function Toast({ message, type, onClose }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose, translateY, opacity]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: type === "success" ? "#2da44e" : "#cf222e",
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {type === "success" ? (
        <Check size={14} color="#fff" strokeWidth={2.5} />
      ) : (
        <AlertCircle size={14} color="#fff" strokeWidth={2.5} />
      )}
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={8} style={{ marginLeft: 4 }}>
        <X size={13} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  FIELD
// ════════════════════════════════════════════════════════════════════════════

const Field = ({ label, name, value, original, onChangeText, keyboardType, placeholder, icon, hint, error }) => {
  const [focused, setFocused] = useState(false);
  const isDirty = value !== original;

  const borderColor = error ? "#cf222e" : focused || isDirty ? "#0969da" : "#d0d7de";
  const iconColor = error ? "#cf222e" : focused || isDirty ? "#0969da" : "#8c959f";

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {isDirty && (
          <View style={styles.editedBadge}>
            <Text style={styles.editedBadgeText}>EDITED</Text>
          </View>
        )}
      </View>

      <View style={[styles.inputBox, { borderColor }]}>
        {icon ? <View style={{ marginRight: 10 }}>{React.cloneElement(icon, { color: iconColor })}</View> : null}
        <TextInput
          value={value ?? ""}
          onChangeText={(text) => onChangeText(name, text)}
          placeholder={placeholder}
          placeholderTextColor="#8c959f"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {isDirty && (
          <TouchableOpacity onPress={() => onChangeText(name, original)} hitSlop={8}>
            <RotateCcw size={15} color="#8c959f" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <View style={styles.errorRow}>
          <AlertCircle size={11} color="#cf222e" strokeWidth={2.5} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function UpdateProfile() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [original, setOriginal] = useState({ full_name: "", username: "", email: "" });
  const [form, setForm] = useState({ full_name: "", username: "", email: "" });

  // ── Load current user data ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUser();
        const snap = {
          full_name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
        };
        setOriginal(snap);
        setForm(snap);
      } catch (err) {
        console.error(err);
        setToast({ message: "Failed to load profile data", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleChange = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const validate = () => {
    const e = {};
    if (
      form.email !== original.email &&
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      e.email = "Invalid email format";
    }
    if (!form.full_name.trim()) e.full_name = "Full name cannot be empty";
    if (!form.username.trim()) e.username = "Username cannot be empty";
    if (!form.email.trim()) e.email = e.email || "Email cannot be empty";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const changed = {};
    Object.keys(form).forEach((key) => {
      if (form[key].trim() !== original[key]) {
        changed[key] = form[key].trim();
      }
    });

    if (Object.keys(changed).length === 0) {
      setToast({ message: "Nothing has changed", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const updated = await patchUser(changed);
      const newSnap = {
        full_name: updated.full_name || form.full_name,
        username: updated.username || form.username,
        email: updated.email || form.email,
      };
      setOriginal(newSnap);
      setForm(newSnap);
      setToast({ message: "Profile updated successfully", type: "success" });
      setErrors({});
    } catch (err) {
      const data = err.response?.data;
      const fieldErrors = {};
      if (data?.username) fieldErrors.username = data.username[0];
      if (data?.email) fieldErrors.email = data.email[0];
      if (data?.full_name) fieldErrors.full_name = data.full_name[0];
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
      } else {
        setToast({ message: "Failed to save. Please try again.", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const changedCount = Object.keys(form).filter((k) => form[k].trim() !== original[k]).length;
  const disabledBtn = saving || loading || changedCount === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f6f8fa" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("../settings")}
          style={{ flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <ChevronLeft size={18} color="#0969da" strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Update Profile</Text>

        {changedCount > 0 ? (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{changedCount} edited</Text>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Gradient banner (RN'da gradient uchun expo-linear-gradient tavsiya etiladi;
            bu yerda soddalik uchun bitta fon rang ishlatildi) */}
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <User size={20} color="#fff" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Account Information</Text>
            <Text style={styles.bannerSubtitle}>Edit only the fields you want to change</Text>
          </View>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <View style={{ padding: 20, gap: 16 }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={{ gap: 6 }}>
                  <SkeletonLine w={90} h={11} />
                  <SkeletonLine w="100%" h={48} r={10} />
                </View>
              ))
            ) : (
              <>
                <Field
                  label="Full Name"
                  name="full_name"
                  value={form.full_name}
                  original={original.full_name}
                  onChangeText={handleChange}
                  placeholder="Your full name"
                  icon={<User size={16} />}
                  error={errors.full_name}
                />
                <Field
                  label="Username"
                  name="username"
                  value={form.username}
                  original={original.username}
                  onChangeText={handleChange}
                  placeholder="your_username"
                  icon={<AtSign size={16} />}
                  hint="Letters, numbers and underscores only"
                  error={errors.username}
                />
                <Field
                  label="Email"
                  name="email"
                  value={form.email}
                  original={original.email}
                  onChangeText={handleChange}
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  icon={<Mail size={16} />}
                  error={errors.email}
                />
              </>
            )}
          </View>

          <View style={styles.cardDivider} />

          <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={disabledBtn}
              activeOpacity={0.85}
              style={[
                styles.saveBtn,
                { backgroundColor: disabledBtn ? "#d0d7de" : "#0969da" },
              ]}
            >
              {saving ? (
                <>
                  <Spinner />
                  <Text style={styles.saveBtnText}>Saving…</Text>
                </>
              ) : changedCount === 0 ? (
                <Text style={[styles.saveBtnText, { color: "#8c959f" }]}>No changes to save</Text>
              ) : (
                <>
                  <Save size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>
                    Save {changedCount} change{changedCount > 1 ? "s" : ""}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.footerNote}>Only modified fields will be sent to the server.</Text>
          </View>
        </View>

        {/* Info note */}
        <View style={styles.infoBox}>
          <Info size={15} color="#0969da" strokeWidth={2} style={{ marginTop: 1 }} />
          <Text style={styles.infoText}>
            To update your <Text style={{ fontWeight: "700" }}>password</Text>, go to{" "}
            <Text style={{ fontWeight: "700" }}>Settings → Security</Text>.
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
  headerBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  headerBadgeText: { fontSize: 11, fontWeight: "700", color: "#0969da" },

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

  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#57606a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  editedBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  editedBadgeText: { fontSize: 10, fontWeight: "700", color: "#0969da" },

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

  hint: { fontSize: 11, color: "#8c959f" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  errorText: { fontSize: 11, color: "#cf222e" },

  saveBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  footerNote: { textAlign: "center", fontSize: 11, color: "#8c959f", marginTop: 10, lineHeight: 16 },

  infoBox: {
    backgroundColor: "#f1f8ff",
    borderWidth: 1,
    borderColor: "#cae8ff",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: "#0550ae", lineHeight: 18 },

  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 999,
    maxWidth: "90%",
  },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});