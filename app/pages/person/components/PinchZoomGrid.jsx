// import React, { useState, useCallback } from "react";
// import { View, TouchableOpacity, Image, FlatList, useWindowDimensions } from "react-native";
// import { VideoView, useVideoPlayer } from "expo-video";
// import { PinchGestureHandler, State } from "react-native-gesture-handler";
// import { IconPlayBadge, IconFullscreen, IconImagePlaceholder } from "../constants/icons";
// import { GRID_GAP, MIN_COLUMNS, MAX_COLUMNS, DEFAULT_COLUMNS } from "../constants/theme";
// import { styles } from "../styles/styles";

// // ════════════════════════════════════════════════════════════════════════════
// //  PinchZoomGrid
// //  Original kodingizdagi FlatList + renderItem (video/rasm, play belgisi,
// //  fullscreen tugmasi) mantig'i shu yerga ko'chirildi — MANTIQ O'ZGARMAGAN.
// //
// //  YANGI QO'SHILGAN QISM: ikki barmoq bilan siqib/cho'zib (pinch) grid
// //  kolonkalari sonini o'zgartirish:
// //   - Barmoqlar UZOQLASHSA (scale > ~1.15) -> kolonka KAMAYADI -> rasm KATTA
// //   - Barmoqlar YAQINLASHSA (scale < ~0.87) -> kolonka KO'PAYADI -> rasm KICHIK
// //  FlatList'ning numColumns'i ishlash paytida o'zgartirilganda RN uni qayta
// //  mount qilishni talab qiladi, shu sabab `key={grid-cols-${columns}}`
// //  ishlatilgan — bu React Native'dagi standart yechim.
// // ════════════════════════════════════════════════════════════════════════════

// export default function PinchZoomGrid({
//   data,
//   ListHeaderComponent,
//   ListEmptyComponent,
//   playingId,
//   setPlayingId,
//   videoRefs,
//   onOpenPost,
// }) {
//   const { width: SCREEN_W } = useWindowDimensions();
//   const [columns, setColumns] = useState(DEFAULT_COLUMNS);

//   // YANGI: pinch gesture holati tugaganda (barmoqlar qo'yib yuborilganda)
//   // kolonka sonini hisoblab, chegaralab (MIN_COLUMNS..MAX_COLUMNS) yangilaymiz.
//   const onPinchHandlerStateChange = useCallback((event) => {
//     const { state, oldState, scale } = event.nativeEvent;
//     if (state === State.END && oldState === State.ACTIVE) {
//       if (scale > 1.15) {
//         setColumns((prev) => Math.max(MIN_COLUMNS, prev - 1)); // kattalashtirish
//       } else if (scale < 0.87) {
//         setColumns((prev) => Math.min(MAX_COLUMNS, prev + 1)); // kichiklashtirish
//       }
//     }
//   }, []);

//   const itemSize = (SCREEN_W - GRID_GAP * (columns + 1)) / columns;

//   return (
//     <PinchGestureHandler onHandlerStateChange={onPinchHandlerStateChange}>
//       {/* PinchGestureHandler bitta bolani talab qiladi, shu sabab View bilan o'raymiz */}
//       <View style={{ flex: 1 }}>
//         <FlatList
//           key={`grid-cols-${columns}`}
//           data={data}
//           keyExtractor={(item, i) => String(item.id || i)}
//           numColumns={columns}
//           ListHeaderComponent={ListHeaderComponent}
//           ListEmptyComponent={ListEmptyComponent}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ paddingBottom: 80 }}
//           renderItem={({ item }) => {
//             // ── Original renderItem mantig'i — o'zgarishsiz ──
//             const imgSrc = item.picture || item.image || "";
//             const videoSrc = item.video || item.video_url || "";
//             const isVideo = !!videoSrc;
//             const posterSrc = item.thumbnail || item.cover || item.picture || item.image || "";
//             const isPlaying = isVideo && playingId === item.id;

//             const cellStyle = {
//               width: itemSize,
//               height: itemSize,
//               margin: GRID_GAP / 2,
//               backgroundColor: "#f0f2f4",
//             };

