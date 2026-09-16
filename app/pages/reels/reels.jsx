import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

import { ReelItem } from "./components/ReelItems";
import { fetchReelsVideos } from "./api/ReelsApi";
import { SCREEN_HEIGHT } from "./constants/ReelsConstants";
import { styles } from "./styles/ReelsStyles";

// ═══════════════════════════════════════════════════════════════════════
//  ASOSIY EKRAN — vertikal scroll video lenta (Reels)
// ═══════════════════════════════════════════════════════════════════════
export default function Reals() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { video_id } = useLocalSearchParams();
  const videoId = Array.isArray(video_id) ? video_id[0] : video_id;

  const loadVideos = useCallback(async (urlOverride = null, isRefresh = false) => {
    try {
      const hasVideoId = Boolean(videoId);
      const isInitialLoad = !urlOverride && !isRefresh;

      if (isInitialLoad) setLoading(true);
      else setLoadingMore(true);

      const requestUrl = urlOverride || (hasVideoId ? `/videos/reals-videos/${videoId}/` : "/videos/reals-videos/");
      const data = await fetchReelsVideos(requestUrl);

      const rawResults = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
          ? data
          : [data];

      const results = rawResults
        .filter(Boolean)
        .filter((item) => item?.id || item?.video_id || item?.video_url || item?.video)
        .map((item, index) => ({
          ...item,
          id: item?.id ?? item?.video_id ?? `video-${index}`,
        }));

      if (isInitialLoad || isRefresh) {
        setVideos(results);
        setNextPage(hasVideoId ? "/videos/reals-videos/" : data?.next || null);
      } else {
        setVideos((prev) => {
          const uniqueResults = results.filter(
            (item) => !prev.some((prevItem) => (prevItem.id ?? prevItem.video_id) === (item.id ?? item.video_id))
          );
          return [...prev, ...uniqueResults];
        });
        setNextPage(data?.next || null);
      }
    } catch (err) {
      console.log(err.response?.data);
      console.log(err.response?.status);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVideos(videoId ? `/videos/reals-videos/${videoId}/` : "/videos/reals-videos/", true);
  };

  const onEndReached = () => {
    if (nextPage && !loadingMore) {
      loadVideos(nextPage);
    }
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = useCallback(
    ({ item, index }) => <ReelItem video={item} isActive={index === activeIndex} />,
    [activeIndex]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item, index) => String(item?.id ?? item?.video_id ?? `video-${index}`)}
      renderItem={renderItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      onEndReached={onEndReached}
      onEndReachedThreshold={2}
      windowSize={3}
      maxToRenderPerBatch={2}
      initialNumToRender={2}
      removeClippedSubviews
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} /> : null
      }
      style={styles.list}
    />
  );
}