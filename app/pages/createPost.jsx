import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import API from "../api/server";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from "react-native-svg";

// ════════════════════════════════════════════════════════════════════════════
//  API HELPERS
// ════════════════════════════════════════════════════════════════════════════

async function getToken() {
  return await AsyncStorage.getItem("token");
}

async function searchUsers(query) {
  if (!query.trim()) return [];
  const token = await getToken();
  const res = await API.get(`/users/register/?search=${query}`, {
    headers: { Authorization: `Bearer ${token?.trim()}` },
  });
  const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
  return data.slice(0, 8);
}

// ════════════════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════════════════

const IconClose = ({ size = 18, color = "#57606a" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconSearch = ({ size = 15, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);
const IconCheck = ({ size = 12, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IconLocation = ({ size = 15, color = "#8c959f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);
const IconPlus = ({ size = 16, color = "#2da44e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
const IconTrash = ({ size = 15, color = "#cf222e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
);
const IconCommentOff = ({ size = 18, color = "#cf222e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <Line x1="9" y1="10" x2="15" y2="10" strokeDasharray="2 2" />
  </Svg>
);
const IconHeartOff = ({ size = 18, color = "#e36209" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    <Line x1="4" y1="4" x2="20" y2="20" />
  </Svg>
);
const IconChevronRight = ({ size = 16, color = "#c8cdd4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
const IconTagUser = ({ size = 18, color = "#0969da" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" />
    <Line x1="19" y1="8" x2="19" y2="14" /><Line x1="22" y1="11" x2="16" y2="11" />
  </Svg>
);
const IconHashtag = ({ size = 18, color = "#8250df" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Line x1="4" y1="9" x2="20" y2="9" /><Line x1="4" y1="15" x2="20" y2="15" />
    <Line x1="10" y1="3" x2="8" y2="21" /><Line x1="16" y1="3" x2="14" y2="21" />
  </Svg>
);
const IconBack = ({ size = 18, color = "#24292f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconPhotoPlaceholder = ({ size = 32, color = "#9ca3af" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Rect x="3" y="3" width="18" height="18" rx="3" /><Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconVideoPlaceholder = ({ size = 32, color = "#9ca3af" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconUpload = ({ size = 16, color = "#1a1d23" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" /><Line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);
const IconAlert = ({ size = 16, color = "#cf222e" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="10" /><Line x1="12" y1="8" x2="12" y2="12" /><Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);
const IconPhotoIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="3" y="3" width="18" height="18" rx="3" /><Circle cx="8.5" cy="8.5" r="1.5" />
    <Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconVideoIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polygon points="23 7 16 12 23 17 23 7" /><Rect x="1" y="5" width="15" height="14" rx="2" />
  </Svg>
);
const IconCaptionEmoji = ({ size = 20, color = "#9ca3af" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <Line x1="9" y1="9" x2="9.01" y2="9" /><Line x1="15" y1="9" x2="15.01" y2="9" />
  </Svg>
);
const IconCheckmarkBig = ({ size = 20, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  TAG PEOPLE PANEL
// ════════════════════════════════════════════════════════════════════════════

function TagPeoplePanel({ visible, tagged, onAdd, onRemove, onClose }) {
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

// ════════════════════════════════════════════════════════════════════════════
//  LOCATION PANEL
// ════════════════════════════════════════════════════════════════════════════

const POPULAR_LOCATIONS = [
  "Toshkent, O'zbekiston", "Samarqand, O'zbekiston", "Buxoro, O'zbekiston",
  "Namangan, O'zbekiston", "Andijon, O'zbekiston", "Farg'ona, O'zbekiston",
  "Nukus, O'zbekiston", "Qarshi, O'zbekiston",
];

function LocationPanel({ visible, value, onChange, onClose }) {
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

// ════════════════════════════════════════════════════════════════════════════
//  HASHTAGS PANEL
// ════════════════════════════════════════════════════════════════════════════

const SUGGESTED_TAGS = ["travel", "nature", "photography", "food", "lifestyle", "fashion", "art", "music", "sport", "tech", "uzbekistan", "tashkent", "beauty", "fitness", "motivation"];

function HashtagsPanel({ visible, tags, onAdd, onRemove, onClose }) {
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

// ════════════════════════════════════════════════════════════════════════════
//  ADVANCED SETTINGS PANEL
// ════════════════════════════════════════════════════════════════════════════

function AdvancedPanel({ visible, settings, onChange, onClose }) {
  const toggle = (key) => onChange({ ...settings, [key]: !settings[key] });
  const items = [
    {
      key: "comments_off",
      label: "Kommentlarni o'chirish",
      desc: "Bu postga hech kim komment yoza olmaydi",
      color: "#cf222e",
      Icon: IconCommentOff,
    },
    {
      key: "hide_likes",
      label: "Like sonini yashirish",
      desc: "Boshqalar like sonini ko'ra olmaydi",
      color: "#e36209",
      Icon: IconHeartOff,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Qo'shimcha sozlamalar</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <IconClose />
            </TouchableOpacity>
          </View>

          {items.map((item, i) => (
            <View key={item.key}>
              <TouchableOpacity onPress={() => toggle(item.key)} style={styles.advancedRow}>
                <View style={[styles.advancedIconWrap, { backgroundColor: `${item.color}1A` }]}>
                  <item.Icon color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.advancedLabel}>{item.label}</Text>
                  <Text style={styles.advancedDesc}>{item.desc}</Text>
                </View>
                <View
                  style={[
                    styles.toggleTrack,
                    { backgroundColor: settings[item.key] ? item.color : "#d0d7de" },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      { left: settings[item.key] ? 22 : 2 },
                    ]}
                  />
                </View>
              </TouchableOpacity>
              {i < items.length - 1 ? <View style={styles.advancedDivider} /> : null}
            </View>
          ))}

          <View style={{ padding: 16, paddingBottom: 24 }}>
            <TouchableOpacity onPress={onClose} style={styles.sheetDoneBtnOutline}>
              <Text style={styles.sheetDoneBtnOutlineText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  OPTION ROW
// ════════════════════════════════════════════════════════════════════════════

function OptionRow({ icon, label, value, color = "#0969da", onPress, badge }) {
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

// ════════════════════════════════════════════════════════════════════════════
//  MAIN — CREATE POST SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function CreatePostScreen() {
  const router = useRouter();

  const [mediaType, setMediaType] = useState("photo"); // "photo" | "video"
  const [mediaUri, setMediaUri] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [advanced, setAdvanced] = useState({ comments_off: false, hide_likes: false });

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const [showTagPanel, setShowTagPanel] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [showHashtagPanel, setShowHashtagPanel] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);

  const MAX_CAP = 2200;

  const removeMedia = () => setMediaUri(null);

  const switchMediaType = (type) => {
    if (type === mediaType) return;
    setMediaType(type);
    removeMedia();
    setError("");
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Galereyaga ruxsat kerak.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mediaType === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: mediaType === "photo",
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      setMediaUri(result.assets[0].uri);
      setError("");
    }
  };

  const addTaggedUser = (u) => {
    if (!taggedUsers.find((t) => String(t.id) === String(u.id))) {
      setTaggedUsers((prev) => [...prev, u]);
    }
  };
  const removeTaggedUser = (u) => setTaggedUsers((prev) => prev.filter((t) => String(t.id) !== String(u.id)));
  const addHashtag = (tag) => setHashtags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  const removeHashtag = (tag) => setHashtags((prev) => prev.filter((t) => t !== tag));

  const handlePublish = async () => {
    if (!mediaUri) {
      setError(mediaType === "video" ? "Iltimos, video tanlang." : "Iltimos, rasm tanlang.");
      return;
    }
    if (!caption.trim()) {
      setError("Iltimos, caption yozing.");
      return;
    }

    const token = await getToken();
    setPublishing(true);
    setError("");

    try {
      const filename = mediaUri.split("/").pop() || `upload.${mediaType === "video" ? "mp4" : "jpg"}`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : mediaType === "video" ? "mp4" : "jpg";
      const mimeType = mediaType === "video" ? `video/${ext}` : `image/${ext}`;

      if (mediaType === "video") {
        const fd = new FormData();
        fd.append("video", { uri: mediaUri, name: filename, type: mimeType });
        fd.append("caption", caption.trim());
        if (location) fd.append("location", location);
        if (hashtags.length) fd.append("tags", hashtags.join(","));

        const res = await API.post("/videos/videos/", fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        console.log("VIDEO SUCCESS:", res.data);
      } else {
        const fd = new FormData();
        fd.append("picture", { uri: mediaUri, name: filename, type: mimeType });
        fd.append("caption", caption.trim());
        if (location) fd.append("location", location);
        if (hashtags.length) fd.append("tags", hashtags.join(","));
        if (taggedUsers.length) fd.append("tagged_users", JSON.stringify(taggedUsers.map((u) => u.id)));

        const res = await API.post("/posts/post/", fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        console.log("PHOTO SUCCESS:", res.data);
      }

      setPublished(true);
      setTimeout(() => router.push("/pages/home"), 1200);
    } catch (err) {
      console.log("Upload error:", err?.response?.data || err.message);
      const d = err?.response?.data;
      const msg =
        d?.detail ||
        d?.picture?.[0] ||
        d?.video?.[0] ||
        d?.caption?.[0] ||
        (typeof d === "string" ? d : null) ||
        "Error loading. Try again.";
      setError(msg);
    } finally {
      setPublishing(false);
    }
  };

  const canPublish = mediaUri && caption.trim() && !publishing;

  return (
    <SafeAreaView style={styles.screen}>
      <TagPeoplePanel
        visible={showTagPanel}
        tagged={taggedUsers}
        onAdd={addTaggedUser}
        onRemove={removeTaggedUser}
        onClose={() => setShowTagPanel(false)}
      />
      <LocationPanel
        visible={showLocationPanel}
        value={location}
        onChange={setLocation}
        onClose={() => setShowLocationPanel(false)}
      />
      <HashtagsPanel
        visible={showHashtagPanel}
        tags={hashtags}
        onAdd={addHashtag}
        onRemove={removeHashtag}
        onClose={() => setShowHashtagPanel(false)}
      />
      <AdvancedPanel
        visible={showAdvancedPanel}
        settings={advanced}
        onChange={setAdvanced}
        onClose={() => setShowAdvancedPanel(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/pages/home")} style={styles.backBtn}>
          <IconBack />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={!canPublish}
          style={[styles.headerPublishBtn, { backgroundColor: canPublish ? "#0969da" : "#e8eaed" }]}
        >
          {publishing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.headerPublishText, { color: "#fff" }]}>Loading…</Text>
            </View>
          ) : (
            <Text style={[styles.headerPublishText, { color: canPublish ? "#fff" : "#9ca3af" }]}>
              {published ? "✓ Done" : "Sharing"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <IconAlert />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError("")}>
                <IconClose size={14} color="#cf222e" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Photo/Video toggle */}
          <View style={styles.mediaToggleWrap}>
            {[
              { type: "photo", label: "Photo", Icon: IconPhotoIcon, activeColor: ["#0969da", "#6366f1"] },
              { type: "video", label: "Video", Icon: IconVideoIcon, activeColor: ["#7c3aed", "#6366f1"] },
            ].map(({ type, label, Icon }) => {
              const active = mediaType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => switchMediaType(type)}
                  style={[
                    styles.mediaToggleBtn,
                    active && { backgroundColor: type === "video" ? "#7c3aed" : "#0969da" },
                  ]}
                >
                  <Icon size={16} color={active ? "#fff" : "#8c959f"} />
                  <Text style={[styles.mediaToggleText, active && { color: "#fff" }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Upload zone */}
          <View style={{ marginBottom: 16 }}>
            {!mediaUri ? (
              <TouchableOpacity onPress={pickMedia} style={styles.uploadZone} activeOpacity={0.8}>
                <View style={styles.uploadIconCircle}>
                  {mediaType === "video" ? <IconVideoPlaceholder /> : <IconPhotoPlaceholder />}
                </View>
                <View style={{ alignItems: "center", paddingHorizontal: 28 }}>
                  <Text style={styles.uploadTitle}>
                    {mediaType === "video" ? "Upload video" : "Upload image"}
                  </Text>
                  <Text style={styles.uploadSubtitle}>
                    {mediaType === "video"
                      ? "Tap to select from gallery\nMP4, MOV — max 100 MB"
                      : "Tap to select from gallery\nJPG, PNG — max 10 MB"}
                  </Text>
                </View>
                <View style={styles.uploadSelectBtn}>
                  <IconUpload />
                  <Text style={styles.uploadSelectText}>
                    {mediaType === "video" ? "Select video" : "Select from device"}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.mediaPreviewWrap}>
                {mediaType === "video" ? (
                  <Video
                    source={{ uri: mediaUri }}
                    style={styles.mediaPreview}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    isLooping
                  />
                ) : (
                  <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
                )}
                <View style={styles.mediaPreviewActions}>
                  <TouchableOpacity onPress={pickMedia} style={styles.mediaActionBtn}>
                    <IconUpload color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={removeMedia} style={[styles.mediaActionBtn, { backgroundColor: "rgba(207,34,46,0.85)" }]}>
                    <IconTrash color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Caption */}
          <View style={styles.captionCard}>
            <Text style={styles.cardLabel}>Caption</Text>
            <TextInput
              value={caption}
              onChangeText={(t) => { setCaption(t.slice(0, MAX_CAP)); setError(""); }}
              placeholder="Caption yozing…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              style={styles.captionInput}
            />
            <View style={styles.captionFooterRow}>
              <IconCaptionEmoji />
              <Text style={[styles.captionCounter, caption.length > MAX_CAP * 0.9 && { color: "#cf222e" }]}>
                {caption.length} / {MAX_CAP}
              </Text>
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsCard}>
            <Text style={styles.optionsCardLabel}>Qo'shimchalar</Text>

            {mediaType === "photo" ? (
              <>
                <OptionRow
                  icon={<IconTagUser />}
                  label="Tag People"
                  value={taggedUsers.length > 0 ? taggedUsers.map((u) => `@${u.username}`).join(", ") : null}
                  color="#0969da"
                  badge={taggedUsers.length > 0 ? String(taggedUsers.length) : null}
                  onPress={() => setShowTagPanel(true)}
                />
                <View style={styles.optionDivider} />
              </>
            ) : null}

            <OptionRow
              icon={<IconLocation color="#2da44e" />}
              label="Location"
              value={location || null}
              color="#2da44e"
              onPress={() => setShowLocationPanel(true)}
            />
            <View style={styles.optionDivider} />

            <OptionRow
              icon={<IconHashtag />}
              label="Tags (Hashtags)"
              value={hashtags.length > 0 ? hashtags.map((t) => `#${t}`).join(" ") : null}
              color="#8250df"
              badge={hashtags.length > 0 ? String(hashtags.length) : null}
              onPress={() => setShowHashtagPanel(true)}
            />
            <View style={styles.optionDivider} />

            <OptionRow
              icon={<IconCommentOff size={18} color="#cf222e" />}
              label="Advanced settings"
              value={
                advanced.comments_off || advanced.hide_likes
                  ? [advanced.comments_off && "Comments off", advanced.hide_likes && "Likes hidden"].filter(Boolean).join(", ")
                  : null
              }
              color="#cf222e"
              onPress={() => setShowAdvancedPanel(true)}
            />
          </View>

          {/* Hashtag preview chips */}
          {hashtags.length > 0 ? (
            <View style={styles.hashtagPreviewWrap}>
              {hashtags.map((tag) => (
                <View key={tag} style={styles.hashtagPreviewChip}>
                  <Text style={styles.hashtagPreviewText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={!canPublish}
          style={[
            styles.footerBtn,
            {
              backgroundColor: canPublish ? (published ? "#2da44e" : "#0969da") : "#e8eaed",
            },
          ]}
        >
          {publishing ? (
            <View style={styles.footerBtnContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.footerBtnText}>Loading...</Text>
            </View>
          ) : published ? (
            <View style={styles.footerBtnContent}>
              <IconCheckmarkBig />
              <Text style={styles.footerBtnText}>Downloaded!</Text>
            </View>
          ) : (
            <Text style={[styles.footerBtnText, { color: canPublish ? "#fff" : "#b0b4be" }]}>Sharing</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerHint}>By sharing, you agree to the Community Rules.</Text>
      </View>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f5f8" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ebebef",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: "#e8eaed", backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23" },
  headerPublishBtn: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 10 },
  headerPublishText: { fontWeight: "700", fontSize: 13 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Error
  errorBanner: {
    backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 12, padding: 12, marginBottom: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  errorText: { fontSize: 13, color: "#cf222e", flex: 1 },

  // Media toggle
  mediaToggleWrap: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e8eaed", padding: 4, marginBottom: 16,
  },
  mediaToggleBtn: {
    flex: 1, height: 40, borderRadius: 10, backgroundColor: "transparent",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  mediaToggleText: { fontWeight: "700", fontSize: 14, color: "#8c959f" },

  // Upload zone
  uploadZone: {
    width: "100%", aspectRatio: 1, borderRadius: 18,
    borderWidth: 2, borderColor: "#d8dae0", borderStyle: "dashed",
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", gap: 16,
  },
  uploadIconCircle: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: "#f4f5f7",
    borderWidth: 1.5, borderColor: "#e2e4e9",
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23", marginBottom: 6 },
  uploadSubtitle: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 19 },
  uploadSelectBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingVertical: 9, paddingHorizontal: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e2e4e9", backgroundColor: "#f9fafb",
  },
  uploadSelectText: { fontSize: 13, fontWeight: "600", color: "#1a1d23" },

  // Media preview
  mediaPreviewWrap: {
    width: "100%", aspectRatio: 1, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "#e2e4e9", position: "relative",
  },
  mediaPreview: { width: "100%", height: "100%" },
  mediaPreviewActions: { position: "absolute", top: 12, right: 12, flexDirection: "row", gap: 8 },
  mediaActionBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(15,20,30,0.65)",
    alignItems: "center", justifyContent: "center",
  },

  // Caption
  captionCard: {
    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e8eaed",
    marginBottom: 12, padding: 16,
  },
  cardLabel: {
    fontSize: 11, fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8,
  },
  captionInput: {
    fontSize: 15, color: "#1a1d23", lineHeight: 22, minHeight: 90,
    textAlignVertical: "top", padding: 0,
  },
  captionFooterRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10,
  },
  captionCounter: { fontSize: 11, color: "#b0b4be", fontWeight: "500" },

  // Options
  optionsCard: {
    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e8eaed",
    marginBottom: 12, overflow: "hidden",
  },
  optionsCardLabel: {
    fontSize: 11, fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.7, padding: 16, paddingBottom: 6,
  },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  optionIconWrap: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  optionLabel: { fontSize: 14, fontWeight: "500", color: "#1a1d23" },
  optionValue: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  optionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  optionBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  optionDivider: { height: 1, backgroundColor: "#f4f5f7", marginHorizontal: 16 },

  // Hashtag preview
  hashtagPreviewWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  hashtagPreviewChip: { backgroundColor: "#f3e9ff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  hashtagPreviewText: { fontSize: 13, color: "#6f42c1", fontWeight: "500" },

  // Footer
  footer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: "#ebebef", backgroundColor: "#fff",
  },
  footerBtn: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  footerBtnContent: { flexDirection: "row", alignItems: "center", gap: 9 },
  footerBtnText: { fontWeight: "700", fontSize: 16, color: "#fff" },
  footerHint: { textAlign: "center", fontSize: 11, color: "#b0b4be", marginTop: 8 },

  // ── BOTTOM SHEET (shared) ──
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,20,30,0.6)", justifyContent: "flex-end" },
  sheetCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "75%", minHeight: "40%",
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#d0d7de", alignSelf: "center", marginTop: 12 },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: "#f0f2f4",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#1a1d23" },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  sheetSearchWrap: { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f0f2f4" },
  sheetSearchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f4f5f7", borderRadius: 12, paddingHorizontal: 14, height: 40,
  },
  sheetSearchInput: { flex: 1, fontSize: 14, color: "#1a1d23" },

  taggedChipsWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f2f4",
  },
  taggedChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#dbeafe", borderRadius: 20, paddingVertical: 4, paddingLeft: 4, paddingRight: 10,
  },
  taggedChipAvatar: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#667eea",
    alignItems: "center", justifyContent: "center",
  },
  taggedChipAvatarText: { fontSize: 9, fontWeight: "700", color: "#fff" },
  taggedChipText: { fontSize: 12, fontWeight: "600", color: "#0550ae" },

  sheetEmptyWrap: { padding: 28, alignItems: "center" },
  sheetEmptyText: { fontSize: 13, color: "#8c959f" },

  userRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f8f9fa",
  },
  userRowAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#667eea",
    alignItems: "center", justifyContent: "center",
  },
  userRowAvatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  userRowUsername: { fontSize: 14, fontWeight: "600", color: "#1a1d23" },
  userRowFullname: { fontSize: 12, color: "#8c959f", marginTop: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#d0d7de",
    alignItems: "center", justifyContent: "center",
  },
  checkCircleActive: { backgroundColor: "#0969da", borderColor: "#0969da" },

  sheetFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#f0f2f4" },
  sheetDoneBtnBlue: {
    width: "100%", paddingVertical: 12, borderRadius: 12, backgroundColor: "#0969da",
    alignItems: "center",
  },
  sheetDoneBtnPurple: {
    width: "100%", paddingVertical: 12, borderRadius: 12, backgroundColor: "#8250df",
    alignItems: "center",
  },
  sheetDoneBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sheetDoneBtnOutline: {
    width: "100%", paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#d0d7de", alignItems: "center",
  },
  sheetDoneBtnOutlineText: { color: "#24292f", fontWeight: "600", fontSize: 15 },

  // Location
  locationRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  locationIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#f4f5f7",
    alignItems: "center", justifyContent: "center",
  },
  locationText: { fontSize: 14, color: "#1a1d23", flex: 1 },
  locationTextActive: { fontWeight: "600", color: "#0969da" },
  locationAddText: { fontSize: 14, fontWeight: "500", color: "#1a1d23" },
  locationRemoveText: { fontSize: 14, fontWeight: "500", color: "#cf222e" },

  // Hashtag panel
  hashtagInputWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f2f4" },
  hashtagInputBox: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, minHeight: 44,
    backgroundColor: "#f4f5f7", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center",
  },
  hashtagChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(130,80,223,0.1)", borderWidth: 1, borderColor: "rgba(130,80,223,0.15)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  hashtagChipText: { fontSize: 13, fontWeight: "600", color: "#6f42c1" },
  hashtagTextInput: { flex: 1, minWidth: 80, fontSize: 14, color: "#1a1d23" },
  hashtagHelpText: { fontSize: 11, color: "#8c959f", marginTop: 6 },

  suggestionsLabel: {
    fontSize: 11, fontWeight: "700", color: "#8c959f",
    textTransform: "uppercase", letterSpacing: 0.6, marginVertical: 10,
  },
  suggestionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 16 },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#d0d7de", backgroundColor: "#fff",
  },
  suggestionChipText: { fontSize: 13, fontWeight: "500", color: "#1a1d23" },

  // Advanced panel
  advancedRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  advancedIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  advancedLabel: { fontSize: 14, fontWeight: "600", color: "#1a1d23" },
  advancedDesc: { fontSize: 12, color: "#8c959f", marginTop: 2 },
  advancedDivider: { height: 1, backgroundColor: "#f0f2f4", marginHorizontal: 20 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, position: "relative" },
  toggleThumb: {
    position: "absolute", top: 2, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#fff",
  },
});
