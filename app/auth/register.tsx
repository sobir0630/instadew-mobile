import { useState, useCallback } from "react";
import { Link, useRouter } from "expo-router";
import { api } from "../api/server";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Rect, Polyline, Line } from "react-native-svg";

// ════════════════════════════════════════════════════════════════════════════
//  SVG ICONS
// ════════════════════════════════════════════════════════════════════════════

function IconEmail({ color = "rgba(255,255,255,0.45)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Polyline points="22,6 12,13 2,6"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconAt({ color = "rgba(255,255,255,0.45)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconUser({ color = "rgba(255,255,255,0.45)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function IconLock({ color = "rgba(255,255,255,0.45)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconEyeOn({ color = "rgba(255,255,255,0.4)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function IconEyeOff({ color = "rgba(255,255,255,0.4)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Line x1="1" y1="1" x2="23" y2="23"
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
    </Svg>
  );
}

function IconWarning({ color = "rgba(248,113,113,0.9)", size = 15 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IconAddUser({ color = "#fff", size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2.5" />
      <Line x1="19" y1="8" x2="19" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="22" y1="11" x2="16" y2="11" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function WaterDropIcon() {
  return (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 4 10 4 15a8 8 0 0 0 16 0C20 10 12 2 12 2z"
        fill="rgba(255,255,255,0.95)"
      />
      <Path
        d="M9 16.5a3 3 0 0 0 4.5 1.5"
        stroke="rgba(139,92,246,0.8)" strokeWidth="1.5" strokeLinecap="round"
      />
    </Svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  INPUT FIELD
// ════════════════════════════════════════════════════════════════════════════

function Field({ label, secureTextEntry = false, value, onChangeText, placeholder, icon, error, rightEl, keyboardType = "default" }) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "rgba(248,113,113,0.7)"
    : focused
    ? "rgba(255,255,255,0.45)"
    : "rgba(255,255,255,0.18)";

  const bgColor = focused
    ? "rgba(255,255,255,0.12)"
    : "rgba(255,255,255,0.07)";

  const iconColor = error
    ? "rgba(248,113,113,0.9)"
    : focused
    ? "rgba(255,255,255,0.9)"
    : "rgba(255,255,255,0.45)";

  return (
    <View style={{ gap: 7 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor }]}>
        {icon && (
          <View style={{ marginRight: 10 }}>
            {icon(iconColor)}
          </View>
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightEl}
      </View>
      {error ? (
        <View style={styles.fieldErrorRow}>
          <IconWarning size={11} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function RegisterScreen() {
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const [errors, setErrors] = useState({
    email: "", username: "", fullName: "", password: "", general: "",
  });

  const clearError = useCallback((field) => {
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  }, []);

  const handleRegister = async () => {
    setErrors({ email: "", username: "", fullName: "", password: "", general: "" });

    const newErrors = {};
    if (!email.trim())         newErrors.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
    if (!username.trim())      newErrors.username = "Username is required";
    if (!fullName.trim())      newErrors.fullName = "Full name is required";
    if (!password.trim())      newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "At least 8 characters";

    if (Object.keys(newErrors).length) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/register/", {
        email:     email.trim(),
        username:  username.trim(),
        full_name: fullName.trim(),
        password,
      });

      if (response.status === 201 || response.status === 200) {
        await AsyncStorage.setItem("user_id", String(response.data.user_id));
        router.push("/");
      }
    } catch (err) {
      console.log("Register error:", err.response?.data);
      const data = err.response?.data;
      if (data?.email)    setErrors((prev) => ({ ...prev, email:    "This email is already registered" }));
      if (data?.username) setErrors((prev) => ({ ...prev, username: "This username is already taken" }));
      if (!data?.email && !data?.username) {
        setErrors((prev) => ({ ...prev, general: data?.detail || "Registration failed. Please try again." }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/* Background gradient */}
      <LinearGradient
        colors={["#0a0f1e", "#130d2e", "#0d1230"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── CARD ── */}
          <View style={styles.card}>

            {/* ── LOGO ── */}
            <View style={styles.logoSection}>
              <LinearGradient
                colors={["#8b5cf6", "#6366f1", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <WaterDropIcon />
              </LinearGradient>
              <Text style={styles.appTitle}>Instadew</Text>
              <Text style={styles.appSubtitle}>Create your account</Text>
            </View>

            {/* ── FORM ── */}
            <View style={{ gap: 15 }}>

              {/* General error banner */}
              {errors.general ? (
                <View style={styles.errorBanner}>
                  <IconWarning size={15} />
                  <Text style={styles.errorBannerText}>{errors.general}</Text>
                </View>
              ) : null}

              {/* Email */}
              <Field
                label="Email"
                value={email}
                onChangeText={(text) => { setEmail(text); clearError("email"); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                icon={(color) => <IconEmail color={color} />}
                error={errors.email}
              />

              {/* Username */}
              <Field
                label="Username"
                value={username}
                onChangeText={(text) => { setUsername(text); clearError("username"); }}
                placeholder="your_username"
                icon={(color) => <IconAt color={color} />}
                error={errors.username}
              />

              {/* Full Name */}
              <Field
                label="Full Name"
                value={fullName}
                onChangeText={(text) => { setFullName(text); clearError("fullName"); }}
                placeholder="Your full name"
                icon={(color) => <IconUser color={color} />}
                error={errors.fullName}
              />

              {/* Password */}
              <Field
                label="Password"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={(text) => { setPassword(text); clearError("password"); }}
                placeholder="At least 8 characters"
                icon={(color) => <IconLock color={color} />}
                error={errors.password}
                rightEl={
                  <TouchableOpacity
                    onPress={() => setShowPass((v) => !v)}
                    style={{ padding: 2 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPass ? <IconEyeOff /> : <IconEyeOn />}
                  </TouchableOpacity>
                }
              />

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
                style={{ marginTop: 4 }}
              >
                <LinearGradient
                  colors={
                    loading
                      ? ["rgba(139,92,246,0.5)", "rgba(139,92,246,0.5)"]
                      : ["#8b5cf6", "#6366f1"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.submitBtnText}>Creating account…</Text>
                    </>
                  ) : (
                    <>
                      <IconAddUser />
                      <Text style={styles.submitBtnText}>Create account</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── FOOTER ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/auth/login">
                <Text style={styles.footerLink}>Log in</Text>
              </Link>
            </View>
          </View>

          {/* Bottom shimmer line */}
          <LinearGradient
            colors={["transparent", "rgba(139,92,246,0.4)", "rgba(99,102,241,0.4)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerLine}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(139,92,246,0.11)",
    top: -80,
    right: -60,
  },
  blob2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99,102,241,0.10)",
    bottom: -60,
    left: -60,
  },
  blob3: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(59,130,246,0.07)",
    top: "35%",
    left: "10%",
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
    paddingTop: 36,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },

  // Logo
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
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
    shadowColor: "#8b5cf6",
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
    marginTop: 24,
    paddingTop: 20,
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
    color: "#a78bfa",
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