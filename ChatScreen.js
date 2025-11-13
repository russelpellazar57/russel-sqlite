import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  addReactionToMessage,
  removeReactionFromMessage,
} from "./database";

const EMOJIS = ["👍", "❤️", "😂", "😢", "😮", "😡"];

const ReactionPicker = ({ onSelect, onDismiss }) => (
  <TouchableOpacity style={reactionPickerStyles.overlay} onPress={onDismiss}>
    <View style={reactionPickerStyles.container}>
      {EMOJIS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          style={reactionPickerStyles.emojiButton}
          onPress={() => onSelect(emoji)}
        >
          <Text style={reactionPickerStyles.emojiText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </TouchableOpacity>
);

const ChatScreen = ({ currentUser, selectedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [reactionTarget, setReactionTarget] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [currentUser.id, selectedUser.id]);

  const loadMessages = async () => {
    if (!currentUser.id || !selectedUser.id) return;
    const msgs = await getMessages(currentUser.id, selectedUser.id);
    setMessages(msgs);
  };

  const markAsRead = async () => {
    await markMessagesAsRead(selectedUser.id, currentUser.id);
  };

  const handleSend = async () => {
    if (newMessage.trim()) {
      const result = await sendMessage(
        currentUser.id,
        selectedUser.id,
        newMessage.trim()
      );
      if (result.success) {
        setNewMessage("");
        await loadMessages();
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }
  };

  const handleLongPress = (item, event) => {
    // Directly open emoji picker, no Alert
    setReactionTarget({
      messageId: item.id,
      currentReaction: item.reaction,
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    });
  };

  const handleAddReaction = async (emoji) => {
    if (!reactionTarget) return;

    const { messageId, currentReaction } = reactionTarget;

    try {
      let newReaction;

      if (currentReaction === emoji) {
        await removeReactionFromMessage(messageId);
        newReaction = null;
      } else {
        await addReactionToMessage(messageId, emoji);
        newReaction = emoji;
      }

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, reaction: newReaction } : msg
        )
      );
    } catch (error) {
      console.error("Failed to update reaction:", error);
    } finally {
      setReactionTarget(null);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === currentUser.id;
    const reactionEmoji = item.reaction;

    return (
      <TouchableOpacity
        style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}
        onLongPress={(event) => handleLongPress(item, event)}
        activeOpacity={0.8}
      >
        {!isMyMessage && selectedUser.profileImage && (
          <Image
            source={{ uri: selectedUser.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMyMessage ? styles.myText : styles.theirText]}>
            {item.message}
          </Text>
          <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.theirTimeText]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>

          {reactionEmoji && (
            <View style={[styles.reactionContainer, isMyMessage ? styles.myReaction : styles.theirReaction]}>
              <Text style={styles.reactionText}>{reactionEmoji}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: selectedUser.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>{selectedUser.username}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        {reactionTarget && (
          <ReactionPicker
            onSelect={handleAddReaction}
            onDismiss={() => setReactionTarget(null)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const reactionPickerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10,
  },
  emojiButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  emojiText: {
    fontSize: 24,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#1E1E1E", borderBottomWidth: 1, borderBottomColor: "#333" },
  backButton: { marginRight: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#2A2A2A", borderRadius: 8 },
  backText: { fontSize: 16, color: "#BB86FC", fontWeight: "600" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: "600", flex: 1, color: "#fff" },
  messagesContainer: { padding: 15, flexGrow: 1 },
  messageRow: { flexDirection: "row", marginBottom: 15, maxWidth: "80%" },
  myMessageRow: { alignSelf: "flex-end", justifyContent: "flex-end" },
  theirMessageRow: { alignSelf: "flex-start" },
  messageBubble: { padding: 12, borderRadius: 15, position: 'relative' },
  myBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: "#2A2A2A", borderBottomLeftRadius: 5 },
  messageText: { fontSize: 16, lineHeight: 20 },
  myText: { color: "#fff" },
  theirText: { color: "#fff" },
  timeText: { fontSize: 11, marginTop: 5 },
  myTimeText: { color: "rgba(255, 255, 255, 0.7)", textAlign: "right" },
  theirTimeText: { color: "#aaa" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyText: { fontSize: 16, color: "#999", textAlign: "center" },
  inputContainer: { flexDirection: "row", padding: 10, backgroundColor: "#1E1E1E", borderTopWidth: 1, borderTopColor: "#333", alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#333", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100, fontSize: 16, color: "#fff", backgroundColor: "#2A2A2A" },
  sendButton: { backgroundColor: "#BB86FC", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  sendButtonDisabled: { backgroundColor: "#555" },
  sendButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  messageAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },

  reactionContainer: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  myReaction: {
    right: 0,
    backgroundColor: '#007AFF',
    borderColor: '#fff',
  },
  theirReaction: {
    left: 0,
    backgroundColor: '#2A2A2A',
    borderColor: '#BB86FC',
  },
  reactionText: {
    fontSize: 12,
  }
});

export default ChatScreen;