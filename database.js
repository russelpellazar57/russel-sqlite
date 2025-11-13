import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import bcrypt from "bcryptjs";

let db;

// Make bcrypt work with Expo Crypto
bcrypt.setRandomFallback((len) => {
  const buf = Crypto.getRandomBytes(len);
  return Array.from(buf);
});

// Initialize Database
export const initDatabase = async () => {
  try {
    const database = await SQLite.openDatabaseAsync("auth.db");
    
    if (!database) {
      throw new Error("Could not open database connection.");
    }
    db = database; // Assign the database object

    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0,
        reaction TEXT, 
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      );
    `);

    // Migration: Add profile_image column if not exists
    await db.execAsync(`ALTER TABLE users ADD COLUMN profile_image TEXT;`).catch(() => {});
    
    // Migration: Add reaction column if not exists
    await db.execAsync(`ALTER TABLE messages ADD COLUMN reaction TEXT;`).catch(() => {}); 

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (username, email, password, profileImage) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    const passwordStr = String(password);
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(passwordStr, salt);

    const result = await db.runAsync(
      "INSERT INTO users (username, email, password, profile_image) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, profileImage || null]
    );

    return { success: true, userId: result.lastInsertRowId };
  } catch (error) {
    console.error("Registration error:", error);
    if (error.message.includes("UNIQUE constraint failed")) {
      return { success: false, error: "Username or email already exists" };
    }
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (username, password) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    const user = await db.getFirstAsync(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!user) return { success: false, error: "Invalid username or password" };

    const passwordMatch = bcrypt.compareSync(String(password), user.password);
    if (!passwordMatch) return { success: false, error: "Invalid username or password" };

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImage: user.profile_image,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
};

// Get all chat users except current user
export const getChatUsers = async (currentUserId) => {
  if (!db) return [];
  try {
    const users = await db.getAllAsync(
      "SELECT id, username, email, profile_image FROM users WHERE id != ?",
      [currentUserId]
    );
    return users;
  } catch (error) {
    console.error("Error getting chat users:", error);
    return [];
  }
};

// Send a message
export const sendMessage = async (senderId, receiverId, message) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    const result = await db.runAsync(
      "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message]
    );
    return { success: true, messageId: result.lastInsertRowId };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
};

// Get messages between two users
export const getMessages = async (userId1, userId2) => {
  if (!db || !userId1 || !userId2) return [];
  try {
    const messages = await db.getAllAsync(
      `SELECT m.*, m.reaction, u.username as sender_username
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [userId1, userId2, userId2, userId1]
    );
    return messages;
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
};

// NEW: Add or replace reaction to a message
export const addReactionToMessage = async (messageId, emoji) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    await db.runAsync(
      "UPDATE messages SET reaction = ? WHERE id = ?",
      [emoji, messageId]
    );
    return { success: true };
  } catch (error) {
    console.error("Error adding reaction:", error);
    return { success: false, error: error.message };
  }
};

// NEW: Remove reaction from a message
export const removeReactionFromMessage = async (messageId) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    await db.runAsync(
      "UPDATE messages SET reaction = NULL WHERE id = ?",
      [messageId]
    );
    return { success: true };
  } catch (error) {
    console.error("Error removing reaction:", error);
    return { success: false, error: error.message };
  }
};

// Mark messages as read
export const markMessagesAsRead = async (senderId, receiverId) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    await db.runAsync(
      "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
      [senderId, receiverId]
    );
    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return { success: false };
  }
};

// Get unread message count for a user
export const getUnreadCount = async (userId) => {
  if (!db) return 0;
  try {
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0",
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    return 0;
  }
};

// Delete user account and all related messages
export const deleteUser = async (userId) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    // 1. Delete messages sent or received by this user
    await db.runAsync("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);

    // 2. Delete the user from the users table
    await db.runAsync("DELETE FROM users WHERE id = ?", [userId]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
};
