import React from "react";
import { ScrollView, TouchableOpacity, Text } from "react-native";
import { CATEGORIES } from "../utils/categoryFilter";
import { styles } from "../constants/styles";

// ════════════════════════════════════════════════════════════════════════════
//  CategoryTabs — Telegramdagi "All / Unread / Channels / Bots / Groups"
//  qatoriga o'xshash gorizontal tab'lar.
//
//  ✏️ Bu yerni o'zgartirmoqchi bo'lsangiz:
//   - Tab nomlari/tartibi     -> utils/categoryFilter.js dagi CATEGORIES massivi
//   - Qaysi user qaysi tabga tushishi -> utils/categoryFilter.js dagi
//     getUserKind() / filterByCategory() funksiyalari
//   - Faqat vizual (rang, o'lcham) -> shu fayl + constants/styles.js
//     (categoryTabsRow / categoryTab / categoryTabText)
// ════════════════════════════════════════════════════════════════════════════

export default function CategoryTabs({ selected, onSelect, theme }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsRow}
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => onSelect(cat.key)}
            style={[
              styles.categoryTab,
              { borderColor: theme.border, backgroundColor: active ? theme.accent : theme.card },
            ]}
          >
            <Text style={[styles.categoryTabText, { color: active ? "#fff" : theme.sub }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}