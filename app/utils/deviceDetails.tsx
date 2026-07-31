

// deviceDetails.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Smartphone, Monitor, Tablet, Clock, MapPin, Globe, Wifi, Power, CheckCircle, Circle, ChevronRight } from "lucide-react-native";
import { getSessions } from "./getSessions";

const { width } = Dimensions.get("window");

// ==================== TYPES ====================
interface Session {
  id: number | string;
  device_name: string;
  platform: string;
  browser?: string;
  ip_address: string;
  city?: string;
  country?: string;
  login_at: string;
  last_activity: string;
  is_active: boolean;
  is_this_device: boolean;
  os_version?: string;
  device_type?: string;
  screen_resolution?: string;
}

// ==================== CONSTANTS ====================
const COLORS = {
  primary: "#2563eb",
  primaryLight: "#3b82f6",
  primaryDark: "#1d4ed8",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayDark: "#374151",
  white: "#ffffff",
  card: "#ffffff",
  shadow: "#000000",
  border: "#e5e7eb",
};

const STATUS_CONFIG = {
  active: {
    label: "Online",
    icon: Power,
    color: COLORS.success,
    bgColor: "#dcfce7",
  },
  inactive: {
    label: "Offline",
    icon: Power,
    color: COLORS.gray,
    bgColor: "#f3f4f6",
  },
};

const PLATFORM_ICONS = {
  android: Smartphone,
  ios: Smartphone,
  web: Monitor,
  tablet: Tablet,
  default: Monitor,
};

// ==================== HELPERS ====================
const getPlatformIcon = (platform: string): any => {
  const normalized = platform?.toLowerCase() || "";
  if (normalized.includes("android")) return PLATFORM_ICONS.android;
  if (normalized.includes("ios") || normalized.includes("iphone")) return PLATFORM_ICONS.ios;
  if (normalized.includes("tablet") || normalized.includes("ipad")) return PLATFORM_ICONS.tablet;
  return PLATFORM_ICONS.default;
};

const getDeviceType = (platform: string): string => {
  const normalized = platform?.toLowerCase() || "";
  if (normalized.includes("android") || normalized.includes("ios")) return "Mobile";
  if (normalized.includes("tablet") || normalized.includes("ipad")) return "Tablet";
  return "Desktop";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

const getStatusBadgeStyle = (isActive: boolean) => {
  return isActive ? styles.statusActive : styles.statusInactive;
};

// ==================== COMPONENTS ====================

// Session Card Component
const SessionCard = React.memo(({ session, isFirst, isLast }: { 
  session: Session; 
  isFirst: boolean; 
  isLast: boolean;
}) => {
  const { 
    id, 
    device_name, 
    platform, 
    browser, 
    ip_address, 
    city, 
    country, 
    login_at, 
    last_activity, 
    is_active, 
    is_this_device,
    os_version,
    screen_resolution 
  } = session;

  const PlatformIcon = getPlatformIcon(platform);
  const deviceType = getDeviceType(platform);
  const statusConfig = is_active ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
  const StatusIcon = statusConfig.icon;

  const handleDevicePress = useCallback(() => {
    Alert.alert(
      "Device Details",
      `Device: ${device_name}\nPlatform: ${platform}\nBrowser: ${browser || "N/A"}\nIP: ${ip_address}\nLocation: ${city || "Unknown"}, ${country || "Unknown"}\nStatus: ${is_active ? "Online" : "Offline"}`,
      [{ text: "OK" }]
    );
  }, [device_name, platform, browser, ip_address, city, country, is_active]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleDevicePress}
      style={[
        styles.card,
        isFirst && styles.cardFirst,
        isLast && styles.cardLast,
        is_this_device && styles.cardCurrentDevice,
      ]}
    >
      {/* Left: Icon with Status Indicator */}
      <View style={styles.iconContainer}>
        <View style={styles.iconWrapper}>
          <PlatformIcon size={28} color={COLORS.primary} strokeWidth={1.8} />
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(is_active)]}>
          <StatusIcon size={12} color={statusConfig.color} strokeWidth={2.5} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Middle: Device Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device_name || "Unknown Device"}
          </Text>
          {is_this_device && (
            <View style={styles.thisDeviceBadge}>
              <CheckCircle size={12} color={COLORS.white} />
              <Text style={styles.thisDeviceText}>Current</Text>
            </View>
          )}
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Globe size={14} color={COLORS.gray} />
            <Text style={styles.infoText}>
              {city || "Unknown"}, {country || "N/A"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Wifi size={14} color={COLORS.gray} />
            <Text style={styles.infoText}>{ip_address}</Text>
          </View>
          {browser && (
            <View style={styles.infoItem}>
              <Monitor size={14} color={COLORS.gray} />
              <Text style={styles.infoText}>{browser}</Text>
            </View>
          )}
          {deviceType && (
            <View style={styles.infoItem}>
              <Smartphone size={14} color={COLORS.gray} />
              <Text style={styles.infoText}>{deviceType}</Text>
            </View>
          )}
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Clock size={14} color={COLORS.gray} />
            <Text style={styles.timeText}>Login: {formatDate(login_at)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Clock size={14} color={COLORS.gray} />
            <Text style={styles.timeText}>Active: {formatDate(last_activity)}</Text>
          </View>
        </View>

        {os_version && (
          <Text style={styles.metaText}>OS: {os_version}</Text>
        )}
        {screen_resolution && (
          <Text style={styles.metaText}>Resolution: {screen_resolution}</Text>
        )}
      </View>

      {/* Right: Chevron */}
      <ChevronRight size={20} color={COLORS.gray} strokeWidth={1.5} />
    </TouchableOpacity>
  );
});

