import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./CreatePostStyles";
import { IconChevronRight } from "./Icons";

// ════════════════════════════════════════════════════════════════════════════
//  OPTION ROW
// ════════════════════════════════════════════════════════════════════════════

export function OptionRow({ icon, label, value, color = "#0969da", onPress, badge }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.optionRow} activeOpacity={0.7}>
      <View style={[styles.optionIconWrap, { backgroundColor: `${color}14`, borderColor: `${color}33` }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {value ? (
          <Text style={[styles.optionValue, { color }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.optionBadge, { backgroundColor: color }]}>
          <Text style={styles.optionBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <IconChevronRight />
    </TouchableOpacity>
  );
}