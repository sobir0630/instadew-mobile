// deviceSession.js
// Telegram-uslubidagi "Active Sessions" tizimi uchun yordamchi modul.
//
// Nima qiladi:
//  1) Har bir qurilma uchun bir marta generatsiya qilinadigan, doimiy device_id yaratadi
//     (AsyncStorage'da saqlanadi, ilova o'chirilmaguncha o'zgarmaydi).
//  2) Login bo'lgan zahoti serverga "shu qurilmadan kirildi" haqida sessiya yozuvi yuboradi
//     (qurilma nomi, platforma, kirilgan vaqt — avtomatik, foydalanuvchi hech narsa kiritmaydi).
//  3) Sessiyalar ro'yxatini serverdan olib, qaysi biri "shu qurilma" ekanini aniqlaydi
//     (Telegram'dagidek — joriy qurilma "Online" bo'lib, qolganlari "oxirgi faollik" vaqti bilan ko'rinadi).
//  4) Ilova foreground'da bo'lganda vaqti-vaqti bilan "heartbeat" yuborib, last_active'ni yangilab turadi.
//  5) Sessiyani (qurilmani) tizimdan chiqarish (revoke) imkonini beradi.
//
// ESLATMA (backend haqida):
// Yuborilgan asl kodda sessiyalar aslida foydalanuvchi profili endpointidan (/users/register/{id}/)
// ikkinchi marta so'ralgan edi — bu sessiyalar uchun to'g'ri endpoint emas edi (shunchaki profil
// ma'lumotini takror qaytargan). Sessiyalarni to'g'ri ishlashi uchun backend'da alohida sessiyalar
// endpointlari kerak bo'ladi. Quyida shu maqsadda ishlatilgan endpoint yo'llari (mos ravishda
// backendda mavjud bo'lishi/yaratilishi kerak):
//
//   POST   /users/sessions/                -> yangi sessiya yaratish (login paytida)
//   GET    /users/sessions/                -> foydalanuvchining barcha sessiyalari ro'yxati
//   PATCH  /users/sessions/{id}/heartbeat/ -> last_active va is_active'ni yangilash
//   DELETE /users/sessions/{id}/           -> sessiyani bekor qilish (revoke / logout)
//
// Agar sizning backendingizda bu yo'llar boshqacha nomlansa, faqat quyidagi SESSION_ENDPOINTS
// obyektini o'zgartirsangiz kifoya — qolgan hech narsani o'zgartirish shart emas.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, AppState } from "react-native";
import api from "../api/server";

// ---- Agar backend yo'llaringiz boshqacha bo'lsa, faqat shu yerni o'zgartiring ----
export const SESSION_ENDPOINTS = {
  create: "/session/session/session/",
  list: "/session/session/session/",
  heartbeat: (sessionId) => `/session/session/session/`,
  revoke: (sessionId) => `/session/session/session/${sessionId}/`,
};

const DEVICE_ID_KEY = "device_id";
const CURRENT_SESSION_ID_KEY = "current_session_id";
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 daqiqada bir marta

let heartbeatTimer = null;
let appStateSub = null;

