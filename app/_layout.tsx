import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* sizdagi hozirgi navigation/router */}
      <SafeAreaView style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 4,
    backgroundColor: "#000",
  },
});