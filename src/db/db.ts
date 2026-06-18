import fs from "fs";
import path from "path";
import crypto from "crypto";

// Define DB directory and file path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interfaces matching our relational database schema
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  paymentMethod?: string | null;
}

export interface Challenge {
  id: string;
  userId: string;
  currentDay: number; // 1-30
  streak: number;
  xp: number;
  level: number;
  completedCount: number;
  status: "active" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  challengeDay: number; // 1-30 of their challenge
  category: "Hydration" | "Nutrition" | "Physical Health" | "Mental Wellness" | "Recovery";
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  notes: string;
  xpEarned: number;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  sentAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  badgeId: "hydration_hero" | "fitness_warrior" | "mindfulness_master" | "sunlight_champion" | "streak_7" | "streak_30";
  earnedAt: string;
}

export interface UserSettings {
  userId: string;
  morningNotificationTime: string; // e.g. "08:00"
  afternoonNotificationTime: string; // e.g. "16:00"
  nightNotificationTime: string; // e.g. "00:00"
  soundEnabled: boolean;
  darkMode: boolean;
}

export interface DatabaseState {
  users: User[];
  challenges: Challenge[];
  tasks: Task[];
  notifications: NotificationLog[];
  badges: Badge[];
  settings: UserSettings[];
}

// Default initial state
const defaultDbState: DatabaseState = {
  users: [
    // Pre-seed an admin user for the Admin Dashboard
    {
      id: "admin-user-id",
      email: "admin@healthtracker.com",
      passwordHash: "4bc61730bb0b6c62e542cc3f3dd6c6d2cbb54d6fa0a06c888cf3bdafcd6b60bd", // sha256 hash of "admin123" with default salt
      salt: "defaultsalt123",
      name: "Admin Commander",
      isAdmin: true,
      createdAt: new Date().toISOString(),
      paymentMethod: "Admin Corporate Token",
    }
  ],
  challenges: [],
  tasks: [],
  notifications: [],
  badges: [],
  settings: []
};

// Global in-memory DB state
let dbData: DatabaseState = { ...defaultDbState };

// Load database from file if it exists
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      dbData = JSON.parse(data);
      // Ensure all arrays exist
      dbData.users = dbData.users || [];
      dbData.challenges = dbData.challenges || [];
      dbData.tasks = dbData.tasks || [];
      dbData.notifications = dbData.notifications || [];
      dbData.badges = dbData.badges || [];
      dbData.settings = dbData.settings || [];
    } else {
      saveDbSync();
    }
  } catch (error) {
    console.error("Failed to load schema database, active states reset:", error);
    dbData = { ...defaultDbState };
  }
}

// Save database to file
function saveDbSync() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to persist database state to storage:", error);
  }
}

// Initialize on require
loadDb();

/**
 * Native Hashing Utilities (No external binary dependencies)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Direct DB Access Query Layer (Mimics Relational Schema ORM query mechanics)
 */
