import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import MusicPlayerModal from "../components/chat/media/MusicPlayerModal";
import { MusicPlayerProvider, useMusicPlayer } from "../hooks/chat/useMusicPlayer";

const appTheme = {
  background: "#0b0d12",
  surface: "#121722",
  card: "#1b2230",
  accent: "#7c5cff",
  border: "#2a3242",
  text: "#f3f6ff",
  sub: "#b4bdd4",
};

function MusicPlayerGlobalWrapper() {
  const musicPlayer = useMusicPlayer();
  const hasQueue = (musicPlayer?.queue?.length ?? 0) > 0;
  const isActive = !!musicPlayer?.current || !!musicPlayer?.isPlaying || hasQueue;

  console.log("[Layout] music player state", {
    isActive,
    hasQueue,
    isPlaying: musicPlayer?.isPlaying,
    current: musicPlayer?.current
      ? {
          title: musicPlayer.current.title,
          artist: musicPlayer.current.artist,
          uri: musicPlayer.current.uri,
        }
      : null,
  });

  if (!isActive) return null;

  return (
    <MusicPlayerModal
      visible={isActive}
      onClose={() => musicPlayer?.stopAndClear?.()}
      theme={appTheme}
      player={musicPlayer}
    />
  );
}

export default function Layout() {
  return (
    <MusicPlayerProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.root}>
          <View style={styles.screenLayer}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>

          <MusicPlayerGlobalWrapper />
        </SafeAreaView>
      </GestureHandlerRootView>
    </MusicPlayerProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  screenLayer: {
    flex: 1,
  },
});