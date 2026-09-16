import React from "react";
import { SafeAreaView, Text } from "react-native";

export default class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[ChatScreen] Uncaught render error:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F3F5FC" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#111827" }}>Nimadir xato ketdi</Text>
          <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>
            Chat ekranida kutilmagan xatolik yuz berdi. Iltimos ilovani qayta oching.
          </Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}