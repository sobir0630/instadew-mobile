import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from "react-native-webrtc";

import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  RefreshCw,
} from "lucide-react-native";

import { API_HOST_WS } from "../../../api/api/ip";

// ======================================================
// 1. WEBSOCKET SERVER MANZILI
// ======================================================

// Misol:
// const API_HOST_WS = "wss://example.ngrok-free.dev";
//
// Bu yerda /ws/call/... yozilmaydi.
// Pastda URL avtomatik tuziladi.

const WS_BASE_URL = String(API_HOST_WS || "").replace(/\/+$/, "");

// ======================================================
// 2. WEBRTC SOZLAMALARI
// ======================================================

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

// ======================================================
// 3. YORDAMCHI FUNKSIYALAR
// ======================================================

const getErrorMessage = (error) => {
  if (!error) return "Noma'lum xatolik";

  if (typeof error === "string") {
    return error;
  }

  return (
    error.message ||
    error.name ||
    JSON.stringify(error) ||
    "Noma'lum xatolik"
  );
};

const getParamValue = (value) => {
  return Array.isArray(value) ? value[0] : value;
};

const getSafeJSON = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// ======================================================
// 4. ASOSIY KOMPONENT
// ======================================================

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parametrlarning asl qiymatlarini saqlaymiz.
  const rawRoomName = params.roomName;
  const rawIsCaller = params.isCaller;

  // Expo Router ba'zan parametrni massiv shaklida beradi.
  const roomParam = getParamValue(rawRoomName);
  const callerParam = getParamValue(rawIsCaller);

  // Xona nomini tekshirishdan oldin stringga majburan
  // aylantirmaymiz: noto'g'ri qiymatni yashirib qo'ymaslik kerak.
  const callRoom =
    typeof roomParam === "string" ? roomParam.trim() : "";

  const isCaller = String(callerParam) === "true";

  const roomIsValid =
    typeof roomParam === "string" &&
    callRoom.length > 0 &&
    /^[\w-]+$/.test(callRoom);

  const socketUrl =
    WS_BASE_URL && roomIsValid
      ? `${WS_BASE_URL}/ws/call/${encodeURIComponent(callRoom)}/`
      : "";

  // ====================================================
  // 5. STATE
  // ====================================================

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const [status, setStatus] = useState("Qo'ng'iroq tayyorlanmoqda...");
  const [debugInfo, setDebugInfo] = useState("");

  const [connected, setConnected] = useState(false);
  const [ringing, setRinging] = useState(false);

  // ====================================================
  // 6. REF
  // ====================================================

  const wsRef = useRef(null);
  const pcRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const pendingCandidatesRef = useRef([]);

  const endingRef = useRef(false);
  const startedRef = useRef(false);

  // Ringtone fayli loyihadagi assets/ringtone.wav da bo'lishi kerak.
  const ringtonePlayer = useAudioPlayer(
    require("../../../assets/ringtone/song.mp3")
  );

  // ====================================================
  // 7. DIAGNOSTIKA
  // ====================================================

  const showDiagnostic = useCallback(
    (title, error, extra = {}) => {
      const details = {
        xatolik: title,
        xatolikMatni: getErrorMessage(error),
        vaqt: new Date().toISOString(),

        roomNameAslQiymati: rawRoomName,
        roomNameJSON: getSafeJSON(rawRoomName),
        roomNameTuri: typeof rawRoomName,
        roomNameArraymi: Array.isArray(rawRoomName),
        tanlanganRoomName: roomParam,
        tozalanganRoomName: callRoom,
        roomNameFormatTogri: roomIsValid,

        isCallerAslQiymati: rawIsCaller,
        isCallerTuri: typeof rawIsCaller,
        isCaller: isCaller,

        API_HOST_WS: API_HOST_WS,
        WS_BASE_URL: WS_BASE_URL,
        WebSocketURL: socketUrl || "URL tuzilmadi",

        WebSocketReadyState: wsRef.current?.readyState ?? null,
        PeerConnectionState:
          pcRef.current?.connectionState ?? "Yaratilmagan",

        ...extra,
      };

      const message = getSafeJSON(details);

      console.error("📞 INSTАDEW QO'NG'IROQ DIAGNOSTIKASI\n", message);

      setDebugInfo(message);
      setStatus(`${title}: ${getErrorMessage(error)}`);
    },
    [
      rawRoomName,
      roomParam,
      callRoom,
      roomIsValid,
      rawIsCaller,
      isCaller,
      socketUrl,
    ]
  );

  // ====================================================
  // 8. SIGNAL YUBORISH
  // ====================================================

  const sendSignal = useCallback((message) => {
    const ws = wsRef.current;

    if (!ws) {
      console.error("WebSocket mavjud emas:", message.type);
      return false;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      console.error(
        "WebSocket ochilmagan. Holat:",
        ws.readyState,
        "Signal:",
        message.type
      );
      return false;
    }

    try {
      ws.send(JSON.stringify(message));

      console.log("📤 Signal yuborildi:", message.type);

      return true;
    } catch (error) {
      console.error("Signal yuborish xatosi:", error);
      return false;
    }
  }, []);

  // ====================================================
  // 9. MEDIA VA PEER CONNECTIONNI TOZALASH
  // ====================================================

  const releaseMediaAndPeer = useCallback(() => {
    try {
      const pc = pcRef.current;

      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;

        try {
          pc.close();
        } catch (error) {
          console.warn("PeerConnection yopilmadi:", error);
        }
      }

      pcRef.current = null;

      const stream = localStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (error) {
            console.warn("Track to'xtatilmadi:", error);
          }
        });
      }

      localStreamRef.current = null;
      remoteStreamRef.current = null;

      pendingCandidatesRef.current = [];

      setLocalStream(null);
      setRemoteStream(null);
      setConnected(false);
    } catch (error) {
      console.error("Media tozalash xatosi:", error);
    }
  }, []);

  // ====================================================
  // 10. QO'NG'IROQNI BOSHLASH
  // ====================================================

  useEffect(() => {
    let active = true;
    let localStream = null;
    let localPC = null;
    let localWS = null;

    const flushPendingCandidates = async () => {
      if (!localPC?.remoteDescription) return;

      const candidates = pendingCandidatesRef.current.splice(0);

      for (const candidate of candidates) {
        try {
          await localPC.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error(
            "Kutayotgan ICE candidate xatosi:",
            getErrorMessage(error)
          );
        }
      }
    };

    const startCall = async () => {
      if (startedRef.current) return;
      startedRef.current = true;

      endingRef.current = false;

      console.log("========== QO'NG'IROQ BOSHLANDI ==========");
      console.log("roomName asl:", getSafeJSON(rawRoomName));
      console.log("roomName turi:", typeof rawRoomName);
      console.log("roomName array:", Array.isArray(rawRoomName));
      console.log("roomName tanlangan:", callRoom);
      console.log("roomName to'g'ri:", roomIsValid);
      console.log("isCaller:", isCaller);
      console.log("API_HOST_WS:", API_HOST_WS);
      console.log("WebSocket URL:", socketUrl);

      // ----------------------------------------------
      // 10.1 ROOMNAME TEKSHIRUVI
      // ----------------------------------------------

      if (!roomIsValid) {
        showDiagnostic(
          "ROOMNAME XATOSI",
          "roomName bo'sh yoki noto'g'ri formatda",
          {
            kutilganFormat: "room123 yoki room_123 yoki room-123",
            qabulQilinganBelgilar: "A-Z, a-z, 0-9, _ va -",
          }
        );

        setRinging(false);
        return;
      }

      // ----------------------------------------------
      // 10.2 WEBSOCKET MANZILINI TEKSHIRISH
      // ----------------------------------------------

      if (!WS_BASE_URL || !/^wss?:\/\//i.test(WS_BASE_URL)) {
        showDiagnostic(
          "WEBSOCKET MANZIL XATOSI",
          "API_HOST_WS bo'sh yoki ws:// / wss:// bilan boshlanmaydi",
          {
            kerakliMisol: "wss://example.ngrok-free.dev",
          }
        );

        setRinging(false);
        return;
      }

      try {
        // --------------------------------------------
        // 10.3 AUDIO MODE
        // --------------------------------------------

        setStatus("Kamera va mikrofon ochilmoqda...");

        await setAudioModeAsync({
          playsInSilentMode: true,
        });

        // --------------------------------------------
        // 10.4 KAMERA VA MIKROFON
        // --------------------------------------------

        localStream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: "user",
          },
        });

        if (!active) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = localStream;
        setLocalStream(localStream);

        console.log(
          "Media tracklari:",
          localStream.getTracks().map((track) => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
          }))
        );

        // --------------------------------------------
        // 10.5 PEER CONNECTION
        // --------------------------------------------

        localPC = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = localPC;

        localStream.getTracks().forEach((track) => {
          localPC.addTrack(track, localStream);
        });

        // --------------------------------------------
        // 10.6 MASOFAVIY VIDEO/AUDIO
        // --------------------------------------------

        localPC.ontrack = (event) => {
          if (!active) return;

          const incomingStream = event.streams?.[0];

          if (!incomingStream) {
            console.warn("Masofaviy stream topilmadi.");
            return;
          }

          remoteStreamRef.current = incomingStream;

          setRemoteStream(incomingStream);
          setConnected(true);
          setRinging(false);
          setStatus("Qo'ng'iroq ulandi");

          console.log("Masofaviy stream qabul qilindi.");
        };

        // --------------------------------------------
        // 10.7 ICE CANDIDATE
        // --------------------------------------------

        localPC.onicecandidate = (event) => {
          if (!active || !event.candidate) return;

          const sent = sendSignal({
            type: "ice-candidate",
            candidate: event.candidate,
          });

          if (!sent) {
            console.warn(
              "ICE candidate yuborilmadi:",
              event.candidate.candidate
            );
          }
        };

        // --------------------------------------------
        // 10.8 PEER CONNECTION HOLATI
        // --------------------------------------------

        localPC.onconnectionstatechange = () => {
          if (!active) return;

          const state = localPC.connectionState;

          console.log("PeerConnection holati:", state);

          if (state === "connected") {
            setConnected(true);
            setRinging(false);
            setStatus("Qo'ng'iroq ulandi");
          } else if (state === "connecting") {
            setStatus("Ikkinchi ishtirokchiga ulanmoqda...");
          } else if (state === "disconnected") {
            setConnected(false);
            setStatus("Aloqa uzildi. Qayta ulanish kutilmoqda...");
          } else if (state === "failed") {
            setConnected(false);
            setRinging(false);

            showDiagnostic(
              "WEBRTC ULANISH XATOSI",
              "PeerConnection failed",
              {
                peerConnectionState: state,
                tavsiya:
                  "ICE candidate va TURN server sozlamalarini tekshiring.",
              }
            );
          } else if (state === "closed") {
            console.log("PeerConnection yopildi.");
          }
        };

        localPC.oniceconnectionstatechange = () => {
          if (!active) return;

          console.log(
            "ICE connection holati:",
            localPC.iceConnectionState
          );
        };

        // --------------------------------------------
        // 10.9 WEBSOCKET OCHISH
        // --------------------------------------------

        setStatus("Signal serveriga ulanmoqda...");

        console.log("WebSocket ochilmoqda:", socketUrl);

        localWS = new WebSocket(socketUrl);
        wsRef.current = localWS;

        // --------------------------------------------
        // 10.10 WEBSOCKET OCHILDI
        // --------------------------------------------

        localWS.onopen = async () => {
          if (!active || !localPC) return;

          console.log("WebSocket ochildi:", socketUrl);

          setDebugInfo(
            getSafeJSON({
              holat: "WebSocket ochildi",
              roomName: callRoom,
              isCaller,
              socketUrl,
              websocketReadyState: localWS.readyState,
            })
          );

          // Caller offer yaratadi.
          if (isCaller) {
            try {
              setStatus("Qo'ng'iroq taklifi yaratilmoqda...");

              const offer = await localPC.createOffer();

              await localPC.setLocalDescription(offer);

              const sent = sendSignal({
                type: "offer",
                sdp: offer.sdp,
              });

              if (!sent) {
                throw new Error(
                  "Offer yuborilmadi. WebSocket holatini tekshiring."
                );
              }

              setStatus("Chaqiruv yuborildi. Javob kutilmoqda...");
              setRinging(true);

              console.log("Offer muvaffaqiyatli yuborildi.");
            } catch (error) {
              showDiagnostic("OFFER XATOSI", error);
              setRinging(false);
            }
          } else {
            setStatus("Qo'ng'iroq taklifi kutilmoqda...");
            setRinging(true);
          }
        };

        // --------------------------------------------
        // 10.11 WEBSOCKET XABARLARI
        // --------------------------------------------

        localWS.onmessage = async (event) => {
          if (!active || !localPC) return;

          try {
            const data = JSON.parse(event.data);

            console.log("📥 Signal qabul qilindi:", data.type);

            // ----------------------------------------
            // OFFER
            // ----------------------------------------

            if (data.type === "offer") {
              // Server o'z offerini callerga qaytarsa,
              // caller uni qabul qilmaydi.
              if (isCaller || !data.sdp) return;

              setStatus("Qo'ng'iroq taklifi qabul qilindi...");

              await localPC.setRemoteDescription(
                new RTCSessionDescription({
                  type: "offer",
                  sdp: data.sdp,
                })
              );

              const answer = await localPC.createAnswer();

              await localPC.setLocalDescription(answer);

              const sent = sendSignal({
                type: "answer",
                sdp: answer.sdp,
              });

              if (!sent) {
                throw new Error("Answer WebSocket orqali yuborilmadi.");
              }

              await flushPendingCandidates();

              setStatus("Javob yuborildi. Ulanish kutilmoqda...");
              setRinging(false);

              console.log("Answer muvaffaqiyatli yuborildi.");
            }

            // ----------------------------------------
            // ANSWER
            // ----------------------------------------

            else if (data.type === "answer") {
              if (
                !isCaller ||
                !data.sdp ||
                localPC.currentRemoteDescription
              ) {
                return;
              }

              await localPC.setRemoteDescription(
                new RTCSessionDescription({
                  type: "answer",
                  sdp: data.sdp,
                })
              );

              await flushPendingCandidates();

              setStatus("Javob olindi. Ulanish kutilmoqda...");
              setRinging(false);

              console.log("Answer qabul qilindi.");
            }

            // ----------------------------------------
            // ICE CANDIDATE
            // ----------------------------------------

            else if (data.type === "ice-candidate") {
              if (!data.candidate) {
                console.warn("ICE candidate bo'sh.");
                return;
              }

              if (localPC.remoteDescription) {
                await localPC.addIceCandidate(
                  new RTCIceCandidate(data.candidate)
                );
              } else {
                pendingCandidatesRef.current.push(data.candidate);

                console.log(
                  "ICE candidate navbatga qo'shildi:",
                  pendingCandidatesRef.current.length
                );
              }
            }

            // ----------------------------------------
            // QO'NG'IROQNI TUGATISH
            // ----------------------------------------

            else if (data.type === "hangup") {
              setRinging(false);
              setStatus("Ikkinchi ishtirokchi qo'ng'iroqni tugatdi.");

              endingRef.current = true;

              releaseMediaAndPeer();
            }

            // ----------------------------------------
            // QO'NG'IROQ RAD ETILDI
            // ----------------------------------------

            else if (data.type === "call-rejected") {
              setRinging(false);
              setStatus("Qo'ng'iroq rad etildi.");

              endingRef.current = true;

              releaseMediaAndPeer();
            }

            // ----------------------------------------
            // SERVERDAN XATOLIK
            // ----------------------------------------

            else if (data.type === "error") {
              showDiagnostic(
                "SERVER SIGNAL XATOSI",
                data.message || data.error || data
              );

              setRinging(false);
            } else {
              console.log("Noma'lum signal turi:", data);
            }
          } catch (error) {
            showDiagnostic("SIGNAL XABARINI QAYTA ISHLASH XATOSI", error, {
              kelganXabar: String(event.data).slice(0, 2000),
            });
          }
        };

        // --------------------------------------------
        // 10.12 WEBSOCKET XATOSI
        // --------------------------------------------

        localWS.onerror = (event) => {
          console.error("WebSocket onerror:", event);

          showDiagnostic(
            "WEBSOCKET XATOSI",
            "Signal serveriga ulanishda xatolik yuz berdi",
            {
              socketUrl,
              readyState: localWS?.readyState,
              izoh:
                "Backend, ngrok URL, routing va WebSocket protokolini tekshiring.",
            }
          );

          setRinging(false);
        };

        // --------------------------------------------
        // 10.13 WEBSOCKET YOPILDI
        // --------------------------------------------

        localWS.onclose = (event) => {
          console.warn("WebSocket yopildi:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          if (active && !endingRef.current) {
            showDiagnostic(
              "WEBSOCKET YOPILDI",
              event.reason || "Server bilan aloqa uzildi",
              {
                closeCode: event.code,
                closeReason: event.reason,
                wasClean: event.wasClean,
                socketUrl,
              }
            );

            setRinging(false);
          }
        };
      } catch (error) {
        console.error("Qo'ng'iroqni boshlash xatosi:", error);

        showDiagnostic("QO'NG'IROQNI BOSHLASH XATOSI", error, {
          kameraVaMikrofon:
            "Android kamera/mikrofon ruxsatlarini tekshiring.",
          socketUrl,
        });

        setRinging(false);

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          localStream = null;
        }
      }
    };

    startCall();

    // ==================================================
    // 10.14 KOMPONENT YOPILGANDA TOZALASH
    // ==================================================

    return () => {
      active = false;
      startedRef.current = false;

      if (localWS) {
        localWS.onopen = null;
        localWS.onmessage = null;
        localWS.onerror = null;
        localWS.onclose = null;

        try {
          localWS.close();
        } catch {}
      }

      if (localPC) {
        localPC.ontrack = null;
        localPC.onicecandidate = null;
        localPC.onconnectionstatechange = null;
        localPC.oniceconnectionstatechange = null;

        try {
          localPC.close();
        } catch {}
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      }

      localStreamRef.current = null;
      remoteStreamRef.current = null;
      wsRef.current = null;
      pcRef.current = null;

      pendingCandidatesRef.current = [];
    };
  }, [
    callRoom,
    roomIsValid,
    isCaller,
    socketUrl,
    rawRoomName,
    roomParam,
    rawIsCaller,
    showDiagnostic,
    sendSignal,
    releaseMediaAndPeer,
  ]);

  // ======================================================
  // 11. JIRINGLASH OVOZI
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    const controlRingtone = async () => {
      try {
        ringtonePlayer.loop = true;

        if (ringing && !connected) {
          if (!cancelled) {
            await ringtonePlayer.play();
          }
        } else {
          ringtonePlayer.pause();
          await ringtonePlayer.seekTo(0);
        }
      } catch (error) {
        console.warn(
          "Jiringlash ovozi ishga tushmadi:",
          getErrorMessage(error)
        );
      }
    };

    controlRingtone();

    return () => {
      cancelled = true;
    };
  }, [ringing, connected, ringtonePlayer]);

  useEffect(() => {
    return () => {
      try {
        ringtonePlayer.pause();
      } catch {}
    };
  }, [ringtonePlayer]);

  // ======================================================
  // 12. MIKROFONNI YOQISH/O'CHIRISH
  // ======================================================

  const toggleMic = () => {
    const next = !micEnabled;

    localStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = next;
      });

    setMicEnabled(next);

    console.log("Mikrofon:", next ? "yoqildi" : "o'chirildi");
  };

  // ======================================================
  // 13. KAMERANI YOQISH/O'CHIRISH
  // ======================================================

  const toggleCamera = () => {
    const next = !cameraEnabled;

    localStreamRef.current
      ?.getVideoTracks()
      .forEach((track) => {
        track.enabled = next;
      });

    setCameraEnabled(next);

    console.log("Kamera:", next ? "yoqildi" : "o'chirildi");
  };

  // ======================================================
  // 14. OLD / ORQA KAMERANI ALMASHTIRISH
  // ======================================================

  const switchCamera = () => {
    const track =
      localStreamRef.current?.getVideoTracks?.()[0];

    if (track && typeof track._switchCamera === "function") {
      try {
        track._switchCamera();

        setStatus("Kamera almashtirildi.");
      } catch (error) {
        showDiagnostic("KAMERANI ALMASHTIRISH XATOSI", error);
      }
    } else {
      setStatus(
        "Bu qurilmada kamerani almashtirish qo'llab-quvvatlanmaydi."
      );
    }
  };

  // ======================================================
  // 15. QO'NG'IROQNI TUGATISH
  // ======================================================

  const hangUp = () => {
    if (endingRef.current) {
      router.back();
      return;
    }

    endingRef.current = true;

    setRinging(false);
    setStatus("Qo'ng'iroq tugatilmoqda...");

    // Avval signal yuboriladi, keyin WebSocket yopiladi.
    sendSignal({
      type: "hangup",
      roomName: callRoom,
    });

    try {
      ringtonePlayer.pause();
    } catch {}

    try {
      wsRef.current?.close();
    } catch (error) {
      console.warn("WebSocket yopish xatosi:", error);
    }

    releaseMediaAndPeer();

    wsRef.current = null;

    console.log("Qo'ng'iroq tugatildi.");

    router.back();
  };

  // ======================================================
  // 16. EKRAN
  // ======================================================

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={hangUp}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Text style={styles.title}>
            Instadew qo'ng'iroq
          </Text>

          <Text style={styles.status} selectable>
            {connected ? "● " : ""}
            {status}
          </Text>

          <Text style={styles.roomLabel}>
            Xona: {callRoom || "(bo'sh)"}
          </Text>
        </View>
      </View>

      {/* VIDEO */}
      <View style={styles.videoArea}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.waiting}>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />

            <Text style={styles.waitingText}>
              {status}
            </Text>

            {ringing && (
              <Text style={styles.ringingText}>
                ♫ Jiringlayapti...
              </Text>
            )}
          </View>
        )}

        {localStream && (
          <View style={styles.localVideoContainer}>
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror
            />
          </View>
        )}
      </View>

      {/* QO'NG'IROQ BOSHQARUVLARI */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={toggleMic}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          {micEnabled ? (
            <Mic color="#FFFFFF" size={24} />
          ) : (
            <MicOff color="#FF5555" size={24} />
          )}

          <Text style={styles.controlText}>
            {micEnabled ? "Mikrofon" : "Ovoz o'chiq"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleCamera}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          {cameraEnabled ? (
            <Video color="#FFFFFF" size={24} />
          ) : (
            <VideoOff color="#FF5555" size={24} />
          )}

          <Text style={styles.controlText}>
            {cameraEnabled ? "Kamera" : "Kamera o'chiq"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={switchCamera}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          <RefreshCw color="#FFFFFF" size={23} />

          <Text style={styles.controlText}>
            Almashtirish
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={hangUp}
          style={styles.hangupButton}
          activeOpacity={0.7}
        >
          <PhoneOff color="#FFFFFF" size={26} />
        </TouchableOpacity>
      </View>

      {/* BATAFSIL XATOLIK MA'LUMOTLARI */}
      {!!debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>
            Diagnostika ma'lumotlari
          </Text>

          <ScrollView
            style={styles.debugScroll}
            nestedScrollEnabled
          >
            <Text
              selectable
              style={styles.debugText}
            >
              {debugInfo}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ======================================================
// 17. STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },

  statusContainer: {
    flex: 1,
    marginLeft: 8,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
  },

  status: {
    color: "#BBBBBB",
    fontSize: 12,
    marginTop: 4,
  },

  roomLabel: {
    color: "#A7F3D0",
    fontSize: 11,
    marginTop: 4,
  },

  videoArea: {
    flex: 1,
    margin: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#181818",
  },

  remoteVideo: {
    width: "100%",
    height: "100%",
  },

  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  waitingText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 16,
  },

  ringingText: {
    color: "#A7F3D0",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },

  localVideoContainer: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#777777",
  },

  localVideo: {
    flex: 1,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 6,
    paddingVertical: 24,
    paddingBottom: 32,
  },

  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    gap: 8,
  },

  controlText: {
    color: "#FFFFFF",
    fontSize: 10,
    textAlign: "center",
  },

  hangupButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },

  debugContainer: {
    maxHeight: 220,
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#211919",
    borderWidth: 1,
    borderColor: "#7F3333",
  },

  debugTitle: {
    color: "#FF7777",
    fontWeight: "700",
    marginBottom: 8,
  },

  debugScroll: {
    maxHeight: 175,
  },

  debugText: {
    color: "#F2F2F2",
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "monospace",
  },
});