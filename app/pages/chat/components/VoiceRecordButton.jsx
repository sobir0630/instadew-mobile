import React, { useRef } from "react";
import { Animated, PanResponder, View } from "react-native";
import { IconMic } from "../constants/icons";
import { VOICE_CANCEL_DRAG_PX } from "../constants/config";
import { styles } from "../constants/styles";

export default function VoiceRecordButton({ recorder, onRecorded, theme }) {
  const dragX = useRef(new Animated.Value(0)).current;
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);

  const resetDrag = () => {
    Animated.timing(dragX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cancelledRef.current = false;
        startedRef.current = true;
        dragX.setValue(0);
        recorder.start();
      },
      onPanResponderMove: (evt, gesture) => {
        if (!startedRef.current) return;
        if (gesture.dx < 0) {
          dragX.setValue(Math.max(gesture.dx, -140));
          cancelledRef.current = gesture.dx < -VOICE_CANCEL_DRAG_PX;
        } else {
          dragX.setValue(0);
          cancelledRef.current = false;
        }
      },
      onPanResponderRelease: async () => {
        if (!startedRef.current) return;
        startedRef.current = false;
        resetDrag();
        if (cancelledRef.current) { await recorder.cancel(); return; }
        const result = await recorder.stop();
        if (result?.uri && result.duration >= 700) onRecorded(result);
      },
      onPanResponderTerminate: async () => {
        if (!startedRef.current) return;
        startedRef.current = false;
        resetDrag();
        await recorder.cancel();
      },
    })
  ).current;

  return (
    <Animated.View style={{ transform: [{ translateX: dragX }] }} {...panResponder.panHandlers}>
      <View style={[styles.sendBtn, { backgroundColor: theme.accent }]}>
        <IconMic />
      </View>
    </Animated.View>
  );
}