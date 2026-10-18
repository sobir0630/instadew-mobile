import { Image } from "react-native";
import { styles } from "../../styles/home/FeedStyles";
import { Carousel } from "./Carousel";
import { PostVideo } from "./PostVideo";

// Post turiga (rasm / video / carousel) qarab tegishli komponentni tanlaydi.
export function PostMedia({ post, active }) {
  const type = post.media_type || (post.video_url ? "video" : post.carousel?.length ? "carousel" : "image");
  const imageUrl = post.picture || post.img || "";
  const posterUrl = post.thumbnail || post.cover || post.poster || imageUrl;
  if (type === "video" || type === "reel") return <PostVideo uri={post.video_url} active={active} posterUrl={posterUrl} />;
  if (type === "carousel" && post.carousel?.length) return <Carousel items={post.carousel} />;
  return <Image source={{ uri: imageUrl }} style={styles.postImage} resizeMode="cover" />;
}