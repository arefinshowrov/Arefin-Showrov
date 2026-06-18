import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { db, hashPassword, generateSalt, User, Challenge, Task } from "./src/db/db";
import { generateTasksForDay } from "./src/utils/rotation";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "30_day_human_health_tracker_key_secret_2026";

// Security headers and JSON body parser with increased limit for database import purposes
app.use(express.json({ limit: "5mb" }));

/**
 * Authentication Middleware
 */
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Session expired or invalid token credentials." });
  }
};

/**
 * Gamification Checker & Badge Engine
 */
function processGamificationRewards(userId: string) {
  // Try to find the user's active challenge
  const challenge = db.challenges.findByUserId(userId);
  if (!challenge) return;

  // Level Up logic based on total XP
  const xp = challenge.xp;
  let newLevel = 1;

  if (xp >= 900) {
    newLevel = 5; // Peak Performer
  } else if (xp >= 500) {
    newLevel = 4; // Wellness Champion
  } else if (xp >= 250) {
    newLevel = 3; // Healthy Habit Builder
  } else if (xp >= 100) {
    newLevel = 2; // Consistent
  }

  if (newLevel !== challenge.level) {
    db.challenges.update(challenge.id, { level: newLevel });
  }

  // Earn badge checker
  const allTasks = db.tasks.findByUserId(userId).filter(t => t.completed);

  // Category counts
  const categoryCounts = allTasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Assign badges
  if ((categoryCounts["Hydration"] || 0) >= 3) {
    db.badges.create(userId, "hydration_hero");
  }
  if ((categoryCounts["Physical Health"] || 0) >= 3) {
    db.badges.create(userId, "fitness_warrior");
  }
  if ((categoryCounts["Mental Wellness"] || 0) >= 3) {
    db.badges.create(userId, "mindfulness_master");
  }
  if ((categoryCounts["Recovery"] || 0) >= 3) {
    db.badges.create(userId, "sunlight_champion");
  }

  // Streak awards
  if (challenge.streak >= 7) {
    db.badges.create(userId, "streak_7");
  }
  if (challenge.streak >= 30) {
    db.badges.create(userId, "streak_30");
  }
}

/**
 * ==========================================
 * REST API ENDPOINTS
 * ==========================================
 */

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Authentication: Register
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password credentials are required." });
  }

  const existing = db.users.findByEmail(email);
  if (existing) {
    return res.status(400).json({ error: "Email account is already registered." });
  }

  try {
    const salt = generateSalt();
    const pwHash = hashPassword(password, salt);

    const newUser = db.users.create({
      email,
      name,
      passwordHash: pwHash,
      salt,
      isAdmin: false
    });

    // Create settings
    db.settings.findByUserId(newUser.id);

    // Automatically trigger an active Challenge Day 1 for them
    db.challenges.create(newUser.id);

    // Initial tasks for Day 1
    const taskData = generateTasksForDay(newUser.id, 1);
    taskData.forEach(t => db.tasks.create(t));

    // Sign JWT Token
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isAdmin: newUser.isAdmin,
        paymentMethod: newUser.paymentMethod || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Authentication: Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required credentials." });
  }

  const user = db.users.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or matching password." });
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or matching password." });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      paymentMethod: user.paymentMethod || null
    }
  });
});

// Profile & Current Challenge State
app.get("/api/auth/profile", authenticateToken, (req: any, res) => {
  const user = db.users.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: "User account file not found." });
  }

  let challenge = db.challenges.findByUserId(user.id);
  // Auto-recreate active challenge if none existed
  if (!challenge) {
    challenge = db.challenges.create(user.id);
  }

  const badges = db.badges.findByUserId(user.id);
  const settings = db.settings.findByUserId(user.id);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      paymentMethod: user.paymentMethod || null
    },
    challenge,
    badges,
    settings
  });
});

