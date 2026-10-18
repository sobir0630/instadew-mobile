import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";

// Video/reel kartochkasini bosib turilsa, havolani buferga nusxalaydi.
export function useHoldToCopy(url, holdMs = 1000) {
  const [copyBadgeVisible, setCopyBadgeVisible] = useState(false);
  const holdTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    };
  }, []);

  const clearTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const startHold = () => {
    clearTimer();
    setCopyBadgeVisible(false);
    holdTimer.current = setTimeout(async () => {
      if (!url) return;
      await Clipboard.setStringAsync(url);
      setCopyBadgeVisible(true);
    }, holdMs);
  };

  const stopHold = () => {
    clearTimer();
  };

  return { copyBadgeVisible, startHold, stopHold };
}