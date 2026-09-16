import React from "react";
import { TouchableOpacity } from "react-native";
import { IconTrash } from "../constants/icons";
import { styles } from "../constants/styles";

export default function MediaDeleteButton({ onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Delete media message"
      style={[styles.mediaDeleteBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <IconTrash size={13} color="#EF4444" />
    </TouchableOpacity>
  );
}