export const db = {
  // Save helper
  save: () => {
    saveDbSync();
  },

  // USERS
  users: {
    findMany: () => dbData.users,
    findById: (id: string) => dbData.users.find(u => u.id === id),
    findByEmail: (email: string) => dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
    create: (user: Omit<User, "id" | "createdAt">) => {
      const newUser: User = {
        ...user,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
      };
      dbData.users.push(newUser);
      saveDbSync();
      return newUser;
    },
    update: (id: string, updates: Partial<User>) => {
      dbData.users = dbData.users.map(u => {
        if (u.id === id) {
          return {
            ...u,
            ...updates
          };
        }
        return u;
      });
      saveDbSync();
      return dbData.users.find(u => u.id === id);
    }
  },

  // CHALLENGES
  challenges: {
    findMany: () => dbData.challenges,
    findByUserId: (userId: string) => dbData.challenges.find(c => c.userId === userId && c.status === "active"),
    findHistoryByUserId: (userId: string) => dbData.challenges.filter(c => c.userId === userId),
    create: (userId: string) => {
      // Archive any active challenge
      dbData.challenges = dbData.challenges.map(c => 
        c.userId === userId && c.status === "active" ? { ...c, status: "failed", updatedAt: new Date().toISOString() } : c
      );

      const newChallenge: Challenge = {
        id: generateUUID(),
        userId,
        currentDay: 1,
        streak: 0,
        xp: 0,
        level: 1,
        completedCount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbData.challenges.push(newChallenge);
      saveDbSync();
      return newChallenge;
    },
    update: (id: string, updates: Partial<Challenge>) => {
      dbData.challenges = dbData.challenges.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      });
      saveDbSync();
      return dbData.challenges.find(c => c.id === id);
    }
  },

  // TASKS
  tasks: {
    findMany: () => dbData.tasks,
    findByUserId: (userId: string) => dbData.tasks.filter(t => t.userId === userId),
    findDayTasks: (userId: string, day: number) => dbData.tasks.filter(t => t.userId === userId && t.challengeDay === day),
    create: (task: Omit<Task, "id" | "createdAt">) => {
      const newTask: Task = {
        ...task,
        id: generateUUID(),
        createdAt: new Date().toISOString()
      };
      dbData.tasks.push(newTask);
      saveDbSync();
      return newTask;
    },
    update: (id: string, updates: Partial<Task>) => {
      dbData.tasks = dbData.tasks.map(t => {
        if (t.id === id) {
          const updated = {
            ...t,
            ...updates
          };
          return updated;
        }
        return t;
      });
      saveDbSync();
      return dbData.tasks.find(t => t.id === id);
    },
    deleteByUserId: (userId: string) => {
      dbData.tasks = dbData.tasks.filter(t => t.userId !== userId);
      saveDbSync();
    }
  },

  // NOTIFICATIONS
  notifications: {
    findMany: () => dbData.notifications,
    findByUserId: (userId: string) => dbData.notifications.filter(n => n.userId === userId),
    create: (notification: Omit<NotificationLog, "id" | "sentAt">) => {
      const newLog: NotificationLog = {
        ...notification,
        id: generateUUID(),
        sentAt: new Date().toISOString()
      };
      dbData.notifications.push(newLog);
      saveDbSync();
      return newLog;
    }
  },

  // BADGES
  badges: {
    findMany: () => dbData.badges,
    findByUserId: (userId: string) => dbData.badges.filter(b => b.userId === userId),
    create: (userId: string, badgeId: Badge["badgeId"]) => {
      // Check if they already have it
      const alreadyEarned = dbData.badges.some(b => b.userId === userId && b.badgeId === badgeId);
      if (alreadyEarned) return null;

      const newBadge: Badge = {
        id: generateUUID(),
        userId,
        badgeId,
        earnedAt: new Date().toISOString()
      };
      dbData.badges.push(newBadge);
      saveDbSync();
      return newBadge;
    }
  },

  // SETTINGS
  settings: {
    findByUserId: (userId: string): UserSettings => {
      let userSettings = dbData.settings.find(s => s.userId === userId);
      if (!userSettings) {
        userSettings = {
          userId,
          morningNotificationTime: "08:00",
          afternoonNotificationTime: "16:00",
          nightNotificationTime: "00:00",
          soundEnabled: true,
          darkMode: false
        };
        dbData.settings.push(userSettings);
        saveDbSync();
      }
      return userSettings;
    },
    update: (userId: string, updates: Partial<UserSettings>) => {
      let found = false;
      dbData.settings = dbData.settings.map(s => {
        if (s.userId === userId) {
          found = true;
          return { ...s, ...updates };
        }
        return s;
      });
      if (!found) {
        const fullSettings: UserSettings = {
          userId,
          morningNotificationTime: "08:00",
          afternoonNotificationTime: "16:00",
          nightNotificationTime: "00:00",
          soundEnabled: true,
          darkMode: false,
          ...updates
        };
        dbData.settings.push(fullSettings);
      }
      saveDbSync();
      return dbData.settings.find(s => s.userId === userId)!;
    }
  },

  // UTILS
  backup: {
    exportData: (userId: string) => {
      const user = dbData.users.find(u => u.id === userId);
      const challenge = dbData.challenges.filter(c => c.userId === userId);
      const tasks = dbData.tasks.filter(t => t.userId === userId);
      const notifications = dbData.notifications.filter(n => n.userId === userId);
      const badges = dbData.badges.filter(b => b.userId === userId);
      const settings = dbData.settings.find(s => s.userId === userId);

      return {
        exportVersion: "1.0.0",
        exportedAt: new Date().toISOString(),
        userId,
        userProfile: user ? { name: user.name, email: user.email } : null,
        challenge,
        tasks,
        notifications,
        badges,
        settings
      };
    },
    importData: (userId: string, data: any) => {
      if (!data || typeof data !== "object") throw new Error("Invalid import payload file format.");
      
      // Delete old user progress
      dbData.challenges = dbData.challenges.filter(c => c.userId !== userId);
      dbData.tasks = dbData.tasks.filter(t => t.userId !== userId);
      dbData.notifications = dbData.notifications.filter(n => n.userId !== userId);
      dbData.badges = dbData.badges.filter(b => b.userId !== userId);
      dbData.settings = dbData.settings.filter(s => s.userId !== userId);

      // Restore challenges
      if (Array.isArray(data.challenge)) {
        data.challenge.forEach((c: any) => {
          if (c.userId === userId) dbData.challenges.push(c);
        });
      }
      // Restore tasks
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach((t: any) => {
          if (t.userId === userId) dbData.tasks.push(t);
        });
      }
      // Restore notifications
      if (Array.isArray(data.notifications)) {
        data.notifications.forEach((n: any) => {
          if (n.userId === userId) dbData.notifications.push(n);
        });
      }
      // Restore badges
      if (Array.isArray(data.badges)) {
        data.badges.forEach((b: any) => {
          if (b.userId === userId) dbData.badges.push(b);
        });
      }
      // Restore settings
      if (data.settings && data.settings.userId === userId) {
        dbData.settings.push(data.settings);
      }

      saveDbSync();
      return true;
    }
  },

  // Reset entire challenge state for clean seed & dev cycles
  factoryReset: (userId: string) => {
    dbData.challenges = dbData.challenges.filter(c => c.userId !== userId);
    dbData.tasks = dbData.tasks.filter(t => t.userId !== userId);
    dbData.notifications = dbData.notifications.filter(n => n.userId !== userId);
    dbData.badges = dbData.badges.filter(b => b.userId !== userId);
    saveDbSync();
  }
};
