// EditProfile.js — React Native versiyasi
// API funksiyalari (fetchUser, updateUser, uploadAvatar) aynan asl mantiq bilan qoldirildi —
// endpoint, header, FormData orqali avatar yuborish tartibi bir xil. Faqat:
//   - localStorage -> AsyncStorage (async)
//   - <input type="file"> -> expo-image-picker (galereyadan rasm tanlash)
//   - DOM/CSS -> View/Text/TextInput/Animated va RN StyleSheet
//   - react-router <a href> -> @react-navigation/native
//
// KERAKLI PAKETLAR:
//   npm install @react-native-async-storage/async-storage
//   npm install @react-navigation/native @react-navigation/native-stack
//   npm install lucide-react-native react-native-svg
//   npx expo install expo-image-picker   (agar Expo loyihasi bo'lsa)
//   // Bare RN uchun: npm install react-native-image-picker

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronLeft,
  Globe,
  Camera,
  Check,
  AlertCircle,
  Lock,
  Eye,
  Home,
  Search,
  PlusSquare,
  Film,
  User as UserIcon,
} from "lucide-react-native";
import { router } from "expo-router";
import API from "../../api/server";

// ════════════════════════════════════════════════════════════════════════════
//  API — mantiq o'zgartirilmadi, faqat AsyncStorage (async)
// ════════════════════════════════════════════════════════════════════════════

async function fetchUser() {
  const token = await AsyncStorage.getItem("token");
  const id = await AsyncStorage.getItem("user_id");

  if (!token || !id) throw new Error("Token yoki ID topilmadi");
  const res = await API.get(`/users/register/${id}/`, {
    headers: { Authorization: `Bearer ${token.trim()}` },
  });

  return res.data;
}

async function updateUser(fields) {
  const token = await AsyncStorage.getItem("token");
  const id = await AsyncStorage.getItem("user_id");

  if (!token || !id) throw new Error("Token yoki ID topilmadi");

  const res = await API.patch(`/users/register/${id}/`, fields, {
    headers: { Authorization: `Bearer ${token.trim()}` },
  });

  if (res.status === 200) {
  } else {
    console.log("xatolik");
  }
  return res.data;
}

