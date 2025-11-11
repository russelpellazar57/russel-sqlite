import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator, Alert } from "react-native";
import { initDatabase, registerUser, loginUser } from "./database";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import HomeScreen from "./HomeScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initDatabase();
      setIsLoading(false);
    } catch (error) {
      Alert.alert("Error", "Failed to initialize database");
      setIsLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    const result = await loginUser(username, password);

    if (result.success) {
      setCurrentUser(result.user);
      Alert.alert("Success", "Login successful!");
    } else {
      Alert.alert("Login Failed", result.error);
    }
  };

  const handleRegister = async (username, email, password) => {
    const result = await registerUser(username, email, password);

    if (result.success) {
      Alert.alert("Success", "Registration successful! Please login.", [
        { text: "OK", onPress: () => setCurrentScreen("login") },
      ]);
    } else {
      Alert.alert("Registration Failed", result.error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => setCurrentUser(null),
        style: "destructive",
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (currentUser) {
    return (
      <>
        <HomeScreen user={currentUser} onLogout={handleLogout} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      {currentScreen === "login" ? (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentScreen("register")}
        />
      ) : (
        <RegisterScreen
          onRegister={handleRegister}
          onNavigateToLogin={() => setCurrentScreen("login")}
        />
      )}
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