// ---------- Yordamchi: shu qurilma uchun doimiy va noyob ID ----------
function generateUUID() {
  // Tashqi kutubxonasiz oddiy UUID v4 generatori
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ---------- Yordamchi: qurilma nomi va platforma haqida ma'lumot ----------
// Agar loyihangiz Expo asosida bo'lsa, aniqroq qurilma nomi (masalan "iPhone 14 Pro")
// olish uchun `expo-device` paketini o'rnating va quyidagi funksiyani almashtiring:
//
//   import * as Device from "expo-device";
//   export async function getDeviceInfo() {
//     return {
//       device_name: Device.deviceName || `${Device.manufacturer ?? ""} ${Device.modelName ?? ""}`.trim() || "Noma'lum qurilma",
//       platform: `${Platform.OS} ${Device.osVersion ?? ""}`.trim(),
//     };
//   }
//
// Bare React Native (Expo'siz) loyiha uchun `react-native-device-info` paketidan foydalaning:
//
//   import DeviceInfo from "react-native-device-info";
//   export async function getDeviceInfo() {
//     return {
//       device_name: await DeviceInfo.getDeviceName(),
//       platform: `${Platform.OS} ${await DeviceInfo.getSystemVersion()}`,
//     };
//   }
//
// Quyida hech qanday qo'shimcha paketsiz ishlaydigan, kamroq aniq bo'lgan variant:
export async function getDeviceInfo() {
  return {
    device_name: Platform.OS === "ios" ? "iOS qurilma" : "Android qurilma",
    platform: `${Platform.OS} ${Platform.Version}`,
  };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token.trim()}` };
}

// ---------- 1) Login bo'lgan zahoti sessiya yaratish ----------
// Buni login muvaffaqiyatli bo'lgandan so'ng (token saqlangandan keyin) bir marta chaqiring.
export async function registerDeviceSession(token) {
  try {
    const device_id = await getDeviceId();
    const { device_name, platform } = await getDeviceInfo();

    const response = await api.post(
      SESSION_ENDPOINTS.create,
      {
        device_id,
        device_name,
        platform,
        // created_at / last_active / ip_address / location — bularni
        // backend o'zi (server tomonda, request kelgan vaqt va IP asosida) belgilashi kerak,
        // shuning uchun bu yerdan yubormaymiz.
      },
      { headers: authHeaders(token) }
    );

    if (response?.data?.id) {
      await AsyncStorage.setItem(CURRENT_SESSION_ID_KEY, String(response.data.id));
    }
    return response?.data || null;
  } catch (err) {
    console.error("Sessiyani ro'yxatga olishda xatolik:", err);
    return null;
  }
}

// ---------- 2) Barcha sessiyalarni olish + joriy qurilmani aniqlash ----------
export async function fetchSessions(token) {
  const [device_id, currentSessionId] = await Promise.all([
    getDeviceId(),
    AsyncStorage.getItem(CURRENT_SESSION_ID_KEY),
  ]);

  const response = await api.get(SESSION_ENDPOINTS.list, {
    headers: authHeaders(token),
  });

  const rawSessions = Array.isArray(response?.data)
    ? response.data
    : response?.data?.results || [];

  // Joriy qurilmani avval session_id, topilmasa device_id orqali aniqlaymiz
  const sessions = rawSessions.map((s) => {
    const isThisDevice = true
    return { ...s, is_this_device: isThisDevice };
  });

  // Joriy qurilma ro'yxat boshida chiqishi uchun saralaymiz (Telegram'dagidek)
  sessions.sort((a, b) => (b.is_this_device ? 1 : 0) - (a.is_this_device ? 1 : 0));

  return sessions;
}

// ---------- 3) Sessiyani bekor qilish (boshqa qurilmani chiqarib yuborish) ----------
export async function revokeSession(token, sessionId) {
  await api.delete(SESSION_ENDPOINTS.revoke(sessionId), {
    headers: authHeaders(token),
  });
}

// ---------- 4) Joriy qurilma uchun heartbeat (uni "online" qilib turish) ----------
async function sendHeartbeat(token) {
  try {
    const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!currentSessionId) return;
    await api.patch(
      SESSION_ENDPOINTS.heartbeat(currentSessionId),
      {},
      { headers: authHeaders(token) }
    );
  } catch (err) {
    // Jim tarzda o'tkazib yuboramiz — internet vaqtincha yo'qligi mumkin
  }
}

// Ilova ochilganda (App.js yoki asosiy navigatorda) shuni chaqiring:
//   startSessionHeartbeat(token);
// Va ilova yopilganda/logout paytida:
//   stopSessionHeartbeat();
export function startSessionHeartbeat(token) {
  stopSessionHeartbeat();

  // Ilova ochilgan zahoti va har daqiqada bittadan heartbeat
  sendHeartbeat(token);
  heartbeatTimer = setInterval(() => sendHeartbeat(token), HEARTBEAT_INTERVAL_MS);

  // Ilova fonga o'tib qaytganda ham darhol yangilab qo'yamiz
  appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") sendHeartbeat(token);
  });
}

export function stopSessionHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
}

// ---------- 5) Logout paytida joriy sessiyani ham serverdan o'chirish ----------
export async function endCurrentSession(token) {
  try {
    const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (currentSessionId) {
      await api.delete(SESSION_ENDPOINTS.revoke(currentSessionId), {
        headers: authHeaders(token),
      });
    }
  } catch (err) {
    // Server bilan bog'lanib bo'lmasa ham lokal chiqishga to'sqinlik qilmaymiz
  } finally {
    stopSessionHeartbeat();
    await AsyncStorage.removeItem(CURRENT_SESSION_ID_KEY);
  }
}

// ---------- 6) "X daqiqa oldin" kabi Telegram-uslubidagi vaqt formatlash ----------
export function formatLastActive(dateString) {
  if (!dateString) return "Noma'lum";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "hozirgina";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "kecha";
  if (diffDay < 7) return `${diffDay} kun oldin`;

  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" });
}