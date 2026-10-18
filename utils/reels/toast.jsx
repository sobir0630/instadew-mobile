import { Alert, Platform, ToastAndroid } from "react-native";

// ═══════════════════════════════════════════════════════════════════════
//  TOAST — Android'da ToastAndroid, iOS'da Alert orqali xabar ko'rsatadi
// ═══════════════════════════════════════════════════════════════════════

export function showToast(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("", message);
  }
}