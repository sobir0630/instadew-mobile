import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av"; // faqat ruxsat so'rash uchun; ijro/yozib olish endi expo-audio'da

export async function ensureMediaLibraryPermission() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Davom etish uchun galereyadan foydalanishga ruxsat bering.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[permissions] media library error:", err);
    return false;
  }
}

export async function ensureCameraPermission() {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Davom etish uchun kameradan foydalanishga ruxsat bering.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[permissions] camera error:", err);
    return false;
  }
}

export async function ensureMicPermission() {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ruxsat kerak", "Ovozli xabar yuborish uchun mikrofonga ruxsat bering.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("[permissions] microphone error:", err);
    return false;
  }
}