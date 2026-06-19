import React, { useRef, useState } from "react";
import { View, Dimensions, FlatList } from "react-native";
import { Video } from "expo-av";

const { height } = Dimensions.get("window");

const DATA = [
  { id: "1", uri: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: "2", uri: "https://www.w3schools.com/html/movie.mp4" },
  { id: "3", uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
];

export default function ReelsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef([]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 80,
  });

  return (
    <FlatList
      data={DATA}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <View style={{ height }}>
          <Video
            ref={(ref) => (videoRefs.current[index] = ref)}
            source={{ uri: item.uri }}
            style={{ flex: 1 }}
            resizeMode="cover"
            shouldPlay={activeIndex === index}
            isLooping
            useNativeControls={false}
          />
        </View>
      )}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
    />
  );
}