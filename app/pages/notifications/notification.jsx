// import React, { useState } from "react";
// import {
//   FlatList,
//   Image,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";

// const INITIAL_NOTIFICATIONS = [
//   {
//     id: "1",
//     type: "follow",
//     username: "ali_dev",
//     avatar: "https://i.pravatar.cc/150?img=12",
//     text: "sizni kuzatishni boshladi",
//     time: "2 daqiqa",
//     unread: true,
//   },
//   {
//     id: "2",
//     type: "like",
//     username: "sardor",
//     avatar: "https://i.pravatar.cc/150?img=13",
//     text: "postingizga layk bosdi",
//     time: "5 daqiqa",
//     unread: true,
//     postImage: "https://picsum.photos/200/200?random=10",
//   },
//   {
//     id: "3",
//     type: "comment",
//     username: "bekzod",
//     avatar: "https://i.pravatar.cc/150?img=14",
//     text: "postingizga komment yozdi",
//     comment: "Juda yaxshi post 🔥",
//     time: "15 daqiqa",
//     unread: true,
//     postImage: "https://picsum.photos/200/200?random=11",
//   },
//   {
//     id: "4",
//     type: "message",
//     username: "jamshid",
//     avatar: "https://i.pravatar.cc/150?img=15",
//     text: "sizga xabar yubordi",
//     message: "Salom, qalaysan?",
//     time: "30 daqiqa",
//     unread: false,
//   },
//   {
//     id: "5",
//     type: "post",
//     username: "developer_uz",
//     avatar: "https://i.pravatar.cc/150?img=16",
//     text: "yangi post joyladi",
//     time: "1 soat",
//     unread: false,
//     postImage: "https://picsum.photos/200/200?random=12",
//   },
//   {
//     id: "6",
//     type: "video",
//     username: "coding_world",
//     avatar: "https://i.pravatar.cc/150?img=17",
//     text: "yangi video joyladi",
//     time: "2 soat",
//     unread: false,
//     postImage: "https://picsum.photos/200/200?random=13",
//   },
//   {
//     id: "7",
//     type: "mention",
//     username: "umar",
//     avatar: "https://i.pravatar.cc/150?img=18",
//     text: "sizni kommentda belgiladi",
//     comment: "@Sobir zo'r ekan!",
//     time: "3 soat",
//     unread: false,
//   },
//   {
//     id: "8",
//     type: "reply",
//     username: "developer",
//     avatar: "https://i.pravatar.cc/150?img=19",
//     text: "kommentingizga javob yozdi",
//     comment: "Ha, men ham shunday o'ylayman",
//     time: "5 soat",
//     unread: false,
//   },
//   {
//     id: "9",
//     type: "system",
//     username: "Instadew",
//     avatar: null,
//     text: "Sizning akkauntingiz muvaffaqiyatli yangilandi",
//     time: "Kecha",
//     unread: false,
//   },
// ];

// const TYPE_CONFIG = {
//   follow: {
//     icon: "person-add",
//     color: "#4CAF50",
//   },

//   like: {
//     icon: "heart",
//     color: "#FF3040",
//   },

//   comment: {
//     icon: "chatbubble",
//     color: "#2196F3",
//   },

//   message: {
//     icon: "chatbox",
//     color: "#007AFF",
//   },

//   post: {
//     icon: "image",
//     color: "#FF9500",
//   },

//   video: {
//     icon: "play-circle",
//     color: "#AF52DE",
//   },

//   mention: {
//     icon: "at",
//     color: "#5856D6",
//   },

//   reply: {
//     icon: "return-down-forward",
//     color: "#FF9500",
//   },

//   system: {
//     icon: "notifications",
//     color: "#607D8B",
//   },
// };

// export default function Notifications() {
//   const router = useRouter();

//   const [notifications, setNotifications] = useState(
//     INITIAL_NOTIFICATIONS
//   );

//   // ============================================
//   // O'QILGAN QILISH
//   // ============================================

//   const markAsRead = (id) => {
//     setNotifications((prev) =>
//       prev.map((item) =>
//         item.id === id
//           ? {
//               ...item,
//               unread: false,
//             }
//           : item
//       )
//     );
//   };

//   // ============================================
//   // HAMMASINI O'QILGAN QILISH
//   // ============================================

//   const markAllAsRead = () => {
//     setNotifications((prev) =>
//       prev.map((item) => ({
//         ...item,
//         unread: false,
//       }))
//     );
//   };

