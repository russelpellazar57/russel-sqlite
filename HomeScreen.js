import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_PROFILE_URI =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const HomeScreen = ({ user, onLogout, onOpenChat, onDeleteAccount }) => { 
  const [profileUri, setProfileUri] = useState(DEFAULT_PROFILE_URI);
  
  // Removed isEditing state and all related editing logic states
  const [username] = useState(user.username); // Now read-only state
  const [email] = useState(user.email);       // Now read-only state

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedUri = await AsyncStorage.getItem(`profile_${user.id}`);
        if (savedUri) {
          setProfileUri(savedUri);
        } else if (user?.profileImage) {
          setProfileUri(user.profileImage);
        }
      } catch (error) {
        console.log("Failed to load profile image:", error);
      }
    };
    loadProfileImage();
  }, [user.id, user.profileImage]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Cannot access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileUri(uri);
      await AsyncStorage.setItem(`profile_${user.id}`, uri);
    }
  };

  const deleteImage = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setProfileUri(DEFAULT_PROFILE_URI);
            await AsyncStorage.removeItem(`profile_${user.id}`);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ PERMANENTLY DELETE ACCOUNT",
      "This action cannot be undone. All your data will be permanently erased. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "YES, Delete My Account",
          style: "destructive",
          onPress: () => {
            if (onDeleteAccount) onDeleteAccount();
          },
        },
      ]
    );
  };

  // Removed handleEditProfile and handleSaveProfile functions

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage}>
            <Image source={{ uri: profileUri }} style={styles.profileImage} />
          </TouchableOpacity>

          {profileUri !== DEFAULT_PROFILE_URI && (
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={deleteImage}
            >
              <Text style={styles.deleteImageButtonText}>
                ❌ Delete Profile Picture
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.usernameText}>{username}</Text> 
        </View>

        <View style={styles.infoContainer}>
          {/* Always display read-only view */}
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{username}</Text> 
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{email}</Text> 
            </View>
          </>

          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{user.id}</Text>
          </View>
        </View>

        {/* Removed Edit Button and Save Button */}
        {/* Removed conditional rendering for editing state */}

        <TouchableOpacity style={styles.chatButton} onPress={onOpenChat}>
          <Text style={styles.chatButtonText}>💬 Open Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountButtonText}>
            🗑️ Delete Account
          </Text>
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  content: { flex: 1, padding: 20, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#BB86FC",
  },
  deleteImageButton: {
    padding: 8,
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  deleteImageButtonText: {
    color: "#CF6679",
    fontSize: 14,
    fontWeight: "500",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  usernameText: { fontSize: 24, color: "#BB86FC", fontWeight: "600" },
  infoContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    alignItems: "center",
  },
  label: { fontSize: 16, color: "#aaa", fontWeight: "500" },
  value: { fontSize: 16, color: "#fff", fontWeight: "600" },
  
  // Removed styles related to TextInput and editing
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#555",
    padding: 8,
    borderRadius: 5,
    color: "#fff",
    backgroundColor: "#2C2C2C",
  },
  
  // Removed editButton and saveButton styles
  
  chatButton: {
    backgroundColor: "#BB86FC",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: "#CF6679",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15, 
  },
  chatButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deleteAccountButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CF6679", 
    backgroundColor: "transparent",
  },
  deleteAccountButtonText: { 
    color: "#CF6679", 
    fontSize: 16, 
    fontWeight: "600" 
  },
});

export default HomeScreen;
