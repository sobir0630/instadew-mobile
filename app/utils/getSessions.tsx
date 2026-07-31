import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/server";

export async function getSessions() {
  const token = await AsyncStorage.getItem("token");

  const response = await API.get(
    "/session/session/session/",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