//             if (isVideo) {
//               return (
//                 <TouchableOpacity
//                   onPress={() => setPlayingId(isPlaying ? null : item.id)}
//                   style={cellStyle}
//                   activeOpacity={0.9}
//                 >
//                   <Video
//                     ref={(ref) => { videoRefs.current[item.id] = ref; }}
//                     source={{ uri: videoSrc }}
//                     style={styles.gridImage}
//                     resizeMode="cover"
//                     shouldPlay={isPlaying}
//                     isMuted={false}
//                     isLooping
//                     usePoster
//                     posterSource={posterSrc ? { uri: posterSrc } : undefined}
//                     posterStyle={styles.gridImage}
//                   />

//                   {!isPlaying && (
//                     <View style={styles.videoPlayOverlay}>
//                       <IconPlayBadge size={16} />
//                     </View>
//                   )}

//                   <TouchableOpacity
//                     onPress={(e) => {
//                       e.stopPropagation();
//                       videoRefs.current[item.id]?.presentFullscreenPlayer?.();
//                     }}
//                     style={styles.fullscreenBtn}
//                     activeOpacity={0.8}
//                   >
//                     <IconFullscreen size={12} />
//                   </TouchableOpacity>
//                 </TouchableOpacity>
//               );
//             }

//             return (
//               <TouchableOpacity
//                 onPress={() => onOpenPost(item)}
//                 style={cellStyle}
//                 activeOpacity={0.85}
//               >
//                 {imgSrc ? (
//                   <Image
//                     source={{ uri: imgSrc }}
//                     style={styles.gridImage}
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <View style={styles.gridPlaceholder}>
//                     <IconImagePlaceholder />
//                   </View>
//                 )}
//               </TouchableOpacity>
//             );
//           }}
//         />
//       </View>
//     </PinchGestureHandler>
//   );
// }



import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  FlatList,
  useWindowDimensions,
} from "react-native";

import { VideoView, useVideoPlayer } from "expo-video";