// Get Challenge State & Assigned Day Tasks
app.get("/api/challenge/active", authenticateToken, (req: any, res) => {
  let challenge = db.challenges.findByUserId(req.userId);
  if (!challenge) {
    challenge = db.challenges.create(req.userId);
  }

  let tasks = db.tasks.findDayTasks(req.userId, challenge.currentDay);
  if (tasks.length === 0) {
    // Generate new tasks for the day if not present
    const taskTemplates = generateTasksForDay(req.userId, challenge.currentDay);
    tasks = taskTemplates.map(t => db.tasks.create(t));
  }

  const badges = db.badges.findByUserId(req.userId);

  return res.json({
    challenge,
    tasks,
    badges
  });
});

// Complete Task
app.patch("/api/challenge/tasks/:id/complete", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { completed, notes } = req.body;

  const task = db.tasks.findMany().find(t => t.id === id && t.userId === req.userId);
  if (!task) {
    return res.status(404).json({ error: "Wellness task not found or unauthorized access." });
  }

  const challenge = db.challenges.findByUserId(req.userId);
  if (!challenge) {
    return res.status(400).json({ error: "No active challenge found to reward completion." });
  }

  const isTransitioningToDone = completed && !task.completed;
  const isTransitioningToUndone = !completed && task.completed;

  // Save completion values
  const updatedTask = db.tasks.update(id, {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
    notes: notes !== undefined ? notes : task.notes
  });

  // Re-calculate XP additions, levels and streaks
  let newXp = challenge.xp;
  let newCompletedCount = challenge.completedCount;

  if (isTransitioningToDone) {
    newXp += task.xpEarned;
    newCompletedCount += 1;
  } else if (isTransitioningToUndone) {
    newXp = Math.max(0, newXp - task.xpEarned);
    newCompletedCount = Math.max(0, newCompletedCount - 1);
  }

  // Update challenge details
  db.challenges.update(challenge.id, {
    xp: newXp,
    completedCount: newCompletedCount
  });

  // Re-evaluate game level structures
  processGamificationRewards(req.userId);

  const finalChallenge = db.challenges.findByUserId(req.userId);
  const todaysTasks = db.tasks.findDayTasks(req.userId, challenge.currentDay);

  return res.json({
    task: updatedTask,
    challenge: finalChallenge,
    tasks: todaysTasks
  });
});

// Move current day forward (Day advancing)
app.post("/api/challenge/advance", authenticateToken, (req: any, res) => {
  const challenge = db.challenges.findByUserId(req.userId);
  if (!challenge) {
    return res.status(400).json({ error: "No active health challenge found." });
  }

  const todaysTasks = db.tasks.findDayTasks(req.userId, challenge.currentDay);
  const completedTodayCount = todaysTasks.filter(t => t.completed).length;

  // Streak increment constraint: if they completed at least 2 out of 3 tasks, streak increases!
  let newStreak = challenge.streak;
  if (completedTodayCount >= 2) {
    newStreak += 1;
  } else {
    newStreak = 1; // broken loop, back to 1
  }

  const currentDay = challenge.currentDay;
  let updatedDay = currentDay + 1;
  let status = challenge.status;

  if (currentDay >= 30) {
    // Challenge finishes!
    updatedDay = 30;
    status = "completed" as const;
  }

  const updatedChallenge = db.challenges.update(challenge.id, {
    currentDay: updatedDay,
    streak: newStreak,
    status,
    updatedAt: new Date().toISOString()
  });

  // If we haven't finished, pre-generate next day's tasks
  if (status === "active") {
    const nextDayTasks = db.tasks.findDayTasks(req.userId, updatedDay);
    if (nextDayTasks.length === 0) {
      const taskTemplates = generateTasksForDay(req.userId, updatedDay);
      taskTemplates.forEach(t => db.tasks.create(t));
    }
  }

  // Run updates to badges (in case of double streaks)
  processGamificationRewards(req.userId);

  return res.json({
    challenge: updatedChallenge,
    tasks: db.tasks.findDayTasks(req.userId, updatedChallenge!.currentDay)
  });
});

