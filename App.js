import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator, Alert } from "react-native";
// Imported deleteUser from your database.js
import { initDatabase, registerUser, loginUser, deleteUser } from "./database";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import HomeScreen from "./HomeScreen";
import ChatListScreen from "./ChatListScreen";
import ChatScreen from "./ChatScreen";

export default function App() {
const [isLoading, setIsLoading] = useState(true);
const [currentScreen, setCurrentScreen] = useState("login");
const [currentUser, setCurrentUser] = useState(null);
const [selectedChatUser, setSelectedChatUser] = useState(null);

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
  setCurrentScreen("home"); // Navigate to home upon successful login  
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
onPress: () => {
setCurrentUser(null);
setCurrentScreen("login");
setSelectedChatUser(null);
},
style: "destructive",
},
]);
};

// Logic to handle account deletion
const handleDeleteAccount = async () => {
if (!currentUser) return;

try {  
  console.log(`Attempting to delete account for user ID: ${currentUser.id}`);  

  // 1. CALL THE DATABASE FUNCTION FOR PERMANENT DELETION  
  const deletionResult = await deleteUser(currentUser.id);   

  if (deletionResult.success) {  
    console.log(`Successfully deleted account for user ID: ${currentUser.id}`);  
      
    // 2. RESET ALL STATE TO RETURN TO LOGGED-OUT VIEW  
    setCurrentUser(null);   
    setCurrentScreen("login"); // THIS ENSURES YOU LEAVE THE CHAT SCREEN  
    setSelectedChatUser(null);   

    Alert.alert("Success", "Account successfully and permanently deleted.");  
  } else {  
     // Handle database deletion error  
     throw new Error(deletionResult.error || "Failed to delete from database.");  
  }  
} catch (error) {  
  console.error("Account deletion failed:", error);  
  Alert.alert("Error", `Failed to delete account: ${error.message}. Please try again later.`);  
}

};

const handleOpenChat = () => {
setCurrentScreen("chatList");
};

const handleSelectChatUser = (user) => {
setSelectedChatUser(user);
setCurrentScreen("chat");
};

const handleBackToHome = () => {
setCurrentScreen("home");
setSelectedChatUser(null);
};

const handleBackToChatList = () => {
setCurrentScreen("chatList");
setSelectedChatUser(null);
};

if (isLoading) {
return (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color="#BB86FC" />
</View>
);
}

if (currentUser) {
if (currentScreen === "chat" && selectedChatUser) {
return (
<>
<ChatScreen  
currentUser={currentUser}  
selectedUser={selectedChatUser}  
onBack={handleBackToChatList}  
/>
<StatusBar style="auto" />
</>
);
}

if (currentScreen === "chatList") {  
  return (  
    <>  
      <ChatListScreen  
        currentUser={currentUser}  
        onSelectUser={handleSelectChatUser}  
        onBack={handleBackToHome}  
      />  
      <StatusBar style="auto" />  
    </>  
  );  
}  

return (  
  <>  
    <HomeScreen  
      user={currentUser}  
      onLogout={handleLogout}  
      onOpenChat={handleOpenChat}  
      onDeleteAccount={handleDeleteAccount}   
    />  
    <StatusBar style="auto" />  
  </>  
);

}

// If currentUser is NULL (after deletion), this is rendered:
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
backgroundColor: "#121212",
alignItems: "center",
justifyContent: "center",
},
});