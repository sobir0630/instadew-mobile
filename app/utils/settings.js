// SettingsScreen.js
// Asl React (web) "Settings" komponentining React Native versiyasi.
//
// O'zgarishlar (web -> native):
//  - div/p/h -> View/Text
//  - inline SVG -> lucide-react-native ikonkalari (agar o'rnatilmagan bo'lsa, pastdagi
//    izohga qarang — istalgan ikon kutubxonasi bilan almashtirish oson)
//  - window.confirm -> Alert.alert
//  - localStorage -> AsyncStorage (native'da localStorage yo'q)
//  - react-router-dom -> @react-navigation/native
//  - CSS hover effektlari -> native'da kerak emas, TouchableOpacity/Pressable orqali bosilish effekti
//
// Sessiyalar (Active Sessions) qismi Telegram uslubida ishlaydi:
//  - Joriy qurilma har doim ro'yxat boshida, yashil "Online" nuqta bilan ko'rsatiladi
//  - Qolgan barcha qurilmalar uchun "oxirgi faollik" vaqti ko'rsatiladi (masalan "3 soat oldin")
//  - Har bir sessiya (joriy qurilmadan tashqari) "Chiqarish" tugmasi bilan bekor qilinishi mumkin
//
// KERAKLI PAKETLAR (agar hali o'rnatilmagan bo'lsa):
//   npm install @react-native-async-storage/async-storage
//   npm install @react-navigation/native @react-navigation/native-stack
//   npm install lucide-react-native react-native-svg
//
// Ishlatish uchun deviceSession.js faylini shu papkaga joylashtiring (birga yuborilgan).

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronRight,
  User,
  Lock,
  Shield,
  Eye,
  Smartphone,
  Sun,
  LogOut,
  Trash2,
  LockOpenIcon,
  User2,
  Users,
} from "lucide-react-native";

import api from "../api/server";
import {
  fetchSessions,
  revokeSession,
  endCurrentSession,
  formatLastActive,
} from "./deviceSession";
import { router, usePathname } from "expo-router";
import { ChevronLeft } from "lucide-react-native";



// ---------------- Avatar ----------------
function Avatar({ name, src, size = 80 }) {
  const [imgError, setImgError] = useState(false);
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  if (src && !imgError) {
    return (
      <Image
        source={{ uri: src }}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.7)",
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#764ba2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size / 2.8, fontWeight: "700", color: "white" }}>
        {initials}
      </Text>
    </View>
  );
}

// ---------------- Logout modal ----------------
function LogoutModal({ visible, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <LogOut size={18} color="#cf222e" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Chiqish</Text>
              <Text style={styles.modalSubtitle}>Hisobdan chiqmoqchimisiz</Text>
            </View>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalBodyText}>
              Rostdan ham tizimdan chiqmoqchimisiz? Qayta kirish uchun login
              ma'lumotlaringizni kiritishingiz kerak bo'ladi.
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnCancel} onPress={onCancel}>
              <Text style={styles.btnCancelText}>Bekor qilish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={onConfirm}>
              <Text style={styles.btnDangerText}>Chiqish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------- SettingRow ----------------
