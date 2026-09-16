import { useEffect, useState } from "react";
import { wsBase } from "../utils/helpers";

// Presence (kim online) websocket — ChatScreen'dan ajratilgan, chunki bu
// butun ilova davomida faqat bir marta ochiladi va boshqa hech narsaga
// bog'liq emas.
export function usePresence() {
  const [onlineMap, setOnlineMap] = useState({});

  useEffect(() => {
    let ws;
    let retryTimer;

    const tryConnect = () => {
      try {
        ws = new WebSocket(`${wsBase()}/ws/presence/`);
        ws.onopen = () => console.log("[presence-ws] connected - ws host:", wsBase());
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === "presence" && Array.isArray(d.online_users)) {
              const m = {};
              d.online_users.forEach((u) => { m[u] = true; });
              setOnlineMap(m);
            }
            if (d.type === "user_status" && d.username) {
              setOnlineMap((prev) => ({ ...prev, [d.username]: !!d.online }));
            }
          } catch (err) {
            console.error("[presence-ws] parse error:", err);
          }
        };
        ws.onerror = (e) => console.error("[presence-ws] error:", e?.message || e);
        ws.onclose = () => { retryTimer = setTimeout(tryConnect, 5000); };
      } catch (err) {
        console.error("[presence-ws] connect error:", err);
        retryTimer = setTimeout(tryConnect, 5000);
      }
    };
    tryConnect();
    return () => { ws?.close(); clearTimeout(retryTimer); };
  }, []);

  const isOnline = (username) => !!onlineMap[username];

  return { onlineMap, isOnline };
}