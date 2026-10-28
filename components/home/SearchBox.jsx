import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/home/FeedStyles";
import { getInitials } from "../../utils/home/Formatters";
import { Avatar } from "./Avatar";
import { IconChevronRight, IconClose, IconSearch } from "./icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function SearchBox({ users = [] }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    setSuggestions(
      users
        .filter((u) => u.username?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q))
        .slice(0, 5)
    );
  }, [query, users]);


  const goToUser = async (username) => {
    setQuery("");
    setSuggestions([]);
    setFocused(false);

    try {
      // Tizimga kirgan foydalanuvchining username'ini olamiz
      const personUser = await AsyncStorage.getItem("username");

      console.log("Login username:", personUser);
      console.log("Search username:", username);

      // Username'larni solishtiramiz
      if (
        personUser &&
        username.trim().toLowerCase() === personUser.trim().toLowerCase()
      ) {
        // O'z profilingga o'tish
        router.push("/pages/person/ProfileScreen");
      } else {
        // Boshqa foydalanuvchining profiliga o'tish
        router.push(
          `/pages/userAccount?username=${encodeURIComponent(username)}`
        );
      }
    } catch (error) {
      console.error("User navigation error:", error);
    }
  };


  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={[styles.searchBar, { borderColor: focused ? "#0969da" : "#d0d7de" }]}>
        <IconSearch />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search users…"
          placeholderTextColor="#8c959f"
          style={styles.searchInput}
          onSubmitEditing={() => { if (suggestions.length > 0) goToUser(suggestions[0].username); }}
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); }}>
            <IconClose size={14} />
          </TouchableOpacity>
        ) : null}
      </View>

      {focused && query.trim().length > 0 && (
        <View style={styles.searchDropdown}>
          {suggestions.length === 0 ? (
            <Text style={styles.noResultsText}>No results for "{query}"</Text>
          ) : (
            suggestions.map((u, i) => (
              <TouchableOpacity
                key={u.id || i}
                onPress={() => goToUser(u.username)}
                style={[
                  styles.suggestionRow,
                  i < suggestions.length - 1 && styles.suggestionRowBorder,
                ]}
              >
                <Avatar
                  src={u.avatar || u.profile_picture || u.image || null}
                  initials={getInitials(u.full_name || u.username)}
                  size={32}
                  index={i}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionUsername}>@{u.username}</Text>
                  {u.full_name ? <Text style={styles.suggestionFullname}>{u.full_name}</Text> : null}
                </View>
                <IconChevronRight />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}