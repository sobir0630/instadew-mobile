import { useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { POPULAR_LOCATIONS } from "./PostConstants";
import { styles } from "./CreatePostStyles";
import { IconCheck, IconClose, IconLocation, IconPlus, IconTrash } from "./Icons";

// ════════════════════════════════════════════════════════════════════════════
//  LOCATION PANEL
// ════════════════════════════════════════════════════════════════════════════

export function LocationPanel({ visible, value, onChange, onClose }) {
  const [query, setQuery] = useState(value);
  const filtered = POPULAR_LOCATIONS.filter((l) => l.toLowerCase().includes(query.toLowerCase()));
  const select = (loc) => { onChange(loc); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetCard, { maxHeight: "65%" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Joylashuv</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <IconClose />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetSearchWrap}>
            <View style={styles.sheetSearchBar}>
              <IconLocation />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Joylashuvni kiriting…"
                placeholderTextColor="#8c959f"
                autoFocus
                style={styles.sheetSearchInput}
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <IconClose size={13} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {query.trim() && !filtered.find((l) => l.toLowerCase() === query.toLowerCase()) ? (
              <TouchableOpacity onPress={() => select(query)} style={styles.locationRow}>
                <View style={[styles.locationIconWrap, { backgroundColor: "#f0fdf4" }]}>
                  <IconPlus />
                </View>
                <Text style={styles.locationAddText}>"{query}" qo'shish</Text>
              </TouchableOpacity>
            ) : null}

            {(query ? filtered : POPULAR_LOCATIONS).map((loc, i) => {
              const isSelected = value === loc;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => select(loc)}
                  style={[styles.locationRow, isSelected && { backgroundColor: "#f0f9ff" }]}
                >
                  <View style={[styles.locationIconWrap, isSelected && { backgroundColor: "#dbeafe" }]}>
                    <IconLocation color={isSelected ? "#0969da" : "#8c959f"} />
                  </View>
                  <Text style={[styles.locationText, isSelected && styles.locationTextActive]}>{loc}</Text>
                  {isSelected ? <IconCheck size={16} color="#0969da" /> : null}
                </TouchableOpacity>
              );
            })}

            {value ? (
              <TouchableOpacity
                onPress={() => { onChange(""); onClose(); }}
                style={[styles.locationRow, { borderTopWidth: 1, borderTopColor: "#f0f2f4" }]}
              >
                <View style={[styles.locationIconWrap, { backgroundColor: "#fff1f0" }]}>
                  <IconTrash />
                </View>
                <Text style={styles.locationRemoveText}>Joylashuvni olib tashlash</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}