function SettingRow({ icon, label, sublabel, chevron, rightEl, onPress, danger }) {
  const isPressable = !!onPress;
  const Wrapper = isPressable ? TouchableOpacity : View;

  return (
    <Wrapper
      style={styles.row}
      activeOpacity={isPressable ? 0.6 : 1}
      onPress={onPress}
    >
      <View style={[styles.rowIconWrap, danger && styles.rowIconWrapDanger]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {rightEl}
      {chevron ? <ChevronRight size={16} color="#8c959f" /> : null}
    </Wrapper>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function onPushTo() {
  router.push("./deviceDetails")
}

// ---------------- Session row (Telegram-uslubida) ----------------
function SessionRow({ session, onRevoke }) {
  const isThisDevice = session.is_this_device;

  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <Smartphone size={16} color="#0969da" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>
          {session.device_name || "Noma'lum qurilma"}
          {isThisDevice ? "  ·  Shu qurilma" : ""}
        </Text>
        <Text style={styles.rowSublabel}>
          {session.location || session.ip_address || "Noma'lum joylashuv"}
          {"  ·  "}
          {isThisDevice ? "onlayn" : `oxirgi faollik: ${formatLastActive(session.last_activity)}`}
        </Text>
        <Text style={styles.device_id}>
          {`device id: ${session.device_id}`}
        </Text>
      </View>
      <View>
        <TouchableOpacity
          onPress={onPushTo}
        >
          <Text>
            <ChevronRight size={28} color={889}></ChevronRight>
          </Text>
        </TouchableOpacity>
      </View>
      {isThisDevice ? (
        <View style={styles.onlineDot} />
      ) : (
        <TouchableOpacity
          style={styles.revokeBtn}
          onPress={() => onRevoke(session)}
        >
          <Text style={styles.revokeBtnText}>Chiqarish</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ==================== ASOSIY EKRAN ====================
export default function SettingsScreen() {
  const navigation = useNavigation();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [followers_count, setFollowers] = useState(0);
  const [following_count, setFollowing] = useState(0);
  const [posts_count, setPosts] = useState(0);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activeStatus, setActiveStatus] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityStatus, setActivityStatus] = useState()

  const loadProfile = useCallback(async () => {
    try {
      const token = (await AsyncStorage.getItem("token")) || "";
      const id = (await AsyncStorage.getItem("user_id")) || "";
      if (!token || !id) return;

      const response = await api.get(`/users/register/${id}/`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });

      if (response.status === 200) {
        const d = response.data;
        setUsername(d.username || "not");
        setFullName(d.full_name || "not name");
        setEmail(d.email || "");
        setBio(d.bio || "");
        setAvatar(d.avatar || d.profile_picture || d.image || d.photo || "");
        setFollowers(d.followers_count || 0);
        setFollowing(d.following_count || 0);
        setPosts(d.posts_count || 0);
        setPrivateAccount(d.is_private || false);
        setActiveStatus(d.active_status || false);
      }
    } catch (err) {
      console.error("Profilni yuklashda xatolik:", err);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const token = (await AsyncStorage.getItem("token")) || "";
      if (!token) return;
      setSessionsLoading(true);
      
      const list = await fetchSessions(token);
      console.log("sessiyalar: ", list)
      setSessions(list);

    } catch (err) {
      console.error("Sessiyalarni yuklashda xatolik:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadProfile(), loadSessions()]);
      setLoading(false);
    })();
  }, [loadProfile, loadSessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadSessions()]);
    setRefreshing(false);
  };



    const handleRevokeSession = (session) => {
    const isCurrentDevice = session.is_this_device; // yoki session.device_id === currentDeviceId

    Alert.alert(
      isCurrentDevice ? "Joriy qurilmadan chiqish" : "Qurilmani chiqarish",

      isCurrentDevice
        ? "Siz hozir foydalanayotgan qurilmadan chiqmoqchisiz.\n\nAgar davom etsangiz, hisobingizdan chiqasiz va qayta kirish uchun login qilishingiz kerak bo'ladi."
        : `"${session.device_name || "Bu qurilma"}" tizimdan chiqarilsinmi?`,

      [
        {
          text: "Bekor qilish",
          style: "cancel",
        },
        {
          text: isCurrentDevice ? "Chiqish" : "Chiqarish",
          style: "destructive",

          onPress: async () => {
            try {
              const token = (await AsyncStorage.getItem("token")) || "";

              await revokeSession(token, session.id);

              if (isCurrentDevice) {
                // Tokenlarni o'chiramiz
                await AsyncStorage.multiRemove([
                  "token",
                  "refresh",
                ]);

                // Login sahifasiga yuboramiz
                router.replace("/auth/login");
              } else {
                // Faqat ro'yxatdan olib tashlaymiz
                setSessions((prev) =>
                  prev.filter((s) => s.id !== session.id)
                );
              }
            } catch (err) {
              Alert.alert(
                "Xatolik",
                "Qurilmani chiqarib bo'lmadi."
              );
            }
          },
        },
      ]
    );
  };
  const deleteAccount = () => {
    Alert.alert(
      "Accountni o'chirish",
      "Siz rostdan ham accountni o'chirmoqchimisiz? Bu qaytarib bo'lmaydi!",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const id = await AsyncStorage.getItem("user_id");
              await API.delete(`/users/register/${id}/`, {
                headers: { Authorization: `Bearer ${token.trim()}` },
              });
              Alert.alert("Muvaffaqiyatli", "Account muvaffaqiyatli o'chirildi!");
              await AsyncStorage.multiRemove(["token", "user_id"]);
              router.push("../auth/login");
            } catch (e) {
              console.error("Accountni o'chirishda xatolik:", e);
              Alert.alert("Xatolik", "Accountni o'chirishda xatolik yuz berdi.");
            }
          },
        },
      ]
    );
  };

  const logout = async () => {
    const token = await AsyncStorage.getItem("token");
    // Serverdagi shu qurilma sessiyasini ham yopamiz (Telegram'da "log out" qilganda
    // o'sha qurilma ro'yxatdan chiqib ketishi kabi)
    if (token) await endCurrentSession(token);
    await AsyncStorage.multiRemove(["token", "user_id"]);
    setShowLogoutModal(false);
    router.push("../auth/login")
  };

  const fmtNum = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));


  return (
    
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={logout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Profil kartasi */}
      <View style={styles.profileCard}>
        <View>
          <ChevronLeft style={{ fontSize: 16, color: "#0969da", fontWeight: "600", right: 356 }} onPress={() => router.push("../pages/profile")} />
        </View>
        <Avatar name={fullName} src={avatar} size={80} />

        {loading ? (
          <ActivityIndicator color="#667eea" />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.fullName}>{fullName}</Text>
            <Text style={styles.username}>@{username}</Text>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>
        )}

        <View style={styles.statsRow}>
          {[
            { label: "Postlar", value: fmtNum(posts_count) },
            { label: "Obunachilar", value: fmtNum(followers_count) },
            { label: "Obunalar", value: fmtNum(following_count) },
          ].map((stat, i, arr) => (
            <View
              key={i}
              style={[
                styles.statItem,
                i < arr.length - 1 && styles.statItemBorder,
              ]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Account */}
      <SectionCard title="Hisob">
        <SettingRow
          icon={<User size={16} color="#0969da" />}
          label="Shaxsiy ma'lumotlar"
          sublabel={email || "Ism va emailni yangilash"}
          chevron
          onPress={() => router.push("./edit/EditPersonal")}
        />
        <Divider />
        <SettingRow
          icon={<Lock size={16} color="#0969da" />}
          label="Parol va xavfsizlik"
          sublabel="Parol va 2FA'ni boshqarish"
          chevron
          onPress={() => router.push("./edit/ChangeSecurity")}
        />
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="Maxfiylik">
        <SettingRow
          icon={<Shield size={16} color="#0969da" />}
          label="Maxfiy hisob"
          sublabel={privateAccount ? "YES" : "NO"}
          
        />
        <Divider />
      <SettingRow
        icon={<Eye size={16} color="#0969da" />}
        label="Faollik holati"
        sublabel={activeStatus ? "Online" : "Offline"}
        
      />
      </SectionCard>

      {/* Active Sessions — Telegram uslubida */}
      <SectionCard title="Faol sessiyalar">
        {sessionsLoading ? (
            <View style={{ padding: 16 }}>
              <ActivityIndicator color="#667eea" />
            </View>
        ) : sessions.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={styles.rowSublabel}>Hozircha faol sessiyalar topilmadi.</Text>
          </View>
        ) : (
          sessions.map((session, i) => (
            <React.Fragment key={session.id ?? i}>
              {i > 0 && <Divider />}
              <SessionRow 
                  session={session}
                  onRevoke={handleRevokeSession}

              />
            </React.Fragment>
          ))
        )}
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Ko'rinish">
        <SettingRow
          icon={<Sun size={16} color="#0969da" />}
          label="Mavzu"
          sublabel="Yorug' rejim"
          chevron
          onPress={() => {}}
        />
      </SectionCard>

      {/* accounts */}
      <SectionCard title="Qo'shimcha">
        <SettingRow
          icon={<Users size={16} color="#0969da" />}
          label="Yangi account ochish"
          sublabel="Agar yana account ochishni istasangiz, shu yerga bosing"
          chevron
          onPress={() => router.push("../../auth/register")}
        />
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Xavfli hudud">
        <SettingRow
          icon={<LogOut size={16} color="#cf222e" />}
          label="Chiqish"
          sublabel="Shu qurilmadan chiqish"
          danger
          chevron
          onPress={() => setShowLogoutModal(true)}
        />
        <Divider />
        <SettingRow
          icon={<Trash2 size={16} color="#cf222e" />}
          label="Accountni o'chirish"
          sublabel="Profilni butunlay o'chirish"
          danger
          chevron
          onPress={deleteAccount}
        />
      </SectionCard>
      <Text style={styles.footer}>Instadew v2.4.0 · Build 9823</Text>
    </ScrollView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f8fa" },

  profileCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    gap: 16,
  },
  fullName: { fontSize: 20, fontWeight: "700", color: "#24292f", marginBottom: 2 },
  username: { fontSize: 14, color: "#57606a", marginBottom: 6 },
  bio: { fontSize: 13, color: "#24292f", textAlign: "center", maxWidth: 300 },

  statsRow: {
    flexDirection: "row",
    width: "100%",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  statItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  statItemBorder: { borderRightWidth: 1, borderRightColor: "#d0d7de" },
  statValue: { fontSize: 16, fontWeight: "700", color: "#24292f", marginBottom: 2 },
  statLabel: { fontSize: 12, color: "#57606a" },

  sectionTitle: {
    marginLeft: 4,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#57606a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 10,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f8ff",
    borderWidth: 1,
    borderColor: "#cae8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconWrapDanger: { backgroundColor: "#fff1f0", borderColor: "#ffcdd0" },
  rowLabel: { fontSize: 14, fontWeight: "500", color: "#24292f" },
  rowLabelDanger: { color: "#cf222e" },
  rowSublabel: { fontSize: 12, color: "#57606a", marginTop: 1 },

  divider: { height: 1, backgroundColor: "#d0d7de", marginHorizontal: 16 },

  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2da44e",
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ffcdd0",
    backgroundColor: "#fff1f0",
  },
  revokeBtnText: { fontSize: 12, fontWeight: "600", color: "#cf222e" },

  footer: { textAlign: "center", fontSize: 12, color: "#8c959f", marginTop: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(36,41,47,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 440,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff1f0",
    borderWidth: 1,
    borderColor: "#ffcdd0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#24292f" },
  modalSubtitle: { fontSize: 13, color: "#57606a", marginTop: 2 },
  modalBody: { padding: 20 },
  modalBodyText: { fontSize: 14, color: "#24292f", lineHeight: 20 },
  modalFooter: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#d0d7de",
  },
  btnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
  },
  btnCancelText: { color: "#24292f", fontWeight: "500", fontSize: 14 },
  btnDanger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#cf222e",
  },
  device_id: {
    color: "#7d2121",
  },
  
  btnDangerText: { color: "#fff", fontWeight: "500", fontSize: 14 },

  
});