// RN'da <input type="file"/> yo'q, shuning uchun bu yerga expo-image-picker'dan olingan
// asset ({ uri, fileName/name, mimeType/type }) beriladi. FormData tuzilishi bir xil qoladi —
// faqat native uchun file blob o'rniga { uri, name, type } obyekti ishlatiladi (RN'ning standart usuli).
async function uploadAvatar(asset) {
  const token = await AsyncStorage.getItem("token");
  const id = await AsyncStorage.getItem("user_id");

  if (!token || !id) throw new Error("Token yoki ID topilmadi");

  const fd = new FormData();
  fd.append("avatar", {
    uri: asset.uri,
    name: asset.fileName || `avatar_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  });

  const res = await API.patch(`/users/register/${id}/`, fd, {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "multipart/form-data",
    },
  });
  if (res.status === 200) {
    console.log("private hisobni tekshirish", res.data);
  } else {
    console.log("xatolik");
  }
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
//  UTILS — o'zgartirilmadi
// ════════════════════════════════════════════════════════════════════════════

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  );
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n ?? 0);
}

// ════════════════════════════════════════════════════════════════════════════
//  ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Spinner({ size = 18, color = "#fff" }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
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

function Skeleton({ w = "100%", h = 14, r = 6, style }) {
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
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: "#e4e7ea", opacity }, style]} />;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "#eaecef", marginHorizontal: 16 }} />;
}

function Toast({ message, type, onClose }) {
  const translateY = useRef(new Animated.Value(10)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose, translateY, opacity]);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: type === "success" ? "#2da44e" : "#cf222e", transform: [{ translateY }], opacity },
      ]}
    >
      {type === "success" ? (
        <Check size={15} color="#fff" strokeWidth={2.5} />
      ) : (
        <AlertCircle size={15} color="#fff" strokeWidth={2.5} />
      )}
      <Text style={styles.toastText} numberOfLines={1}>
        {message}
      </Text>
    </Animated.View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  FIELD
// ════════════════════════════════════════════════════════════════════════════

const Field = ({ label, name, value, onChangeText, keyboardType, placeholder, icon, hint }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, { borderColor: focused ? "#0969da" : "#d0d7de" }]}>
        {icon ? <View style={{ marginRight: 10 }}>{React.cloneElement(icon, { color: focused ? "#0969da" : "#8c959f" })}</View> : null}
        <TextInput
          value={value ?? ""}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8c959f"
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  TEXTAREA
// ════════════════════════════════════════════════════════════════════════════

const TextAreaField = ({ label, value, onChangeText, placeholder, maxLength }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.textAreaBox, { borderColor: focused ? "#0969da" : "#d0d7de" }]}>
        <TextInput
          value={value ?? ""}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8c959f"
          maxLength={maxLength}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.textArea}
        />
        {maxLength ? (
          <Text
            style={[
              styles.counter,
              { color: (value?.length ?? 0) > maxLength * 0.9 ? "#cf222e" : "#8c959f" },
            ]}
          >
            {value?.length ?? 0} / {maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  TOGGLE ROW
// ════════════════════════════════════════════════════════════════════════════

function ToggleRow({ checked, onChange, label, sublabel }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel ? <Text style={styles.toggleSublabel}>{sublabel}</Text> : null}
      </View>
      <TouchableOpacity
        onPress={() => onChange(!checked)}
        style={[styles.toggleTrack, { backgroundColor: checked ? "#2da44e" : "#d0d7de" }]}
      >
        <View style={[styles.toggleThumb, { left: checked ? 23 : 3 }]} />
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SECTION CARD
// ════════════════════════════════════════════════════════════════════════════

function SectionCard({ title, subtitle, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      {title ? (
        <View style={{ marginBottom: 8, paddingLeft: 2 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SAVE BUTTON
// ════════════════════════════════════════════════════════════════════════════

function SaveBtn({ onPress, saving, label = "Saqlash" }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={saving}
      activeOpacity={0.85}
      style={[styles.saveBtn, { backgroundColor: saving ? "#d0d7de" : "#0969da" }]}
    >
      {saving ? (
        <>
          <Spinner />
          <Text style={styles.saveBtnText}>Saqlanmoqda…</Text>
        </>
      ) : (
        <Text style={styles.saveBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  BOTTOM NAV
// ════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { route: "Home", Icon: Home },
  { route: "Explore", Icon: Search },
  { route: "CreatePost", Icon: PlusSquare },
  { route: "Movie", Icon: Film },
  { route: "Person", Icon: UserIcon, active: true },
];

// ════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EditProfile() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, updated_at: null, username: "" });

  const [form, setForm] = useState({
    bio: "",
    website: "",
    is_private: false,
    active_status: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const d = await fetchUser();
      setAvatarUrl(d.avatar || null);
      setStats({
        followers: d.followers_count ?? 0,
        following: d.following_count ?? 0,
        posts: d.posts_count ?? 0,
        updated_at: d.updated_at || null,
        username: d.username || "",
      });
      setForm({
        bio: d.bio || "",
        website: d.website || "",
        is_private: d.is_private || false,
        active_status: d.active_status || false,
      });
    } catch (err) {
      console.error(err);
      showToast("Ma'lumotlarni yuklab bo'lmadi", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const handleToggle = useCallback(
    (field) => (val) => {
      setForm((prev) => ({ ...prev, [field]: val }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        bio: form.bio,
        website: form.website,
        is_private: form.is_private,
        active_status: form.active_status,
      });
      showToast("Profil muvaffaqiyatli saqlandi ✓", "success");
    } catch (err) {
      showToast("Saqlashda xato yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };





  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Galereyaga ruxsat berilmadi", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    // Eskiroq avatar URL'ini saqlab turamiz (o'chirishda ishlatish uchun)
    const oldAvatarUrl = avatarUrl; 

    setAvatarUrl(asset.uri); // darhol lokal preview
    setAvatarSaving(true);
    
    try {
      // 1. Yangi avatarni serverga yuklaymiz
      const updated = await uploadAvatar(asset);
      
      // 2. Agar oldin avatar bo'lgan bo'lsa va yangisi omadli yuklangan bo'lsa, eskisini o'chiramiz
      if (oldAvatarUrl) {
        try {
          // O'zingizning API yo'lingizni moslab qo'ying (masalan: oldAvatarUrl yoki avatar ID)
          await api.delete(`/users/register/${userId}/avatar/`, { data: { old_avatar: oldAvatarUrl } });
        } catch (deleteErr) {
          console.warn("Eski avatarni o'chirishda xatolik:", deleteErr);
          // Eski avatar o'chmay qolsa ham foydalanuvchiga xatolik ko'rsatmaslik mumkin
        }
      }

      if (updated.avatar) setAvatarUrl(updated.avatar);
      showToast("image updated ✓", "success");
    } catch {
      // Xatolik bo'lsa, preview'ni qaytarib qo'yamiz
      setAvatarUrl(oldAvatarUrl);
      showToast("image download error", "error");
    } finally {
      setAvatarSaving(false);
    }
  };

  const initials = getInitials(stats.username || "");

  const TABS = [
    { key: "info", label: "Informations" },
    { key: "privacy", label: "Confidentiality" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#eeeff1" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("../profile")}
          style={{ flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <ChevronLeft size={18} color="#0969da" strokeWidth={2.5} />
          <Text style={styles.backText}>Person</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile edit</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* ── AVATAR + STATS CARD ─────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <View style={{ position: "relative" }}>
              <View style={styles.avatarWrap}>
                {loading ? (
                  <Skeleton w={72} h={72} r={36} />
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>{initials}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={avatarSaving}
                style={[styles.uploadBtn, { backgroundColor: avatarSaving ? "#8c959f" : "#0969da" }]}
              >
                {avatarSaving ? <Spinner size={10} /> : <Camera size={11} color="#fff" strokeWidth={2.5} />}
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <View style={{ gap: 6 }}>
                  <Skeleton w="60%" h={18} />
                  <Skeleton w="40%" h={13} />
                </View>
              ) : (
                <>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {stats.username || "—"}
                  </Text>
                  <Text style={styles.profileUsername}>@{stats.username}</Text>
                  {stats.updated_at ? (
                    <Text style={styles.profileUpdated}>Updating: {fmtDate(stats.updated_at)}</Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { label: "Posts", val: stats.posts },
              { label: "Followers", val: stats.followers },
              { label: "Following", val: stats.following },
            ].map((s, i, arr) => (
              <View key={i} style={[styles.statItem, i < arr.length - 1 && styles.statItemBorder]}>
                {loading ? (
                  <>
                    <Skeleton w={40} h={18} r={4} style={{ marginBottom: 4 }} />
                    <Skeleton w={52} h={11} r={3} />
                  </>
                ) : (
                  <>
                    <Text style={styles.statVal}>{fmtNum(s.val)}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── TABS ────────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, { backgroundColor: activeTab === tab.key ? "#0969da" : "transparent" }]}
            >
              <Text style={{ color: activeTab === tab.key ? "#fff" : "#57606a", fontWeight: activeTab === tab.key ? "700" : "500", fontSize: 13 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB: INFO ───────────────────────────────────────────── */}
        {activeTab === "info" && (
          <View>
            <SectionCard title="Main Information" subtitle="Profile a page visible informations">
              <View style={{ padding: 20, gap: 14 }}>
                {loading ? (
                  [120, 100, 100, 90].map((w, i) => (
                    <View key={i} style={{ gap: 5 }}>
                      <Skeleton w={w} h={11} />
                      <Skeleton w="100%" h={46} r={10} />
                    </View>
                  ))
                ) : (
                  <>
                    <Field
                      label="Web-Site"
                      value={form.website}
                      onChangeText={(t) => setForm((p) => ({ ...p, website: t }))}
                      placeholder="https://yoursite.com"
                      keyboardType="url"
                      icon={<Globe size={16} />}
                    />
                    <TextAreaField
                      label="Bio"
                      value={form.bio}
                      onChangeText={(t) => setForm((p) => ({ ...p, bio: t }))}
                      placeholder="Write about yourself…"
                      maxLength={150}
                    />
                  </>
                )}
              </View>
            </SectionCard>

            {!loading && <SaveBtn onPress={handleSave} saving={saving} label="Save informations" />}
          </View>
        )}

        {/* ── TAB: PRIVACY ────────────────────────────────────────── */}
        {activeTab === "privacy" && (
          <View>
            <SectionCard title="Privacy settings" subtitle="Control who sees what">
              <ToggleRow
                checked={form.is_private}
                onChange={handleToggle("is_private")}
                label="Yopiq hisob"
                sublabel="Only verified subscribers can view"
              />
              <Divider />
              <ToggleRow
                checked={form.active_status}
                onChange={handleToggle("active_status")}
                label="Activity status"
                sublabel="Show that you are online"
              />
            </SectionCard>

            <SectionCard>
              <View style={styles.statusInfoRow}>
                <View
                  style={[
                    styles.statusIconWrap,
                    {
                      backgroundColor: form.is_private ? "#fff1f0" : "#f1f8ff",
                      borderColor: form.is_private ? "#ffcdd0" : "#cae8ff",
                    },
                  ]}
                >
                  {form.is_private ? <Lock size={18} color="#cf222e" /> : <Eye size={18} color="#0969da" />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.statusTitle}>{form.is_private ? "Yopiq hisob" : "Ochiq hisob"}</Text>
                  <Text style={styles.statusText}>
                    {form.is_private
                      ? "Faqat tasdiqlangan obunachilar postlaringizni ko'radi"
                      : "Barcha foydalanuvchilar postlaringizni ko'ra oladi"}
                  </Text>
                </View>
              </View>
            </SectionCard>

            <SaveBtn onPress={handleSave} saving={saving} label="Sozlamalarni saqlash" />
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────── */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.Icon;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => navigation.navigate(item.route)}
              style={[styles.navItem, item.active && styles.navItemActive]}
            >
              <Icon size={22} color={item.active ? "#0969da" : "#57606a"} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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

  profileCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#f6f8fa",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#764ba2",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 17, fontWeight: "700", color: "#24292f" },
  profileUsername: { fontSize: 13, color: "#57606a", marginTop: 2 },
  profileUpdated: { fontSize: 11, color: "#8c959f", marginTop: 4 },

  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    overflow: "hidden",
  },
  statItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  statItemBorder: { borderRightWidth: 1, borderRightColor: "#d0d7de" },
  statVal: { fontSize: 17, fontWeight: "800", color: "#24292f" },
  statLabel: { fontSize: 11, color: "#57606a", marginTop: 2 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    padding: 4,
    gap: 4,
    marginBottom: 20,
    height: 44,
  },
  tabBtn: { flex: 1, borderRadius: 7, alignItems: "center", justifyContent: "center" },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#57606a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionSubtitle: { fontSize: 12, color: "#8c959f", marginTop: 2 },
  sectionCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    overflow: "hidden",
  },

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
    height: 46,
  },
  input: { flex: 1, fontSize: 14, color: "#24292f", padding: 0 },
  hint: { fontSize: 11, color: "#8c959f" },

  textAreaBox: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
  },
  textArea: { fontSize: 14, color: "#24292f", minHeight: 88, lineHeight: 20, padding: 0 },
  counter: { fontSize: 11, textAlign: "right", marginTop: 4 },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  toggleLabel: { fontSize: 14, fontWeight: "500", color: "#24292f" },
  toggleSublabel: { fontSize: 12, color: "#8c959f", marginTop: 2 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, justifyContent: "center" },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    position: "absolute",
    top: 3,
  },

  statusInfoRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: { fontSize: 14, fontWeight: "600", color: "#24292f" },
  statusText: { fontSize: 12, color: "#57606a", marginTop: 3, lineHeight: 17 },

  saveBtn: {
    height: 46,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 55,
    backgroundColor: "#f6f8fa",
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: { backgroundColor: "#dbeafe" },

  toast: {
    position: "absolute",
    bottom: 78,
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