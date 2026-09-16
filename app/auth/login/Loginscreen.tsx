import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { api } from "../../api/server";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { IconUser, IconLock, IconEyeOn, IconEyeOff, IconLogin, IconWarning, WaterDropIcon } from "./Icons";
import { Field } from "./Field";
import { getSessionData } from "./Session";
import { styles } from "./LoginStyle";

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields!");
      return;
    }

    setLoading(true);
    try {
      const session = await getSessionData();

      const response = await api.post("users/login/login/", {
        username: username.trim(),
        password,

        device_id: session.device_id,
        device_name: session.device_name,
        device_type: session.device_type,
        platform: session.platform,
        browser: session.browser,
        browser_version: session.browser_version,
        ip_address: session.ip_address,
        user_agent: session.user_agent || "Instadew_app",
        app_version: session.app_version,
        expires_at: session.expires_at,
        is_active: session.is_active,
      });

      await AsyncStorage.setItem("token", response.data.access);
      await AsyncStorage.setItem("refresh", response.data.refresh);
      await AsyncStorage.setItem("user_id", String(response.data.user_id));
      await AsyncStorage.setItem("login_username", response.data.username);
      await AsyncStorage.setItem("username", response.data.username);

      await api.post(
        "/session/session/session/",
        session,
        {
          headers: {
            Authorization: `Bearer ${response.data.access}`,
          },
        }
      );

      if (response.status === 200) {
        router.push("/pages/home/FeedScreen");
      } else {
        console.log("errors");
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
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
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
              <Link href="/auth/register/Registerscreen">
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