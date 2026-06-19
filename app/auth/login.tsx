import { useState } from "react";
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
import { ReactNode } from 'react';
import { Redirect } from 'expo-router';

// ════════════════════════════════════════════════════════════════════════════
//  SVG ICONS
// ════════════════════════════════════════════════════════════════════════════

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

function IconLogin({ color = "#fff", size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <Polyline points="10 17 15 12 10 7"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <Line x1="15" y1="12" x2="3" y2="12"
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
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

function WaterDropIcon() {
  return (
    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 4 10 4 15a8 8 0 0 0 16 0C20 10 12 2 12 2z"
        fill="rgba(255,255,255,0.95)"
      />
      <Path
        d="M9 16.5a3 3 0 0 0 4.5 1.5"
        stroke="rgba(99,102,241,0.8)" strokeWidth="1.5" strokeLinecap="round"
      />
    </Svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  INPUT FIELD
// ════════════════════════════════════════════════════════════════════════════

interface FieldProps {
  label?: string;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon?: (color: string) => ReactNode;
  error?: string;
  rightEl?: ReactNode;
}

function Field({ label, secureTextEntry = false, value, onChangeText, placeholder, icon, error, rightEl }: FieldProps) {
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

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("users/login/login/", {
        username: username.trim(),
        password,
      });

      await AsyncStorage.setItem("token",          response.data.access);
      await AsyncStorage.setItem("refresh",        response.data.refresh);
      await AsyncStorage.setItem("user_id",        String(response.data.user_id));
      await AsyncStorage.setItem("login_username", response.data.username);

      if (response.status === 200) {
        router.push("/pages/home");
      } else {
        console.log("errors")
      }

    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Invalid username or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/* Background gradient */}
      <LinearGradient
        colors={["#0a0f1e", "#0d1230", "#130d2e"]}
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
                colors={["#6366f1", "#8b5cf6", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <WaterDropIcon />
              </LinearGradient>
              <Text style={styles.appTitle}>Instadew</Text>
              <Text style={styles.appSubtitle}>Welcome back, explorer.</Text>
            </View>

            {/* ── FORM ── */}
            <View style={{ gap: 18 }}>

              {/* Error banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <IconWarning size={15} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              {/* Username */}
              <Field
                label="Username or Email"
                value={username}
                onChangeText={(text: string) => { setUsername(text); setError(""); }}
                placeholder="e.g. hello@instadew.com"
                icon={(color: string) => <IconUser color={color} />}
                error={undefined}
                rightEl={undefined}
              />

              {/* Password */}
              <View style={{ gap: 7 }}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <Field
                  label=""
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={(text: string) => { setPassword(text); setError(""); }}
                  placeholder="Enter your password"
                  icon={(color: string) => <IconLock color={color} />}
                  error={undefined}
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
              </View>

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={{ marginTop: 4 }}
              >
                <LinearGradient
                  colors={
                    loading
                      ? ["rgba(99,102,241,0.5)", "rgba(99,102,241,0.5)"]
                      : ["#6366f1", "#8b5cf6"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.submitBtnText}>Signing in…</Text>
                    </>
                  ) : (
                    <>
                      <IconLogin />
                      <Text style={styles.submitBtnText}>Log in</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── FOOTER ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/auth/register">
                <Text style={styles.footerLink}>Create account</Text>
              </Link>
            </View>
          </View>

          {/* Bottom shimmer line */}
          <LinearGradient
            colors={["transparent", "rgba(99,102,241,0.4)", "rgba(139,92,246,0.4)", "transparent"]}
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