//   // ============================================
//   // NOTIFICATION BOSILGANDA
//   // ============================================

//   const handleNotificationPress = (item) => {
//     markAsRead(item.id);

//     if (item.type === "message") {
//       // keyin ChatScreen route qo'yamiz
//       console.log("Open chat:", item.username);
//       return;
//     }

//     if (item.type === "follow") {
//       // keyin user profile route qo'yamiz
//       console.log("Open profile:", item.username);
//       return;
//     }

//     if (
//       item.type === "like" ||
//       item.type === "comment" ||
//       item.type === "reply"
//     ) {
//       // keyin postga o'tkazamiz
//       console.log("Open post:", item.id);
//       return;
//     }
//   };

//   // ============================================
//   // AVATAR
//   // ============================================

//   const renderAvatar = (item) => {
//     if (!item.avatar) {
//       return (
//         <View style={styles.defaultAvatar}>
//           <Ionicons
//             name="notifications"
//             size={24}
//             color="#777"
//           />
//         </View>
//       );
//     }

//     return (
//       <Image
//         source={{
//           uri: item.avatar,
//         }}
//         style={styles.avatar}
//       />
//     );
//   };

//   // ============================================
//   // TYPE ICON
//   // ============================================

//   const renderTypeIcon = (type) => {
//     const config =
//       TYPE_CONFIG[type] || TYPE_CONFIG.system;

//     return (
//       <View
//         style={[
//           styles.typeIcon,
//           {
//             backgroundColor: config.color,
//           },
//         ]}
//       >
//         <Ionicons
//           name={config.icon}
//           size={13}
//           color="#fff"
//         />
//       </View>
//     );
//   };

//   // ============================================
//   // NOTIFICATION ITEM
//   // ============================================

//   const renderItem = ({ item }) => {
//     return (
//       <Pressable
//         onPress={() =>
//           handleNotificationPress(item)
//         }
//         style={[
//           styles.notification,
//           item.unread && styles.unreadNotification,
//         ]}
//       >
//         {/* AVATAR */}
//         <View style={styles.avatarContainer}>
//           {renderAvatar(item)}

//           {renderTypeIcon(item.type)}
//         </View>

//         {/* CONTENT */}
//         <View style={styles.content}>
//           <Text style={styles.notificationText}>
//             <Text style={styles.username}>
//               {item.username}
//             </Text>{" "}
//             {item.text}
//           </Text>

//           {/* COMMENT */}
//           {item.comment && (
//             <Text
//               style={styles.comment}
//               numberOfLines={1}
//             >
//               "{item.comment}"
//             </Text>
//           )}

//           {/* MESSAGE */}
//           {item.message && (
//             <Text
//               style={styles.message}
//               numberOfLines={1}
//             >
//               {item.message}
//             </Text>
//           )}

//           <Text style={styles.time}>
//             {item.time}
//           </Text>
//         </View>

//         {/* POST IMAGE */}
//         {item.postImage && (
//           <Image
//             source={{
//               uri: item.postImage,
//             }}
//             style={styles.postImage}
//           />
//         )}

//         {/* UNREAD DOT */}
//         {item.unread && (
//           <View style={styles.unreadDot} />
//         )}
//       </Pressable>
//     );
//   };

//   // ============================================
//   // HEADER
//   // ============================================

//   const unreadCount = notifications.filter(
//     (item) => item.unread
//   ).length;

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}

//       <View style={styles.header}>
//         <Pressable
//           onPress={() => router.push("/pages/home/FeedScreen")}
//           style={styles.headerButton}
//         >
//           <Ionicons
//             name="arrow-back"
//             size={25}
//             color="#111"
//           />
//         </Pressable>

//         <View style={styles.headerTitleContainer}>
//           <Text style={styles.headerTitle}>
//             Notifications
//           </Text>

//           {unreadCount > 0 && (
//             <View style={styles.countBadge}>
//               <Text style={styles.countText}>
//                 {unreadCount}
//               </Text>
//             </View>
//           )}
//         </View>

//         <Pressable
//           onPress={markAllAsRead}
//           style={styles.headerButton}
//         >
//           <Ionicons
//             name="checkmark-done"
//             size={24}
//             color="#111"
//           />
//         </Pressable>
//       </View>

//       {/* LIST */}

