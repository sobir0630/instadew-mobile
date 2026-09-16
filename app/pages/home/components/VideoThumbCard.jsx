import { Image, Text, TouchableOpacity, View } from "react-native";
import { useHoldToCopy } from "../hooks/useHoldToCopy";
import { useVideoThumbnail } from "../hooks/useVideoThumbnail";
import { IconImagePlaceholder } from "./icons";
import { styles } from "../styles/FeedStyles";

// Video/reel uchun qayta ishlatiladigan thumbnail kartochkasi (Discover va Reels'da ishlatiladi).
export function VideoThumbCard({ item, url, posterUrl, style, imageStyle, onOpen, children }) {
  const { copyBadgeVisible, startHold, stopHold } = useHoldToCopy(url);
  const { thumbUri } = useVideoThumbnail(url, posterUrl || "");

  const handlePress = () => {
    if (copyBadgeVisible) return;
    onOpen?.(item);
  };

  const displayPoster = thumbUri || posterUrl || "";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={startHold}
      onPressOut={stopHold}
      onPress={handlePress}
      style={style}
    >
      {displayPoster ? (
        <Image source={{ uri: displayPoster }} style={imageStyle} resizeMode="cover" />
      ) : (
        <View style={[imageStyle, { backgroundColor: "#f6f8fa", alignItems: "center", justifyContent: "center" }]}>
          <IconImagePlaceholder size={32} color="#8c959f" />
        </View>
      )}
      {children}
      {copyBadgeVisible ? (
        <View style={styles.copyBadge}>
          <Text style={styles.copyText}>Copy</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}