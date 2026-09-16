import AsyncStorage from "@react-native-async-storage/async-storage";

// Backend ishonchli "is_read" bermagani uchun, har bir xona (room) qachon
// oxirgi marta ochilgani lokal saqlanadi va oxirgi xabar vaqti bilan
// solishtiriladi — shu orqali "o'qilmagan" holati aniqlanadi.
const READ_TS_PREFIX = "read_ts_";

export async function loadAllReadTimestamps() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const readKeys = keys.filter((k) => k.startsWith(READ_TS_PREFIX));
    if (readKeys.length === 0) return {};
    const pairs = await AsyncStorage.multiGet(readKeys);
    const map = {};
    pairs.forEach(([key, value]) => {
      if (value) map[key.replace(READ_TS_PREFIX, "")] = value;
    });
    return map;
  } catch (err) {
    console.error("[readTracking] load error:", err);
    return {};
  }
}

export async function saveReadTimestamp(room, iso) {
  try {
    await AsyncStorage.setItem(`${READ_TS_PREFIX}${room}`, iso);
  } catch (err) {
    console.error("[readTracking] save error:", err);
  }
}