import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Application from "expo-application";

// ════════════════════════════════════════════════════════════════════════════
//  DEVICE / SESSION HELPERS
// ════════════════════════════════════════════════════════════════════════════

export const getDeviceType = () => {
  switch (Device.deviceType) {
    case Device.DeviceType.PHONE:
      return "mobile";
    case Device.DeviceType.TABLET:
      return "tablet";
    default:
      return "desktop";
  }
};

// ip malumotlarini olish
const getPublicIP = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();

    if (data.status === 200) {
      AsyncStorage.setItem("IP_address", data.ip);
    }
    console.log("Public IP:", data.ip);

    return data.ip;
  } catch (error) {
    console.log("IP olishda xatolik:", error);
    return null;
  }
};

// browserdan login bulsa uni malumotlarini olish
const getBrowserInfo = () => {
  if (Platform.OS !== "web") {
    return {
      browser: null,
      browser_version: null,
    };
  }

  const ua = navigator.userAgent;

  let browser = "Unknown";
  let browser_version = "";

  if (ua.includes("Firefox")) {
    browser = "Firefox";
    browser_version = ua.match(/Firefox\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Edg")) {
    browser = "Microsoft Edge";
    browser_version = ua.match(/Edg\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("OPR") || ua.includes("Opera")) {
    browser = "Opera";
    browser_version =
      ua.match(/OPR\/([\d.]+)/)?.[1] ||
      ua.match(/Opera\/([\d.]+)/)?.[1] ||
      "";
  } else if (
    ua.includes("Chrome") &&
    !ua.includes("Edg") &&
    !ua.includes("OPR")
  ) {
    browser = "Chrome";
    browser_version = ua.match(/Chrome\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari";
    browser_version = ua.match(/Version\/([\d.]+)/)?.[1] || "";
  }

  return {
    browser,
    browser_version,
  };
};

const getDeviceId = async () => {
  if (Platform.OS === "android") {
    const androidId = Application.getAndroidId();
    return androidId;
  }

  if (Platform.OS === "ios") {
    const iosId = await Application.getIosIdForVendorAsync();
    return iosId;
  }

  return null;
};

// malumot joylash
export const getSessionData = async () => {
  const ip_addrr = await getPublicIP();
  const refresh = await AsyncStorage.getItem("refresh");
  console.log("refresh:", refresh);

  const browserInfo = getBrowserInfo();
  const ids = await getDeviceId();

  return {
    refresh: refresh,
    device_id: ids,

    device_name: Device.deviceName || "Unknown Device",
    device_type: getDeviceType(),
    platform: Platform.OS,

    browser: browserInfo.browser,
    browser_version: browserInfo.browser_version,

    ip_address: ip_addrr,
    user_agent: Platform.OS === "web" ? navigator.userAgent : "InstaDew app",

    app_version: Application.nativeApplicationVersion || "1.0.0",

    expires_at: "",
    is_active: true,
    is_this_deviace: true,
  };
};