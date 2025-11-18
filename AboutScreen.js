import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";

const AboutScreen = ({ onBack }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>App Information</Text>

      {/* 🔹 Local profile photo from assets */}
      <Image
        source={require("./assets/russel.png")} // <-- make sure the path is correct
        style={styles.profilePic}
      />

      <Text style={styles.name}>Russel O. Pellazar</Text>

      <Text style={styles.bio}>
        Hello! I am Russel Pellazar, a mobile app and web development beginner.
        I enjoy learning React Native, JavaScript, and building useful apps.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🏡 Address</Text>
        <Text style={styles.infoText}>Catungawan Sur, Guindulman, Bohol</Text>
      </View>

      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#BB86FC", marginBottom: 20 },
  profilePic: { width: 130, height: 130, borderRadius: 65, marginBottom: 15, borderWidth: 3, borderColor: "#BB86FC" },
  name: { fontSize: 22, color: "#fff", fontWeight: "bold", marginBottom: 10 },
  bio: { color: "#ccc", fontSize: 15, textAlign: "center", marginBottom: 20, paddingHorizontal: 10 },
  infoBox: { backgroundColor: "#1E1E1E", width: "100%", padding: 15, borderRadius: 10 },
  infoTitle: { fontSize: 18, fontWeight: "700", color: "#BB86FC", marginBottom: 5 },
  infoText: { color: "#fff", fontSize: 15 },
  backButton: { marginTop: 20, padding: 10, borderRadius: 8, backgroundColor: "#BB86FC" },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default AboutScreen;