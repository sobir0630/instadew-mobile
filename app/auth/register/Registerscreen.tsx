import { useState, useCallback } from "react";
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

import {
  IconEmail,
  IconAt,
  IconUser,
  IconLock,
  IconEyeOn,
  IconEyeOff,
  IconWarning,
  IconAddUser,
  WaterDropIcon,
} from "./Icons";
import { Field } from "./Field";
import { styles } from "./Registerstyles";

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
        email: email.trim(),
        username: username.trim(),
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
              <Link href="/auth/login/Loginscreen">
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