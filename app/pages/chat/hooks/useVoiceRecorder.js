import { useCallback } from "react";
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { ensureMicPermission } from "../utils/permissions";

export function useVoiceRecorder() {
  // Recorder faqat hookning yuqori qismida yaratiladi
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Recorder holatini kuzatamiz
  const recorderState = useAudioRecorderState(recorder, 50);

  // =========================
  // START
  // =========================
  const start = useCallback(async () => {
    try {
      // Agar allaqachon yozayotgan bo'lsa, yana start qilmaymiz
      if (recorderState.isRecording) {
        console.log("[voice-recorder] already recording");
        return false;
      }

      // Microphone permission
      const ok = await ensureMicPermission();

      if (!ok) {
        console.log("[voice-recorder] microphone permission denied");
        return false;
      }

      // Audio mode
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Recorder tayyorlash
      await recorder.prepareToRecordAsync({
        ...RecordingPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      // Recording boshlash
      recorder.record();

      console.log("[voice-recorder] recording started");

      return true;
    } catch (err) {
      console.error("[voice-recorder] start error:", err);

      return false;
    }
  }, [
    recorder,
    recorderState.isRecording,
  ]);

  // =========================
  // STOP
  // =========================
  const stop = useCallback(async () => {
    try {
      // Muhim:
      // getStatus() hook emas.
      // Uni bu yerda bemalol chaqirish mumkin.
      const state = recorder.getStatus();

      console.log("[voice-recorder] STOP STATE:", {
        isRecording: state?.isRecording,
        canRecord: state?.canRecord,
        durationMillis: state?.durationMillis,
        metering: state?.metering,
        url: state?.url,
      });

      // Recording bo'lmasa stop qilmaymiz
      if (!state?.isRecording) {
        console.log("[voice-recorder] nothing to stop");
        return null;
      }

      // Juda tez stop bosilgan bo'lsa
      const duration = state.durationMillis || 0;

      if (duration < 300) {
        console.log(
          "[voice-recorder] recording too short:",
          duration
        );

        try {
          await recorder.stop();
        } catch (stopErr) {
          console.log(
            "[voice-recorder] short recording stop ignored:",
            stopErr
          );
        }

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        return null;
      }

      // Recordingni to'xtatamiz
      await recorder.stop();

      // Stopdan KEYIN uri olinadi
      const uri = recorder.uri;

      console.log("[voice-recorder] recording stopped:", {
        uri,
        duration,
      });

      // Audio mode qaytariladi
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (!uri) {
        console.error("[voice-recorder] URI not found");
        return null;
      }

      return {
        uri,
        duration,
      };
    } catch (err) {
      console.error("[voice-recorder] stop error:", err);

      // Xatodan keyin audio mode'ni tiklashga harakat qilamiz
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
      } catch {}

      return null;
    }
  }, [recorder]);

  // =========================
  // CANCEL
  // =========================
  const cancel = useCallback(async () => {
    try {
      const state = recorder.getStatus();

      if (state?.isRecording) {
        await recorder.stop();
      }
    } catch (err) {
      console.log(
        "[voice-recorder] cancel stop ignored:",
        err
      );
    }

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (err) {
      console.log(
        "[voice-recorder] cancel audio mode error:",
        err
      );
    }
  }, [recorder]);

  // =========================
  // RETURN
  // =========================
  return {
    isRecording: recorderState.isRecording,

    durationMs: recorderState.durationMillis || 0,

    metering: recorderState.metering ?? -60,

    start,
    stop,
    cancel,
  };
}