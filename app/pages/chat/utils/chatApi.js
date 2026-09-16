import API from "../../../api/server"; // loyihangizga qarab moslang
import { authHeader, buildRoomName } from "./helpers";

export async function fetchHistory(roomName) {
  try {
    const headers = await authHeader();
    const res = await API.get(`/messages/history/`, { params: { room: roomName }, headers });
    const d = res.data;
    return Array.isArray(d) ? d : d?.results || d?.messages || [];
  } catch (err) {
    console.error("[fetchHistory] error:", err?.response?.data || err.message);
    return [];
  }
}

export async function fetchUsers() {
  try {
    const headers = await authHeader();
    const res = await API.get(`/users/register/`, { headers });
    const d = res.data;
    return Array.isArray(d) ? d : d?.results || [];
  } catch (err) {
    console.error("[fetchUsers] error:", err?.response?.data || err.message);
    return [];
  }
}

export async function fetchAllLastMessages(users, myUsername, myUserId, readMap = {}) {
  try {
    const entries = await Promise.all(
      users.map(async (u) => {
        const room = buildRoomName(myUsername, u.username);
        const hist = await fetchHistory(room);
        const last = hist.length > 0 ? hist[hist.length - 1] : null;
        const readTs = readMap[room];
        const unreadCount = hist.filter((msg) => {
          const timestamp = msg.timestamp || msg.created_at || msg.updated_at;
          const fromMe =
            String(msg.sender) === String(myUserId) ||
            msg.sender === myUsername ||
            msg.sender_username === myUsername;
          return !fromMe && timestamp && (!readTs || new Date(timestamp) > new Date(readTs));
        }).length;
        return [u.username, { last, unreadCount }];
      })
    );
    return Object.fromEntries(entries);
  } catch (err) {
    console.error("[fetchAllLastMessages] error:", err);
    return {};
  }
}