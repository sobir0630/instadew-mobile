import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

/*
|--------------------------------------------------------------------------
| Notification qanday ko'rinishini belgilaymiz
|--------------------------------------------------------------------------
*/

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


/*
|--------------------------------------------------------------------------
| Android Notification Channel
|--------------------------------------------------------------------------
|
| Bu Android'da Telegramga o'xshash notification channel.
|
*/

async function setupAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Instadew Notifications",

    importance: Notifications.AndroidImportance.MAX,

    vibrationPattern: [0, 250, 250, 250],

    sound: "default",

    lockscreenVisibility:
      Notifications.AndroidNotificationVisibility.PUBLIC,

    showBadge: true,
  });
}


/*
|--------------------------------------------------------------------------
| Permission
|--------------------------------------------------------------------------
*/

async function requestNotificationPermission() {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission berilmadi");

    return false;
  }

  return true;
}


/*
|--------------------------------------------------------------------------
| Expo Push Token olish
|--------------------------------------------------------------------------
*/

export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log(
        "Push notification real physical device'da ishlatilishi kerak."
      );

      return null;
    }

    await setupAndroidChannel();

    const permissionGranted =
      await requestNotificationPermission();

    if (!permissionGranted) {
      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Expo Project ID
    |--------------------------------------------------------------------------
    */

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log("Expo projectId topilmadi.");
      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Expo Push Token
    |--------------------------------------------------------------------------
    */

    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    console.log(
      "EXPO PUSH TOKEN:",
      token.data
    );

    return token.data;

  } catch (error) {
    console.error(
      "Push notification registration error:",
      error
    );

    return null;
  }
}