// Wipes active challenge and sets back to day 1
app.post("/api/challenge/reset", authenticateToken, (req: any, res) => {
  db.factoryReset(req.userId);

  // Set up fresh challenge
  const challenge = db.challenges.create(req.userId);
  const initialTasks = generateTasksForDay(req.userId, 1).map(t => db.tasks.create(t));

  return res.json({
    challenge,
    tasks: initialTasks,
    message: "Your 30-Day wellness program has been reset successfully."
  });
});

// Get User's Analytics / History data
app.get("/api/challenge/stats", authenticateToken, (req: any, res) => {
  const tasks = db.tasks.findByUserId(req.userId);
  const challenge = db.challenges.findByUserId(req.userId) || db.challenges.findHistoryByUserId(req.userId)[0];
  const logs = db.notifications.findByUserId(req.userId);

  // Group by category completed counts
  const categoryStats = {
    Hydration: { assigned: 0, completed: 0 },
    Nutrition: { assigned: 0, completed: 0 },
    "Physical Health": { assigned: 0, completed: 0 },
    "Mental Wellness": { assigned: 0, completed: 0 },
    Recovery: { assigned: 0, completed: 0 }
  };

  tasks.forEach(t => {
    if (categoryStats[t.category]) {
      categoryStats[t.category].assigned += 1;
      if (t.completed) categoryStats[t.category].completed += 1;
    }
  });

  // Build daily completions for last 7 active records
  const daysHistory = Array.from({ length: 30 }, (_, idx) => {
    const day = idx + 1;
    const dayTasks = tasks.filter(t => t.challengeDay === day);
    const completed = dayTasks.filter(t => t.completed).length;
    return {
      name: `Day ${day}`,
      day,
      completed,
      assigned: dayTasks.length,
      rate: dayTasks.length ? (completed / dayTasks.length) * 100 : 0
    };
  }).filter(d => d.assigned > 0);

  const totalAssigned = tasks.length;
  const totalCompleted = tasks.filter(t => t.completed).length;
  const overallRate = totalAssigned ? (totalCompleted / totalAssigned) * 100 : 0;

  return res.json({
    totalTasksAssigned: totalAssigned,
    totalTasksCompleted: totalCompleted,
    completionRate: Math.round(overallRate),
    notificationsSent: logs.length,
    streak: challenge ? challenge.streak : 0,
    currentDay: challenge ? challenge.currentDay : 1,
    categoryStats,
    daysHistory,
    xp: challenge ? challenge.xp : 0,
    level: challenge ? challenge.level : 1
  });
});

// Get / Update Settings
app.get("/api/settings", authenticateToken, (req: any, res) => {
  const config = db.settings.findByUserId(req.userId);
  return res.json(config);
});

app.put("/api/settings", authenticateToken, (req: any, res) => {
  const updated = db.settings.update(req.userId, req.body);
  return res.json(updated);
});

// Export Data Payload
app.get("/api/backup/export", authenticateToken, (req: any, res) => {
  const data = db.backup.exportData(req.userId);
  return res.json(data);
});

// Import Data Payload
app.post("/api/backup/import", authenticateToken, (req: any, res) => {
  try {
    const payload = req.body;
    db.backup.importData(req.userId, payload);
    return res.json({ success: true, message: "Your health backups were successfully restored." });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Notification logger
app.post("/api/notifications/log", authenticateToken, (req: any, res) => {
  const { title, body, category } = req.body;
  if (!title || !body) return res.status(400).json({ error: "Title and body is mandatory" });

  const log = db.notifications.create({
    userId: req.userId,
    title,
    body,
    category: category || "General"
  });

  return res.status(201).json(log);
});

app.get("/api/notifications/history", authenticateToken, (req: any, res) => {
  const logs = db.notifications.findByUserId(req.userId);
  return res.json(logs);
});

/**
 * ==========================================
 * PRODUCTION & DEVELOPMENT FRONTEND SERVER
 * ==========================================
 */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mounting Vite server middleware in dev environment
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve bundled static resources
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Health App Server] Up and running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical error starting application server:", error);
});
