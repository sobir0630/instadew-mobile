import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { IconClose } from "../../constants/icons";
import { styles, SCREEN_W } from "../../constants/styles";

// ════════════════════════════════════════════════════════════════════════════
//  ImageGalleryViewer — Telegramdagidek: barcha rasmlarni gorizontal
//  varaqlab (swipe qilib) ko'rish + pastda doimiy filmstrip (kichik
//  rasmlar qatori), bosilgan rasmga darhol o'tish uchun.
// ════════════════════════════════════════════════════════════════════════════

export default function ImageGalleryViewer({ images, index, onClose, onChangeIndex }) {
  const mainListRef = useRef(null);
  const stripListRef = useRef(null);

  useEffect(() => {
    if (index === null || index === undefined || !mainListRef.current) return;
    const t = setTimeout(() => {
      try { mainListRef.current?.scrollToIndex({ index, animated: false }); } catch (err) { /* layout hali tayyor bo'lmasligi mumkin */ }
      try { stripListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }); } catch (err) {}
    }, 0);
    return () => clearTimeout(t);
  }, [index]);

  const visible = index !== null && index !== undefined && images.length > 0;
  if (!visible) return null;

  const goTo = (i) => {
    try { mainListRef.current?.scrollToIndex({ index: i, animated: true }); } catch (err) {}
    onChangeIndex(i);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerOverlay}>
        <TouchableOpacity style={styles.viewerCloseBtn} onPress={onClose}>
          <IconClose size={20} color="#fff" />
        </TouchableOpacity>
        {images.length > 1 ? (
          <Text style={styles.viewerCounter}>{index + 1} / {images.length}</Text>
        ) : null}

        <FlatList
          ref={mainListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => String(item.id || i)}
          initialScrollIndex={Math.min(index, images.length - 1)}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            onChangeIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={styles.viewerPage}>
              <Image source={{ uri: item.media_url }} style={styles.viewerImage} resizeMode="contain" />
            </View>
          )}
        />

        {/* Pastki filmstrip — Telegramdagidek doim ko'rinadi (1tadan ko'p rasm bo'lsa) */}
        {images.length > 1 ? (
          <View style={styles.bottomStripWrap}>
            <FlatList
              ref={stripListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={images}
              keyExtractor={(item, i) => String(item.id || i)}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
              renderItem={({ item, index: i }) => (
                <TouchableOpacity onPress={() => goTo(i)} style={[styles.bottomThumb, i === index && styles.bottomThumbActive]}>
                  <Image source={{ uri: item.media_url }} style={styles.bottomThumbImg} />
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}