export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  paymentMethod?: string | null;
}

export interface Challenge {
  id: string;
  userId: string;
  currentDay: number;
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
  challengeDay: number;
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
  morningNotificationTime: string;
  afternoonNotificationTime: string;
  nightNotificationTime: string;
  soundEnabled: boolean;
  darkMode: boolean;
}

export interface CategoryStats {
  assigned: number;
  completed: number;
}

export interface DayHistoryItem {
  name: string;
  day: number;
  completed: number;
  assigned: number;
  rate: number;
}

export interface AnalyticsStats {
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  completionRate: number;
  notificationsSent: number;
  streak: number;
  currentDay: number;
  categoryStats: Record<string, CategoryStats>;
  daysHistory: DayHistoryItem[];
  xp: number;
  level: number;
}

export interface AdminStats {
  totalUsers: number;
  activeChallenges: number;
  completedChallenges: number;
  globalCompletionRate: number;
  totalNotificationsSent: number;
  userRetentionRate: number;
}
