import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import API from "../../api/server";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";

import {
  IconClose,
  IconLocation,
  IconTagUser,
  IconHashtag,
  IconCommentOff,
  IconTrash,
  IconBack,
  IconPhotoPlaceholder,
  IconVideoPlaceholder,
  IconUpload,
  IconAlert,
  IconPhotoIcon,
  IconVideoIcon,
  IconCaptionEmoji,
  IconCheckmarkBig,
} from "./Icons";
import { TagPeoplePanel } from "./TagPeoplePanel";
import { LocationPanel } from "./LocationPanel";
import { HashtagsPanel } from "./HashtagsPanel";
import { AdvancedPanel } from "./AdvancedPanel";
import { OptionRow } from "./OptionRow";
import { getToken } from "./PostApi";
import { MAX_CAPTION_LENGTH } from "./PostConstants";
import { styles } from "./CreatePostStyles";

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

        const res = await API.post("/videos/video/", fd, {
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
      setTimeout(() => router.push("/pages/home/FeedScreen"), 1200);
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
        console.log("video xatosi: ", msg)
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
        <TouchableOpacity onPress={() => router.push("/pages/home/FeedScreen")} style={styles.backBtn}>
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
              onChangeText={(t) => { setCaption(t.slice(0, MAX_CAPTION_LENGTH)); setError(""); }}
              placeholder="Caption yozing…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              style={styles.captionInput}
            />
            <View style={styles.captionFooterRow}>
              <IconCaptionEmoji />
              <Text style={[styles.captionCounter, caption.length > MAX_CAPTION_LENGTH * 0.9 && { color: "#cf222e" }]}>
                {caption.length} / {MAX_CAPTION_LENGTH}
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