import {
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";

import {
  IconPlayBadge,
  IconFullscreen,
  IconImagePlaceholder,
} from "../constants/icons";

import {
  GRID_GAP,
  MIN_COLUMNS,
  MAX_COLUMNS,
  DEFAULT_COLUMNS,
} from "../constants/theme";

import { styles } from "../styles/styles";


// ════════════════════════════════════════════════════════════════════════════
// GRID VIDEO
// ════════════════════════════════════════════════════════════════════════════

function GridVideo({
  videoSrc,
  isPlaying,
  onToggle,
  videoRefs,
  videoId,
}) {
  const player = useVideoPlayer(videoSrc, (player) => {
    player.loop = true;
    player.muted = false;
  });

  const videoViewRef = React.useRef(null);

  useEffect(() => {
    if (!player) return;

    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  useEffect(() => {
    if (!player || !videoRefs?.current) return;

    videoRefs.current[videoId] = {
      player,
      videoView: videoViewRef.current,
    };

    return () => {
      if (videoRefs.current?.[videoId]?.player === player) {
        delete videoRefs.current[videoId];
      }
    };
  }, [player, videoId, videoRefs]);

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{ flex: 1 }}
      activeOpacity={0.9}
    >
      <VideoView
        ref={videoViewRef}
        player={player}
        style={styles.gridImage}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />

      {!isPlaying && (
        <View style={styles.videoPlayOverlay}>
          <IconPlayBadge size={16} />
        </View>
      )}

      <TouchableOpacity
        onPress={(event) => {
          event.stopPropagation();

          try {
            videoViewRef.current?.enterFullscreen();
          } catch (error) {
            console.error("Fullscreen error:", error);
          }
        }}
        style={styles.fullscreenBtn}
        activeOpacity={0.8}
      >
        <IconFullscreen size={12} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
} 


// ════════════════════════════════════════════════════════════════════════════
// PINCH ZOOM GRID
// ════════════════════════════════════════════════════════════════════════════

export default function PinchZoomGrid({
  data,
  ListHeaderComponent,
  ListEmptyComponent,
  playingId,
  setPlayingId,
  videoRefs,
  onOpenPost,
}) {

  const { width: SCREEN_W } = useWindowDimensions();

  const [columns, setColumns] = useState(
    DEFAULT_COLUMNS
  );


  // ══════════════════════════════════════════════════════════════════════════
  // PINCH
  // ══════════════════════════════════════════════════════════════════════════

  const onPinchHandlerStateChange = useCallback(
    (event) => {

      const {
        state,
        oldState,
        scale,
      } = event.nativeEvent;


      // Gesture tugadi

      if (
        state === State.END &&
        oldState === State.ACTIVE
      ) {

        // ────────────────────────────────────────────────────────────────────
        // Barmoqlar uzoqlashdi
        // → rasm kattalashadi
        // → column kamayadi
        // ────────────────────────────────────────────────────────────────────

        if (scale > 1.15) {

          setColumns((prev) =>
            Math.max(
              MIN_COLUMNS,
              prev - 1
            )
          );

        }


        // ────────────────────────────────────────────────────────────────────
        // Barmoqlar yaqinlashdi
        // → rasm kichrayadi
        // → column ko'payadi
        // ────────────────────────────────────────────────────────────────────

        else if (scale < 0.87) {

          setColumns((prev) =>
            Math.min(
              MAX_COLUMNS,
              prev + 1
            )
          );

        }
      }
    },
    []
  );


  // ══════════════════════════════════════════════════════════════════════════
  // ITEM SIZE
  // ══════════════════════════════════════════════════════════════════════════

  const itemSize =
    (
      SCREEN_W -
      GRID_GAP * (columns + 1)
    ) / columns;



  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <PinchGestureHandler
      onHandlerStateChange={
        onPinchHandlerStateChange
      }
    >

      {/* PinchGestureHandler bitta child talab qiladi */}

      <View style={{ flex: 1 }}>

        <FlatList
          key={`grid-cols-${columns}`}
          data={data}

          keyExtractor={(item, index) =>
            String(
              item?.id ?? index
            )
          }

          numColumns={columns}

          ListHeaderComponent={
            ListHeaderComponent
          }

          ListEmptyComponent={
            ListEmptyComponent
          }

          showsVerticalScrollIndicator={
            false
          }

          contentContainerStyle={{
            paddingBottom: 80,
          }}


          // ════════════════════════════════════════════════════════════════
          // RENDER ITEM
          // ════════════════════════════════════════════════════════════════

          renderItem={({ item }) => {

            // ──────────────────────────────────────────────────────────────
            // MEDIA URL
            // ──────────────────────────────────────────────────────────────

            const imgSrc =
              item?.picture ||
              item?.image ||
              "";

            const videoSrc =
              item?.video ||
              item?.video_url ||
              "";

            const isVideo =
              !!videoSrc;

            const isPlaying =
              isVideo &&
              playingId === item?.id;


            // ──────────────────────────────────────────────────────────────
            // CELL
            // ──────────────────────────────────────────────────────────────

            const cellStyle = {
              width: itemSize,
              height: itemSize,

              margin:
                GRID_GAP / 2,

              backgroundColor:
                "#f0f2f4",
            };


            // ══════════════════════════════════════════════════════════════
            // VIDEO
            // ══════════════════════════════════════════════════════════════

            if (isVideo) {

              return (
                <View
                  style={cellStyle}
                >

                  <GridVideo
                    videoSrc={videoSrc}

                    videoId={
                      item?.id
                    }

                    isPlaying={
                      isPlaying
                    }

                    onToggle={() =>
                      setPlayingId(
                        isPlaying
                          ? null
                          : item?.id
                      )
                    }

                    videoRefs={
                      videoRefs
                    }
                  />

                </View>
              );
            }


            // ══════════════════════════════════════════════════════════════
            // IMAGE
            // ══════════════════════════════════════════════════════════════

            return (
              <TouchableOpacity
                onPress={() =>
                  onOpenPost(item)
                }

                style={cellStyle}

                activeOpacity={0.85}
              >

                {imgSrc ? (

                  <Image
                    source={{
                      uri: imgSrc,
                    }}

                    style={
                      styles.gridImage
                    }

                    resizeMode="cover"
                  />

                ) : (

                  <View
                    style={
                      styles.gridPlaceholder
                    }
                  >
                    <IconImagePlaceholder />
                  </View>

                )}

              </TouchableOpacity>
            );
          }}
        />

      </View>

    </PinchGestureHandler>
  );
}