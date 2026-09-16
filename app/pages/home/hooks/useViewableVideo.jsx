import { useRef, useState } from "react";

// FlatList ichida qaysi post hozir ekranda ko'rinib turganini aniqlaydi —
// faqat o'sha post'ning videosi avtomatik ijro etiladi.
export function useViewableVideo({ threshold = 65, minViewTime = 150 } = {}) {
  const [visibleId, setVisibleId] = useState(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: threshold,
    minimumViewTime: minViewTime,
  }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length === 0) { setVisibleId(null); return; }
    const best = viewableItems.reduce((a, b) => {
      const aPct = a.percentVisible ?? 100;
      const bPct = b.percentVisible ?? 100;
      return bPct > aPct ? b : a;
    });
    const id = best.item?.id ?? best.key;
    setVisibleId((prev) => (String(prev) === String(id) ? prev : id));
  }).current;
  return { visibleId, viewabilityConfig, onViewableItemsChanged };
}