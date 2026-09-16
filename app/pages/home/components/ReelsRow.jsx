import { ScrollView, Text, View } from "react-native";
import { VideoThumbCard } from "./VideoThumbCard";
import { IconPlayMini } from "./icons";
import { fmtViews, fmtDuration } from "../utils/Formatters";
import { styles } from "../styles/FeedStyles";

// "Tavsiya etilgan reels" gorizontal qatori — ko'rishlar/username/davomiylik bilan.
export function ReelsRow({ reels = [], onOpenReel }) {
  if (!reels.length) return null;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionHeading}>Reels</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 26, gap: 10 }}>
        {reels.map((r, i) => (
          <VideoThumbCard
            key={r.id || i}
            item={r}
            url={r.video || r.video_url}
            posterUrl={r.thumbnail || r.video}
            onOpen={onOpenReel}
            style={styles.reelCard}
            imageStyle={styles.reelThumb}
          >
            <View style={styles.reelPlayBadge}>
              <IconPlayMini size={12} />
            </View>
            <View style={styles.reelDurationBadge}>
              <Text style={styles.reelDurationText}>{fmtDuration(r.duration)}</Text>
            </View>
            <View style={styles.reelOverlay}>
              <Text style={styles.reelViewsText}>{fmtViews(r.views)} views</Text>
              <Text style={styles.reelUsernameText} numberOfLines={1}>@{r.username}</Text>
            </View>
          </VideoThumbCard>
        ))}
      </ScrollView>
    </View>
  );
}