import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import bcrypt from "bcryptjs";

let db;

bcrypt.setRandomFallback((len) => {
  const buf = Crypto.getRandomBytes(len);
  return Array.from(buf);
});

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync("auth.db");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      );
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const passwordStr = String(password);
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(passwordStr, salt);

    const result = await db.runAsync(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
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

export const loginUser = async (username, password) => {
  try {
    const user = await db.getFirstAsync(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    // Ensure password is a string and compare
    const passwordStr = String(password);
    const passwordMatch = bcrypt.compareSync(passwordStr, user.password);

    if (!passwordMatch) {
      return { success: false, error: "Invalid username or password" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const users = await db.getAllAsync(
      "SELECT id, username, email, created_at FROM users"
    );
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

// Chat Functions

// Get all users except current user (for chat list)
export const getChatUsers = async (currentUserId) => {
  try {
    const users = await db.getAllAsync(
      "SELECT id, username, email FROM users WHERE id != ?",
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
  try {
    const messages = await db.getAllAsync(
      `SELECT m.*, u.username as sender_username 
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

// Mark messages as read
export const markMessagesAsRead = async (senderId, receiverId) => {
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

// Get unread message count
export const getUnreadCount = async (userId) => {
  try {
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0",
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};