//       <FlatList
//         data={notifications}
//         keyExtractor={(item) =>
//           String(item.id)
//         }
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.list}
//         ItemSeparatorComponent={() => (
//           <View style={styles.separator} />
//         )}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },

//   // ============================================
//   // HEADER
//   // ============================================

//   header: {
//     height: 60,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },

//   headerButton: {
//     width: 42,
//     height: 42,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   headerTitleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 7,
//   },

//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#111",
//   },

//   countBadge: {
//     minWidth: 21,
//     height: 21,
//     paddingHorizontal: 6,
//     borderRadius: 11,
//     backgroundColor: "#FF3040",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   countText: {
//     color: "#fff",
//     fontSize: 11,
//     fontWeight: "700",
//   },

//   // ============================================
//   // LIST
//   // ============================================

//   list: {
//     paddingBottom: 30,
//   },

//   notification: {
//     minHeight: 82,
//     paddingHorizontal: 15,
//     paddingVertical: 11,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//   },

//   unreadNotification: {
//     backgroundColor: "#F7F9FF",
//   },

//   separator: {
//     height: 1,
//     backgroundColor: "#f1f1f1",
//     marginLeft: 80,
//   },

//   // ============================================
//   // AVATAR
//   // ============================================

//   avatarContainer: {
//     width: 55,
//     height: 55,
//     marginRight: 12,
//     position: "relative",
//   },

//   avatar: {
//     width: 55,
//     height: 55,
//     borderRadius: 28,
//   },

//   defaultAvatar: {
//     width: 55,
//     height: 55,
//     borderRadius: 28,
//     backgroundColor: "#eee",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   typeIcon: {
//     position: "absolute",
//     right: -4,
//     bottom: -2,
//     width: 23,
//     height: 23,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   // ============================================
//   // CONTENT
//   // ============================================

//   content: {
//     flex: 1,
//     paddingRight: 8,
//   },

//   notificationText: {
//     fontSize: 14,
//     lineHeight: 20,
//     color: "#333",
//   },

//   username: {
//     fontWeight: "700",
//     color: "#111",
//   },

//   comment: {
//     marginTop: 3,
//     fontSize: 13,
//     color: "#777",
//   },

//   message: {
//     marginTop: 3,
//     fontSize: 13,
//     color: "#777",
//   },

//   time: {
//     marginTop: 4,
//     fontSize: 12,
//     color: "#999",
//   },

//   // ============================================
//   // POST IMAGE
//   // ============================================

//   postImage: {
//     width: 54,
//     height: 54,
//     borderRadius: 7,
//     backgroundColor: "#eee",
//   },

//   // ============================================
//   // UNREAD
//   // ============================================

//   unreadDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#3478F6",
//     marginLeft: 5,
//   },
// });











import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import  API from "../../../api/api/server";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// API CONFIG
// ============================================================

// O'ZINGNING BACKEND IP / DOMAININGNI YOZ
const API_BASE_URL = "http://10.20.198.60:8000";

// ============================================================
// NOTIFICATION TYPES
// ============================================================

const TYPE_CONFIG = {
  follow: {
    icon: "person-add",
    color: "#4CAF50",
  },

  like: {
    icon: "heart",
    color: "#FF3040",
  },

  comment: {
    icon: "chatbubble",
    color: "#2196F3",
  },

  message: {
    icon: "chatbox",
    color: "#007AFF",
  },

  post: {
    icon: "image",
    color: "#FF9500",
  },

  video: {
    icon: "play-circle",
    color: "#AF52DE",
  },

  mention: {
    icon: "at",
    color: "#5856D6",
  },

  reply: {
    icon: "return-down-forward",
    color: "#FF9500",
  },

  system: {
    icon: "notifications",
    color: "#607D8B",
  },
};

// ============================================================
// CONTENT TYPE -> FRONTEND TYPE
// ============================================================

// Hozircha backenddagi content_type qiymatlarini aniq
// bilmaganimiz uchun system ishlatamiz.
//
// Keyinchalik masalan:
// content_type 14 = follow
// content_type 15 = like
// kabi mappingni shu yerda beramiz.

const getNotificationType = (item) => {
  // Misol:
  //
  // if (item.content_type === 14) {
  //   return "follow";
  // }

  return "system";
};

// ============================================================
// DATE FORMAT
// ============================================================

const formatTime = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const diff = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (diff < 60) {
    return "hozir";
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} daqiqa`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} soat`;
  }

  if (diff < 172800) {
    return "Kecha";
  }

  return date.toLocaleDateString("uz-UZ");
};

