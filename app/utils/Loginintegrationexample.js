// loginIntegrationExample.js
// Login ekraningizda muvaffaqiyatli kirishdan keyin qo'shishingiz kerak bo'lgan qism.
// Bu orqali "kirilgan vaqt" va "qaysi qurilma" avtomatik serverga yuboriladi —
// foydalanuvchi hech narsa kiritmaydi.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerDeviceSession, startSessionHeartbeat } from "./deviceSession";
import api from "../api/server";

export async function handleLoginSuccess(username, password, navigation) {
  // 1) Odatdagidek login so'rovi
  const response = await api.post("/users/login/", { username, password });
  const { token, user_id } = response.data;

  // 2) Tokenni saqlaymiz (avvalgidek)
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user_id", String(user_id));

  // 3) YANGI: shu qurilma haqida ma'lumotni (nomi, platforma, kirilgan vaqt) avtomatik
  //    serverga yuboramiz — "Active Sessions" ro'yxatida shu yerda paydo bo'ladi
  await registerDeviceSession(token);

  // 4) YANGI: ilova ochiq turgan vaqtda shu qurilmani "onlayn" deb ko'rsatib turish uchun
  //    davriy heartbeat'ni ishga tushiramiz
  startSessionHeartbeat(token);

  // 5) Asosiy ekranga o'tamiz
  navigation.reset({ index: 0, routes: [{ name: "Home" }] });
}

// Ilova qayta ochilganda (App.js ichida, foydalanuvchi allaqachon login bo'lgan holatda)
// heartbeat'ni qayta ishga tushirishni unutmang:
//
//   useEffect(() => {
//     (async () => {
//       const token = await AsyncStorage.getItem("token");
//       if (token) startSessionHeartbeat(token);
//     })();
//   }, []);