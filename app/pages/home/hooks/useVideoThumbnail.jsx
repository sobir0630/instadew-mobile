import { useEffect, useState } from "react";
import * as VideoThubnails from "expo-video-thumbnails";

// Video URI'dan preview-rasm (thumbnail) generatsiya qiladi.
export function useVideoThumbnail(videoUri, fallbackUri = "") {
  const [thumbUri, setThumbUri] = useState(fallbackUri || null);
  const [loading, setLoading] = useState(Boolean(videoUri) && !fallbackUri);

  useEffect(() => {
    let cancelled = false;

    if (!videoUri) {
      setThumbUri(fallbackUri || null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setThumbUri(fallbackUri || null);

    const generate = async () => {
      try {
        const result = await VideoThubnails.getThumbnailAsync(videoUri, {
          time: 1000,
          quality: 0.7,
          format: VideoThubnails.ImageFormat.JPEG,
        });

        if (!cancelled && result?.uri) {
          setThumbUri(result.uri);
        }
      } catch (error) {
        if (!cancelled) {
          setThumbUri(fallbackUri || null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, [videoUri, fallbackUri]);

  return { thumbUri, loading };
}