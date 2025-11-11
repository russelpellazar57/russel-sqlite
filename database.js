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