// ============================================================
// COMPONENT
// ============================================================

export default function Notifications() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================================
  // ACCESS TOKEN
  // ==========================================================

  /*
    BU YERGA SENING ACCESS TOKENINGNI OLADIGAN KODNI QO'YISH KERAK.

    Masalan agar AsyncStorage ishlatsang:

    import AsyncStorage from "@react-native-async-storage/async-storage";

    const accessToken =
      await AsyncStorage.getItem("access_token");

    Hozircha getAccessToken funksiyasi orqali ajratib qo'ydik.
  */

  const getAccessToken = async () => {
    const token = await AsyncStorage.getItem("token");
    return token;
  };

  // ==========================================================
  // GET NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const accessToken = await getAccessToken();

        if (!accessToken) {
          throw new Error("Access token topilmadi");
        }

        const response = await API.get(
          `/notifications/notifications/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        /*
          Backend:

          [
            {
              "id": 11,
              "user": 1,
              "content_type": 14,
              "object_id": 7,
              "message": "zari started following you.",
              "is_read": false,
              "created_at": "...",
              "updated_at": "..."
            }
          ]
        */

        const data = response.data;
        console.log(data);

        // Agar backend oddiy array qaytarsa
        if (Array.isArray(data)) {
          setNotifications(data);
        }

        // Agar backend:
        // { "results": [...] }
        // qaytarsa
        else if (Array.isArray(data?.results)) {
          setNotifications(data.results);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error(
          "Fetch notifications error:",
          err?.response?.data || err.message
        );

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Notificationlarni yuklashda xatolik"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ==========================================================
  // MARK ONE AS READ
  // ==========================================================

  const markAsRead = async (id) => {
    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("Access token topilmadi");
      }

      /*
        PATCH:

        /notifications/notifications/{id}/read/

        Masalan:

        PATCH /notifications/notifications/11/read/
      */

      await API.patch(
        `/notifications/notifications/${id}/read/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Backendga muvaffaqiyatli yuborilgandan keyin
      // local UI'da ham is_read = true qilamiz.

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Mark notification as read error:",
        err?.response?.data || err.message
      );
    }
  };

  // ==========================================================
  // NOTIFICATION PRESS
  // ==========================================================

  const handleNotificationPress = async (item) => {
    // Avval backendda o'qilgan qilish
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    /*
      Keyinchalik object_id va content_type orqali
      kerakli sahifaga o'tkazish mumkin.

      Masalan:

      follow -> user profile
      like   -> post
      comment -> post/comment
      message -> chat
    */

    console.log("Notification pressed:", item);
  };

  // ==========================================================
  // TYPE ICON
  // ==========================================================

  const renderTypeIcon = (item) => {
    const type = getNotificationType(item);

    const config =
      TYPE_CONFIG[type] || TYPE_CONFIG.system;

    return (
      <View
        style={[
          styles.typeIcon,
          {
            backgroundColor: config.color,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={13}
          color="#fff"
        />
      </View>
    );
  };

  // ==========================================================
  // NOTIFICATION ITEM
  // ==========================================================

  const renderItem = ({ item }) => {
    return (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.notification,
          !item.is_read && styles.unreadNotification,
        ]}
      >
        {/* ICON */}

        <View style={styles.avatarContainer}>
          <View style={styles.defaultAvatar}>
            <Ionicons
              name="notifications"
              size={24}
              color="#777"
            />
          </View>

          {renderTypeIcon(item)}
        </View>

        {/* CONTENT */}

        <View style={styles.content}>
          <Text
            style={[
              styles.notificationText,
              !item.is_read && styles.unreadText,
            ]}
          >
            {item.message}
          </Text>

          <Text style={styles.time}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        {/* UNREAD DOT */}

        {!item.is_read && (
          <View style={styles.unreadDot} />
        )}
      </Pressable>
    );
  };

  // ==========================================================
  // UNREAD COUNT
  // ==========================================================

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.push("/pages/home/FeedScreen")
            }
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color="#111"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          <View style={styles.headerButton} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#3478F6"
          />

          <Text style={styles.loadingText}>
            Notificationlar yuklanmoqda...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.push("/pages/home/FeedScreen")
          }
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111"
          />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Hozir mark all yo'q */}
        <View style={styles.headerButton} />
      </View>

      {/* ERROR */}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color="#FF3040"
          />

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            onPress={() => fetchNotifications()}
          >
            <Text style={styles.retryText}>
              Qayta urinish
            </Text>
          </Pressable>
        </View>
      )}

      {/* LIST */}

      <FlatList
        data={notifications}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          notifications.length === 0 &&
            styles.emptyList,
        ]}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
        refreshing={refreshing}
        onRefresh={() => fetchNotifications(true)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={55}
              color="#bbb"
            />

            <Text style={styles.emptyTitle}>
              Notificationlar yo'q
            </Text>

            <Text style={styles.emptyText}>
              Yangi xabarlar shu yerda ko'rinadi.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // HEADER

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  countBadge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#FF3040",
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // LIST

  list: {
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  notification: {
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  unreadNotification: {
    backgroundColor: "#F7F9FF",
  },

  separator: {
    height: 1,
    backgroundColor: "#f1f1f1",
    marginLeft: 80,
  },

  // ICON

  avatarContainer: {
    width: 55,
    height: 55,
    marginRight: 12,
    position: "relative",
  },

  defaultAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },

  typeIcon: {
    position: "absolute",
    right: -4,
    bottom: -2,
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  // CONTENT

  content: {
    flex: 1,
    paddingRight: 8,
  },

  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },

  unreadText: {
    color: "#111",
    fontWeight: "500",
  },

  time: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
  },

  // UNREAD

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3478F6",
    marginLeft: 5,
  },

  // LOADING

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#777",
  },

  // ERROR

  errorContainer: {
    margin: 15,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF4F4",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: "#555",
    fontSize: 13,
  },

  retryText: {
    color: "#3478F6",
    fontWeight: "700",
  },

  // EMPTY

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: "700",
    color: "#444",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});

