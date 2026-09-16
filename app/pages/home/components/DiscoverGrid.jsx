import { View } from "react-native";
import { VideoThumbCard } from "./VideoThumbCard";
import { IconPlayMini } from "./icons";
import { SCREEN_W } from "../constants/FeedConstants";
import { styles } from "../styles/FeedStyles";

// Explore uslubidagi 3-ustunli grid; videolar mini play belgisi bilan ko'rsatiladi.
export function DiscoverGrid({ items = [], onOpenItem }) {
  const GAP = 3;
  const COL_W = (SCREEN_W - GAP * 4) / 3;
  const columns = [[], [], []];
  const heights = [0, 0, 0];
  items.forEach((item) => {
    const shortest = heights.indexOf(Math.min(...heights));
    const h = item.tall ? COL_W * 1.5 : COL_W;
    columns[shortest].push({ ...item, __h: h });
    heights[shortest] += h;
  });
  return (
    <View style={{ flexDirection: "row", gap: GAP, paddingHorizontal: GAP }}>
      {columns.map((col, ci) => (
        <View key={ci} style={{ width: COL_W, gap: GAP }}>
          {col.map((item, i) => (
            <VideoThumbCard
              key={item.id || i}
              item={item}
              url={item.video_url}
              posterUrl={item.thumbnail || item.video_url}
              onOpen={onOpenItem}
              style={{ width: COL_W, height: item.__h }}
              imageStyle={styles.discoverThumb}
            >
              {item.is_video && (
                <View style={styles.discoverPlayBadge}>
                  <IconPlayMini size={10} />
                </View>
              )}
            </VideoThumbCard>
          ))}
        </View>
      ))}
    </View>
  );
}