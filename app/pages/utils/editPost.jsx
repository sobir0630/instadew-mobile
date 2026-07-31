// EditPost.js — React Native versiyasi
// Endi post RASM ham, VIDEO ham bo'lishi mumkin, va ikkalasi ham TO'LIQ tahrirlanadi.
//
// So'ralgan API'lar (GET/PATCH/PUT/DELETE hammasi shu bazadan, oxiriga {id} qo'shiladi):
//   Rasm postlari uchun:   /posts/my-posts/{id}/
//   Video postlari uchun:  /videos/user-videos/{id}/
//
// FormData maydon nomi: rasm uchun "picture", video uchun "video".
//
// Qaysi turdagi post ekanini aniqlash tartibi:
//   1) MyPostsPage'dan kelganda AsyncStorage'ga saqlangan "post_type" ("image"|"video")
//      o'qiladi — bu eng ishonchli yo'l (MyPostsPage.js'da handlePostClick shuni saqlaydi).
//   2) Agar "post_type" topilmasa — avval rasm endpointi so'raladi, 404 bo'lsa video
//      endpointiga avtomatik o'tiladi.
//
// KERAKLI PAKETLAR:
//   npm install @react-native-async-storage/async-storage
//   npm install @react-navigation/native @react-navigation/native-stack
//   npm install lucide-react-native react-native-svg
//   npx expo install expo-av expo-image-picker

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronLeft,
  Eye,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  PlayCircle,
  UploadCloud,
  Type,
  MapPin,
  Tag,
  Trash2,
  Save,
} from "lucide-react-native";
import API from "../../api/server";

// ════════════════════════════════════════════════════════════════════════════
//  API — rasm va video uchun ikkita alohida baza, siz ko'rsatgandek
// ════════════════════════════════════════════════════════════════════════════

const getToken = () => AsyncStorage.getItem("token");
const authHeader = async () => ({ Authorization: `Bearer ${(await getToken())?.trim()}` });


// ✅ Rasm postlari — /posts/my-posts/{id}/
const IMAGE_ENDPOINT = (id) => `/posts/post/${id}/`;
// ✅ Video postlari — /videos/user-videos/{username}/{id}/
const VIDEO_ENDPOINT = (username, id) => `/videos/user-videos/${username}/${id}/`;

 async function endpointFor(type, id) {
  const username = await AsyncStorage.getItem("login_username") || " "; // default
  console.log(`Endpoint for type=${type}, id=${id}, username=${username}`);
  return type === "video" ? VIDEO_ENDPOINT(username, id) : IMAGE_ENDPOINT(id);
}
// Rasm uchun FormData maydoni "picture", video uchun "video"
function mediaFieldFor(type) {
  return type === "video" ? "video" : "picture";
}

async function fetchPostByType(postId, type) {
  const res = await API.get(await endpointFor(type, postId), { headers: await authHeader() });
  console.log(`Fetched ${type} post:`, res.data);
  console.log(`Fetched ${postId} post id:`, res.data);
  console.log(`Fetched ${type} post username:`, res.data.username);
  return res.data;
}

// Post turi aniq bo'lmasa: avval rasm sifatida, 404 bo'lsa video sifatida sinab ko'ramiz
async function detectAndFetchPost(postId) {
  const storedType = await AsyncStorage.getItem("post_type"); // "image" | "video" | null

  if (storedType === "video" || storedType === "image") {
    try {
      const data = await fetchPostByType(postId, storedType);
      return { type: storedType, data };
    } catch (err) {
      // saqlangan turi noto'g'ri chiqsa, pastdagi avto-aniqlashga tushamiz
    }
  }

  try {
    const data = await fetchPostByType(postId, "image");
    return { type: "image", data };
  } catch (err) {
    if (err?.response?.status === 404) {
      const data = await fetchPostByType(postId, "video");
      return { type: "video", data };
    }
    throw err;
  }
};

async function patchPost(postId, type, formData) {
  const res = await API.patch(await endpointFor(type, postId), formData, {
    headers: { ...(await authHeader()), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

async function putPost(postId, type, formData) {
  const res = await API.put(await endpointFor(type, postId), formData, {
    headers: { ...(await authHeader()), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

async function deletePost(postId, type) {
  const res = await API.delete(await endpointFor(type, postId), { headers: await authHeader() });
  return res;
}

// ════════════════════════════════════════════════════════════════════════════
//  ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Spinner({ size = 20, color = "#fff" }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2.5,
        borderColor: color,
        borderTopColor: "transparent",
        transform: [{ rotate }],
      }}
    />
  );
}

function Toast({ message, type = "success", onDone }) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone, translateY, opacity]);

  const bg = type === "success" ? "#1a7f37" : type === "error" ? "#cf222e" : "#0969da";

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, transform: [{ translateY }], opacity }]}>
      {type === "success" ? (
        <Check size={16} color="#fff" strokeWidth={2.5} />
      ) : (
        <AlertCircle size={16} color="#fff" strokeWidth={2.5} />
      )}
      <Text style={styles.toastText} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