// Session Header Component
const SessionHeader = React.memo(({ count }: { count: number }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>Active Sessions</Text>
      <View style={styles.sessionCount}>
        <Text style={styles.sessionCountText}>{count}</Text>
      </View>
    </View>
    <Text style={styles.headerSubtitle}>
      {count === 0 ? "No active sessions found" : `You have ${count} active session${count > 1 ? "s" : ""}`}
    </Text>
  </View>
));

// Empty State Component
const EmptyState = React.memo(() => (
  <View style={styles.emptyContainer}>
    <Monitor size={64} color={COLORS.gray} strokeWidth={1.2} />
    <Text style={styles.emptyTitle}>No Sessions Found</Text>
    <Text style={styles.emptyText}>
      You don't have any active sessions. Log in from a device to see it here.
    </Text>
  </View>
));

// ==================== MAIN COMPONENT ====================
export default async function DeviceDetails() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions data
  const loadSessions = useCallback(async (showRefresh = false) => {
    if (!showRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getSessions();
      
      // Validate and normalize data
      const normalizedData = Array.isArray(data) 
        ? data.filter(item => item && typeof item === 'object')
        : [];
      
      setSessions(normalizedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load sessions";
      setError(errorMessage);
      console.error("Session load error:", error);
      
      // Show user-friendly alert
      Alert.alert(
        "Error",
        "Unable to load session data. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions(true);
  }, [loadSessions]);

  // Memoized data for FlatList
  const keyExtractor = useCallback((item: Session) => 
    item.id?.toString() || Math.random().toString()
  , []);

  const renderItem = useCallback(({ item, index }: { item: Session; index: number }) => (
    <SessionCard 
      session={item}
      isFirst={index === 0}
      isLast={index === sessions.length - 1}
    />
  ), [sessions.length]);

  const ListHeaderComponent = useMemo(() => 
    sessions.length > 0 ? <SessionHeader count={sessions.length} /> : null
  , [sessions.length]);

  const ListEmptyComponent = useMemo(() => 
    <EmptyState />, []
  );

  // ==================== RENDER ====================
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <FlatList
          data={sessions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          getItemLayout={(data, index) => ({
            length: 180,
            offset: 180 * index,
            index,
          })}
        />
      </View>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.grayLight,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.grayLight,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.grayDark,
  },
  sessionCount: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionCountText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  cardFirst: {
    marginTop: 0,
  },
  cardLast: {
    marginBottom: 0,
  },
  cardCurrentDevice: {
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    backgroundColor: "#eff6ff",
  },
  iconContainer: {
    alignItems: "center",
    gap: 6,
    width: 50,
  },
  iconWrapper: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: "#dcfce7",
  },
  statusInactive: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailsContainer: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.grayDark,
    flex: 1,
  },
  thisDeviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  thisDeviceText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.grayDark,
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.gray,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.grayDark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 8,
    maxWidth: width * 0.7,
  },
});