import { useState } from "react";
import { FlatList, Image, View } from "react-native";
import { SCREEN_W } from "../constants/FeedConstants";
import { styles } from "../styles/FeedStyles";

// Ko'p-rasmli postlar uchun sirg'anadigan karusel + nuqta indikatorlar.
export function Carousel({ items = [] }) {
  const w = SCREEN_W;
  const [index, setIndex] = useState(0);
  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    if (i !== index) setIndex(i);
  };
  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item?.id ?? i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image source={{ uri: item?.url || item?.image || item }} style={{ width: w, aspectRatio: 1, backgroundColor: "#f6f8fa" }} resizeMode="cover" />
        )}
      />
      {items.length > 1 && (
        <View style={styles.dotsRow}>
          {items.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}