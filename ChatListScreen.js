import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { getChatUsers, getUnreadCount } from "./database";

const ChatListScreen = ({ currentUser, onSelectUser, onBack }) => {
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    const userList = await getChatUsers(currentUser.id);
    
    const usersWithLocalImages = await Promise.all(
      userList.map(async (user) => {
        const savedUri = await AsyncStorage.getItem(`profile_${user.id}`); 
        if (savedUri) {
          return { ...user, profileImage: savedUri };
        }
        return user;
      })
    );
    
    setUsers(usersWithLocalImages);
  }, [currentUser.id]);

  const loadUnreadCount = async () => {
    const count = await getUnreadCount(currentUser.id);
    setUnreadCount(count);
  };

  useEffect(() => {
    loadUsers();
    loadUnreadCount();
  }, [loadUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    await loadUnreadCount();
    setRefreshing(false);
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => onSelectUser(item)}>
      <Image
        source={{ uri: item.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users available to chat</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#1E1E1E", borderBottomWidth: 1, borderBottomColor: "#333" },
  backButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#2A2A2A", borderRadius: 8, marginRight: 10 },
  backText: { fontSize: 16, color: "#BB86FC", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "bold", flex: 1, textAlign: "center", color: "#fff" },
  badge: { backgroundColor: "#CF6679", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  listContent: { padding: 10 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E1E1E", padding: 15, marginBottom: 10, borderRadius: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 4 },
  email: { fontSize: 14, color: "#aaa" },
  arrow: { fontSize: 24, color: "#888" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 50 },
  emptyText: { fontSize: 16, color: "#999" },
});

export default ChatListScreen;