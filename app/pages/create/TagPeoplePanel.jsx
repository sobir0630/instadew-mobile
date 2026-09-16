import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { searchUsers } from "./PostApi";
import { styles } from "./CreatePostStyles";
import { IconCheck, IconClose, IconSearch } from "./Icons";

// ════════════════════════════════════════════════════════════════════════════
//  TAG PEOPLE PANEL
// ════════════════════════════════════════════════════════════════════════════

export function TagPeoplePanel({ visible, tagged, onAdd, onRemove, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchUsers(val);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const isTagged = (u) => tagged.some((t) => String(t.id) === String(u.id));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Tag People</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <IconClose />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetSearchWrap}>
            <View style={styles.sheetSearchBar}>
              <IconSearch />
              <TextInput
                value={query}
                onChangeText={handleInput}
                placeholder="Username qidirish…"
                placeholderTextColor="#8c959f"
                autoFocus
                style={styles.sheetSearchInput}
              />
              {searching ? <ActivityIndicator size="small" color="#8c959f" /> : null}
            </View>
          </View>

          {tagged.length > 0 ? (
            <View style={styles.taggedChipsWrap}>
              {tagged.map((u) => (
                <View key={u.id} style={styles.taggedChip}>
                  <View style={styles.taggedChipAvatar}>
                    <Text style={styles.taggedChipAvatarText}>
                      {(u.username || u.full_name || "U")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.taggedChipText}>@{u.username || u.full_name}</Text>
                  <TouchableOpacity onPress={() => onRemove(u)} style={{ marginLeft: 2 }}>
                    <IconClose size={12} color="#0550ae" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <ScrollView style={{ flex: 1 }}>
            {results.length === 0 && query.trim() && !searching ? (
              <View style={styles.sheetEmptyWrap}>
                <Text style={styles.sheetEmptyText}>"{query}" topilmadi</Text>
              </View>
            ) : null}
            {!query.trim() && tagged.length === 0 ? (
              <View style={styles.sheetEmptyWrap}>
                <Text style={styles.sheetEmptyText}>Username yozing…</Text>
              </View>
            ) : null}
            {results.map((u, i) => {
              const already = isTagged(u);
              return (
                <TouchableOpacity
                  key={u.id || i}
                  onPress={() => (already ? onRemove(u) : onAdd(u))}
                  style={styles.userRow}
                >
                  <View style={styles.userRowAvatar}>
                    <Text style={styles.userRowAvatarText}>
                      {(u.username || u.full_name || "U")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userRowUsername}>@{u.username}</Text>
                    {u.full_name ? <Text style={styles.userRowFullname}>{u.full_name}</Text> : null}
                  </View>
                  <View style={[styles.checkCircle, already && styles.checkCircleActive]}>
                    {already ? <IconCheck /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity onPress={onClose} style={styles.sheetDoneBtnBlue}>
              <Text style={styles.sheetDoneBtnText}>
                Done {tagged.length > 0 ? `(${tagged.length} kishi)` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}