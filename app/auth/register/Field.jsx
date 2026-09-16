import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { IconWarning } from "./Icons";
import { styles } from "./Registerstyles";

// ════════════════════════════════════════════════════════════════════════════
//  INPUT FIELD
// ════════════════════════════════════════════════════════════════════════════

export function Field({
  label,
  secureTextEntry = false,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  rightEl,
  keyboardType = "default",
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "rgba(248,113,113,0.7)"
    : focused
    ? "rgba(255,255,255,0.45)"
    : "rgba(255,255,255,0.18)";

  const bgColor = focused
    ? "rgba(255,255,255,0.12)"
    : "rgba(255,255,255,0.07)";

  const iconColor = error
    ? "rgba(248,113,113,0.9)"
    : focused
    ? "rgba(255,255,255,0.9)"
    : "rgba(255,255,255,0.45)";

  return (
    <View style={{ gap: 7 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor }]}>
        {icon && (
          <View style={{ marginRight: 10 }}>
            {icon(iconColor)}
          </View>
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightEl}
      </View>
      {error ? (
        <View style={styles.fieldErrorRow}>
          <IconWarning size={11} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}