/*

### Hozirgi kodda bitta joyni o‘zgartirasan

Men getAccessToken()ni ataylab alohida qoldirdim. Chunki sening loyihangda access token qayerda saqlanishini aniq bilmayman.

Masalan, agar sen AsyncStorage ishlatayotgan bo‘lsang:

```bash
npm install @react-native-async-storage/async-storage axios
```

va:

```js
import AsyncStorage from "@react-native-async-storage/async-storage";
```

keyin:

```js
const getAccessToken = async () => {
  return await AsyncStorage.getItem("access_token");
};
```

qilasan.

Agar senda token boshqa joyda saqlanayotgan bo‘lsa, o‘sha joydan olamiz.

### PATCH qanday ishlaydi?

Masalan backenddan:

```json
{
  "id": 11,
  "user": 1,
  "content_type": 14,
  "object_id": 7,
  "message": "zari started following you.",
  "is_read": false,
  "created_at": "2026-09-29T10:31:39.547188Z",
  "updated_at": "2026-09-29T10:31:39.547583Z"
}
```

keladi.

User bosadi:

```text
zari started following you.
        ↓
PATCH
/notifications/notifications/11/read/
        ↓
backend
        ↓
is_read = true
```

Frontend ham darhol:

```js
is_read: true
```

qilib qo‘yadi.

---

### Telefon tepasidagi notification masalasi

Bu `Notifications.jsx`ning o‘zidan hal bo‘lmaydi.

Senga Telegramga o‘xshagan:

```text
📱 Telefon ekranida

┌─────────────────────────────┐
│ Instadew                     │
│ zari started following you.  │
│                             │
└─────────────────────────────┘
```

kerak bo‘lsa, keyingi bosqichda **Expo Notifications + Expo Push Token + backend push endpoint** qilamiz.

Bu bilan:

* 📱 ilova ochiq bo‘lsa
* 🔒 ekran qulflangan bo‘lsa
* 💤 ilova backgroundda bo‘lsa
* ❌ ilova yopilgan bo‘lsa

push notification tizimi ishlashi mumkin.

**Muhim:** faqat hozirgi `GET /notifications/notifications/` endpoint bilan ilova yopiq paytda telefon tepasiga Telegram kabi notification chiqarib bo‘lmaydi. Backend yangi notification yaratilganida push service orqali telefonga push yuborishi kerak.

Yana bir narsa: sen bergan `content_type: 14` nimani anglatishini bilsak, men `14 → follow`, `like`, `comment`, `message` kabi **real icon va bosilganda `object_id` bo‘yicha kerakli screen'ga o'tish**ni ham ulab beraman.

*/