function DeleteModal({ visible, onConfirm, onCancel, loading }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <Trash2 size={22} color="#cf222e" />
          </View>
          <Text style={styles.modalTitle}>Delete Post?</Text>
          <Text style={styles.modalText}>Bu postni o'chirsangiz qayta tiklab bo'lmaydi. Davom etasizmi?</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Bekor qilish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} disabled={loading} style={styles.modalDeleteBtn}>
              {loading ? (
                <>
                  <Spinner size={16} />
                  <Text style={styles.modalDeleteText}>O'chirilmoqda…</Text>
                </>
              ) : (
                <Text style={styles.modalDeleteText}>O'chirish</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MEDIA UPLOAD ZONE — rasm HAM, video HAM shu yerdan tanlanadi (post turiga qarab)
// ════════════════════════════════════════════════════════════════════════════

function MediaUploadZone({ mediaType, currentUri, newAsset, onChange }) {
  const previewUri = newAsset?.uri || currentUri;

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mediaType === "video" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: mediaType !== "video",
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) return;
    onChange(result.assets[0]);
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={pickMedia} style={styles.uploadZone}>
      {previewUri ? (
        <>
          {mediaType === "video" ? (
            <Video
              source={{ uri: previewUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              shouldPlay={false}
              isMuted
              useNativeControls={false}
            />
          ) : (
            <Image source={{ uri: previewUri }} style={{ width: "100%", height: "100%" }} />
          )}

          {mediaType === "video" && (
            <View style={styles.playOverlay}>
              <PlayCircle size={40} color="#fff" strokeWidth={1.5} />
            </View>
          )}

          {newAsset && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>YANGI</Text>
            </View>
          )}

          <View style={styles.uploadHint}>
            <UploadCloud size={16} color="#fff" />
            <Text style={styles.uploadHintText}>
              {mediaType === "video" ? "Videoni almashtirish" : "Rasmni almashtirish"}
            </Text>
          </View>
        </>
      ) : (
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={styles.uploadIconWrap}>
            {mediaType === "video" ? (
              <PlayCircle size={22} color="#8c959f" />
            ) : (
              <ImageIcon size={22} color="#8c959f" />
            )}
          </View>
          <Text style={styles.uploadTitle}>{mediaType === "video" ? "Video yuklash" : "Rasm yuklash"}</Text>
          <Text style={styles.uploadSubtitle}>Bosing va tanlang</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  FIELD COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function ChangeBadge({ changed }) {
  if (!changed) return null;
  return (
    <View style={styles.changeBadge}>
      <View style={styles.changeBadgeDot} />
      <Text style={styles.changeBadgeText}>O'zgardi</Text>
    </View>
  );
}

function FieldLabel({ icon: Icon, label, changed }) {
  return (
    <View style={styles.fieldLabelRow}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {Icon ? <Icon size={13} color="#57606a" /> : null}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <ChangeBadge changed={changed} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EditPost() {
  const navigation = useNavigation();
  const route = useRoute();

  const [postId, setPostId] = useState(route.params?.postId || null);
  const [postType, setPostType] = useState(null); // "image" | "video"

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [original, setOriginal] = useState(null);

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [newMedia, setNewMedia] = useState(null); // ImagePicker asset | null

  const [method, setMethod] = useState("patch"); // "patch" | "put"
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);

  // ── postId ni AsyncStorage'dan (agar route orqali kelmagan bo'lsa) olish ──
  useEffect(() => {
    (async () => {
      if (!postId) {
        const stored = await AsyncStorage.getItem("post_id");
        setPostId(stored);
      }
    })();
  }, [postId]);

  // ── Postni yuklash (turi bilan birga) ─────────────────────────────────────
  useEffect(() => {
    if (postId === null) return; // hali AsyncStorage'dan o'qilmoqda
    if (!postId) {
      setPageError("Post ID topilmadi.");
      setPageLoading(false);
      return;
    }

    (async () => {
      try {
        const { type, data } = await detectAndFetchPost(postId);
        setPostType(type);
        setOriginal(data);
        setCaption(data.caption || data.description || "");
        setLocation(data.location || "");
        const rawTags = data.tags;
        setTags(Array.isArray(rawTags) ? rawTags.join(", ") : rawTags || "");
      } catch (err) {
        console.error("Post fetch error:", err);
        setPageError("Postni yuklab bo'lmadi.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [postId]);

  // ── O'zgarishlarni aniqlash ───────────────────────────────────────────────
  const captionChanged = original && caption !== (original.caption || original.description || "");
  const locationChanged = original && location !== (original.location || "");
  const tagsChanged =
    original && tags !== (Array.isArray(original.tags) ? original.tags.join(", ") : original.tags || "");
  const mediaChanged = !!newMedia;
  const hasChanges = captionChanged || locationChanged || tagsChanged || mediaChanged;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving || !hasChanges) return;
    setSaving(true);
    try {
      const fd = new FormData();
      const mediaField = mediaFieldFor(postType);

      const appendMedia = () => {
        if (!newMedia) return;
        fd.append(mediaField, {
          uri: newMedia.uri,
          name: newMedia.fileName || `media_${Date.now()}.${postType === "video" ? "mp4" : "jpg"}`,
          type: newMedia.mimeType || (postType === "video" ? "video/mp4" : "image/jpeg"),
        });
      };

      let updated;
      if (method === "put") {
        fd.append("caption", caption);
        fd.append("location", location);
        fd.append("tags", tags);
        appendMedia();
        updated = await putPost(postId, postType, fd);
      } else {
        if (captionChanged) fd.append("caption", caption);
        if (locationChanged) fd.append("location", location);
        if (tagsChanged) fd.append("tags", tags);
        if (mediaChanged) appendMedia();
        updated = await patchPost(postId, postType, fd);
      }

      setOriginal(updated);
      setNewMedia(null);
      setToast({ message: "O'zgarishlar saqlandi!", type: "success" });
    } catch (err) {
      console.error("Save error:", err);
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Saqlashda xato yuz berdi.";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(postId, postType);
      setShowDelete(false);
      setToast({ message: "Post o'chirildi!", type: "success" });
      setTimeout(() => {
        navigation.navigate("Person");
      }, 1200);
    } catch (err) {
      console.error("Delete error:", err);
      setToast({ message: "O'chirishda xato yuz berdi.", type: "error" });
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleReset = () => {
    if (!original) return;
    setCaption(original.caption || original.description || "");
    setLocation(original.location || "");
    setTags(Array.isArray(original.tags) ? original.tags.join(", ") : original.tags || "");
    setNewMedia(null);
  };

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER — Loading / Error
  // ════════════════════════════════════════════════════════════════════════

  if (pageLoading) {
    return (
      <View style={styles.centerScreen}>
        <Spinner size={36} color="#0969da" />
        <Text style={styles.loadingText}>Post yuklanmoqda…</Text>
      </View>
    );
  }

  if (pageError) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.errorIconWrap}>
          <AlertCircle size={24} color="#cf222e" />
        </View>
        <Text style={styles.errorText}>{pageError}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnOutline}>
          <Text style={styles.backBtnOutlineText}>Orqaga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mediaUri =
    original?.video || original?.video_url || original?.picture || original?.img || original?.image || "";

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER — Preview mode
  // ════════════════════════════════════════════════════════════════════════

  if (preview) {
    const previewUri = newMedia?.uri || mediaUri;
    return (
      <View style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setPreview(false)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <X size={18} color="#57606a" strokeWidth={2.5} />
            <Text style={styles.previewCloseText}>Yopish</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeaderRow}>
              <View style={styles.previewAvatar}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                  {(original?.author?.username || "U")[0]?.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.previewUsername}>@{original?.author?.username || "user"}</Text>
                {location ? <Text style={styles.previewLocation}>📍 {location}</Text> : null}
              </View>
            </View>

            {previewUri ? (
              postType === "video" ? (
                <Video
                  source={{ uri: previewUri }}
                  style={{ width: "100%", aspectRatio: 1 }}
                  resizeMode="cover"
                  useNativeControls
                  isLooping
                />
              ) : (
                <Image source={{ uri: previewUri }} style={{ width: "100%", aspectRatio: 1 }} />
              )
            ) : null}

            <View style={{ padding: 14 }}>
              <Text style={styles.previewCaption}>
                <Text style={{ fontWeight: "700" }}>@{original?.author?.username || "user"}</Text> {caption}
              </Text>
              {tags ? (
                <Text style={styles.previewTags}>
                  {tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => `#${t}`)
                    .join(" ")}
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER — Main edit form
  // ════════════════════════════════════════════════════════════════════════

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f6f8fa" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      <DeleteModal visible={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={18} color="#0969da" strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit {postType === "video" ? "video" : "post"}</Text>

        <TouchableOpacity onPress={() => setPreview(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Eye size={16} color="#0969da" />
          <Text style={styles.previewBtnText}>Preview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Changes indicator */}
        {hasChanges && (
          <View style={styles.changesBox}>
            <AlertCircle size={16} color="#0969da" />
            <Text style={styles.changesText}>
              {[
                mediaChanged && (postType === "video" ? "Video" : "Rasm"),
                captionChanged && "Caption",
                locationChanged && "Joylashuv",
                tagsChanged && "Teglar",
              ]
                .filter(Boolean)
                .join(", ")}{" "}
              has changed
            </Text>
          </View>
        )}

        {/* Media upload */}
        <View style={{ marginBottom: 20 }}>
          <FieldLabel
            icon={postType === "video" ? PlayCircle : ImageIcon}
            label={postType === "video" ? "Video" : "Image"}
            changed={mediaChanged}
          />
          {mediaChanged && (
            <TouchableOpacity onPress={() => setNewMedia(null)} style={{ alignSelf: "flex-end", marginBottom: 6 }}>
              <Text style={styles.voidText}>Void</Text>
            </TouchableOpacity>
          )}
          <MediaUploadZone mediaType={postType} currentUri={mediaUri} newAsset={newMedia} onChange={setNewMedia} />
        </View>

        {/* Caption */}
        <View style={{ marginBottom: 16 }}>
          <FieldLabel icon={Type} label="Caption" changed={captionChanged} />
          <View style={styles.textAreaBox}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Postingiz haqida yozing…"
              placeholderTextColor="#8c959f"
              maxLength={2200}
              multiline
              editable={!saving}
              textAlignVertical="top"
              style={styles.textArea}
            />
            <Text style={styles.counter}>{caption.length}/2200</Text>
          </View>
        </View>

        {/* Location */}
        <View style={{ marginBottom: 16 }}>
          <FieldLabel icon={MapPin} label="Location" changed={locationChanged} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Toshkent, O'zbekiston"
            placeholderTextColor="#8c959f"
            maxLength={100}
            editable={!saving}
            style={styles.input}
          />
        </View>

        {/* Tags */}
        <View style={{ marginBottom: 20 }}>
          <FieldLabel icon={Tag} label="Tags" changed={tagsChanged} />
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="travel, nature, photography"
            placeholderTextColor="#8c959f"
            editable={!saving}
            style={styles.input}
          />
          {tags ? (
            <View style={styles.tagsRow}>
              {tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <View key={i} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                  </View>
                ))}
            </View>
          ) : null}
          <Text style={styles.hint}>Separate with a comma: travel, nature</Text>
        </View>

        {/* Method selector */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.methodLabel}>Update method</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["patch", "put"].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              >
                <Text style={[styles.methodBtnText, method === m && styles.methodBtnTextActive]}>
                  {m.toUpperCase()}
                </Text>
                <Text style={styles.methodBtnSub}>{m === "patch" ? "Only those who have changed" : "All"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save & Reset */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={handleReset}
            disabled={!hasChanges || saving}
            style={[styles.resetBtn, (!hasChanges || saving) && { opacity: 0.5 }]}
          >
            <Text style={styles.resetBtnText}>Cancellation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || saving}
            style={[styles.saveBtn, { backgroundColor: hasChanges && !saving ? "#0969da" : "#d0d7de" }]}
          >
            {saving ? (
              <>
                <Spinner size={18} />
                <Text style={styles.saveBtnText}>Saving…</Text>
              </>
            ) : (
              <>
                <Save size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.saveBtnText}>Save ({method.toUpperCase()})</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={() => setShowDelete(true)}
          disabled={saving}
          style={[styles.deleteBtn, saving && { opacity: 0.5 }]}
        >
          <Trash2 size={16} color="#cf222e" strokeWidth={2} />
          <Text style={styles.deleteBtnText}>Delete the post</Text>
        </TouchableOpacity>

        {/* Post info */}
        {original && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Post information</Text>
            {[
              { label: "Post ID", value: original.id },
              { label: "Type", value: postType === "video" ? "Video" : "Image" },
              { label: "Auther", value: `@${original.username || original.author?.username || original.user || "—"}` },
              { label: "Created", value: original.created_at ? new Date(original.created_at).toLocaleString() : "—" },
              { label: "Likes", value: original.likes_count ?? original.likes ?? 0 },
            ].map((row, i, arr) => (
              <View key={i} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoRowLabel}>{row.label}</Text>
                <Text style={styles.infoRowValue}>{String(row.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  centerScreen: { flex: 1, backgroundColor: "#f6f8fa", alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  loadingText: { fontSize: 14, color: "#57606a" },
  errorIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#ffcdd0", alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 15, fontWeight: "600", color: "#cf222e", textAlign: "center" },
  backBtnOutline: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#d0d7de", backgroundColor: "#fff" },
  backBtnOutlineText: { fontSize: 14, fontWeight: "600", color: "#24292f" },

  header: {
    height: 54,
    backgroundColor: "#f6f8fa",
    borderBottomWidth: 1,
    borderBottomColor: "#d0d7de",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backText: { color: "#0969da", fontSize: 14, fontWeight: "600" },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#24292f" },
  previewBtnText: { color: "#0969da", fontSize: 13, fontWeight: "600" },
  previewCloseText: { color: "#57606a", fontSize: 14, fontWeight: "600" },

  changesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  changesText: { fontSize: 13, color: "#0550ae", fontWeight: "500", flex: 1 },

  fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#57606a", textTransform: "uppercase", letterSpacing: 0.5 },

  changeBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#dbeafe", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  changeBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0969da" },
  changeBadgeText: { fontSize: 11, fontWeight: "600", color: "#0969da" },
  voidText: { fontSize: 12, color: "#cf222e", fontWeight: "600" },

  uploadZone: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d0d7de",
    backgroundColor: "#f6f8fa",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#f0f2f4", alignItems: "center", justifyContent: "center" },
  uploadTitle: { fontSize: 14, fontWeight: "600", color: "#24292f" },
  uploadSubtitle: { fontSize: 12, color: "#8c959f" },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.15)" },
  newBadge: { position: "absolute", top: 10, right: 10, backgroundColor: "#0969da", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  uploadHint: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  uploadHintText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  input: {
    borderWidth: 1.5,
    borderColor: "#d0d7de",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: "#24292f",
    backgroundColor: "#fff",
  },
  textAreaBox: { borderWidth: 1.5, borderColor: "#d0d7de", borderRadius: 10, padding: 14, backgroundColor: "#fff" },
  textArea: { fontSize: 14, color: "#24292f", minHeight: 90, lineHeight: 20 },
  counter: { fontSize: 11, color: "#8c959f", textAlign: "right", marginTop: 4 },
  hint: { fontSize: 11, color: "#8c959f", marginTop: 6 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: "#dbeafe", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagChipText: { fontSize: 12, color: "#0969da", fontWeight: "500" },

  methodLabel: { fontSize: 12, fontWeight: "700", color: "#57606a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  methodBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: "#d0d7de", backgroundColor: "#fff", alignItems: "center" },
  methodBtnActive: { borderColor: "#0969da", backgroundColor: "#dbeafe" },
  methodBtnText: { fontSize: 13, fontWeight: "700", color: "#57606a" },
  methodBtnTextActive: { color: "#0550ae" },
  methodBtnSub: { fontSize: 10, color: "#8c959f", marginTop: 2 },

  resetBtn: { width: 110, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#d0d7de", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  resetBtnText: { fontSize: 14, fontWeight: "600", color: "#57606a" },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  deleteBtn: { width: "100%", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#ffcdd0", backgroundColor: "#fff1f0", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  deleteBtnText: { color: "#cf222e", fontWeight: "700", fontSize: 14 },

  infoCard: { marginTop: 20, padding: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d0d7de", borderRadius: 12 },
  infoTitle: { fontSize: 11, fontWeight: "700", color: "#8c959f", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f6f8fa" },
  infoRowLabel: { fontSize: 13, color: "#57606a" },
  infoRowValue: { fontSize: 13, fontWeight: "600", color: "#24292f" },

  previewCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d0d7de", borderRadius: 12, overflow: "hidden" },
  previewHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  previewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#764ba2", alignItems: "center", justifyContent: "center" },
  previewUsername: { fontSize: 14, fontWeight: "700", color: "#24292f" },
  previewLocation: { fontSize: 11, color: "#57606a", marginTop: 2 },
  previewCaption: { fontSize: 14, color: "#24292f", lineHeight: 20 },
  previewTags: { fontSize: 13, color: "#0969da", marginTop: 8, lineHeight: 19 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(36,41,47,0.7)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, alignItems: "center" },
  modalIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff1f0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#24292f", marginBottom: 8 },
  modalText: { fontSize: 13, color: "#57606a", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  modalCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#d0d7de", backgroundColor: "#f6f8fa", alignItems: "center" },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: "#24292f" },
  modalDeleteBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#cf222e", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalDeleteText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  toast: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 999,
    maxWidth: "90%",
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "600", flexShrink: 1 },
});