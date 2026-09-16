import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SUGGESTED_TAGS } from "./PostConstants";
import { styles } from "./CreatePostStyles";
import { IconClose } from "./Icons";

// ════════════════════════════════════════════════════════════════════════════
//  HASHTAGS PANEL
// ════════════════════════════════════════════════════════════════════════════

export function HashtagsPanel({ visible, tags, onAdd, onRemove, onClose }) {
  const [input, setInput] = useState("");

  const addTag = (tag) => {
    const clean = tag.replace(/^#+/, "").trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    onAdd(clean);
    setInput("");
  };

  const handleSubmit = () => {
    if (input.trim()) addTag(input);
  };

  const suggested = SUGGESTED_TAGS.filter(
    (t) => !tags.includes(t) && t.includes(input.toLowerCase().replace(/^#+/, ""))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <KeyboardAvoidingView
          style={[styles.sheetCard, { maxHeight: "70%" }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Teglar</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <IconClose />
            </TouchableOpacity>
          </View>

          <View style={styles.hashtagInputWrap}>
            <View style={styles.hashtagInputBox}>
              {tags.map((tag) => (
                <View key={tag} style={styles.hashtagChip}>
                  <Text style={styles.hashtagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => onRemove(tag)}>
                    <IconClose size={11} color="#6f42c1" />
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                placeholder={tags.length === 0 ? "#travel, #nature..." : ""}
                placeholderTextColor="#8c959f"
                autoFocus
                style={styles.hashtagTextInput}
              />
            </View>
            <Text style={styles.hashtagHelpText}>Enter bosib qo'shing</Text>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={styles.suggestionsLabel}>Tavsiyalar</Text>
            <View style={styles.suggestionsWrap}>
              {suggested.slice(0, 12).map((tag) => (
                <TouchableOpacity key={tag} onPress={() => addTag(tag)} style={styles.suggestionChip}>
                  <Text style={styles.suggestionChipText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity onPress={onClose} style={styles.sheetDoneBtnPurple}>
              <Text style={styles.sheetDoneBtnText}>
                Tayyor {tags.length > 0 ? `(${tags.length} teg)` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}