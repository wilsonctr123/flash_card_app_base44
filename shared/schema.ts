import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6366F1"),
  icon: text("icon").notNull().default("fas fa-book"),
  userId: varchar("user_id").notNull(),
});

export const subtopics = pgTable("subtopics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  topicId: integer("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  frontText: text("front_text").notNull(),
  backText: text("back_text").notNull(),
  frontImage: text("front_image"),
  backImage: text("back_image"),
  frontVideo: text("front_video"),
  backVideo: text("back_video"),
  topicId: integer("topic_id").notNull(),
  subtopicId: integer("subtopic_id").references(() => subtopics.id),
  userId: varchar("user_id").notNull(),
  difficulty: integer("difficulty").notNull().default(0), // 0-4 scale
  nextReview: timestamp("next_review").notNull(),
  interval: integer("interval").notNull().default(1), // days
  easeFactor: real("ease_factor").notNull().default(2.5),
  reviewCount: integer("review_count").notNull().default(0),
  successRate: real("success_rate").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  cardId: integer("card_id").notNull(),
  rating: integer("rating").notNull(), // 1-4 (again, hard, good, easy)
  responseTime: integer("response_time").notNull(), // milliseconds
  sessionDate: timestamp("session_date").notNull().defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  totalCards: integer("total_cards").notNull().default(0),
  cardsReviewed: integer("cards_reviewed").notNull().default(0),
  studyStreak: integer("study_streak").notNull().default(0),
  personalBestStreak: integer("personal_best_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date"),
  totalStudyTime: integer("total_study_time").notNull().default(0), // minutes
  averageAccuracy: real("average_accuracy").notNull().default(0),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  cardId: integer("card_id").notNull(),
  rating: integer("rating").notNull(), // 1-4 (again, hard, good, easy)
  isScheduled: boolean("is_scheduled").notNull().default(false),
  sessionDate: timestamp("session_date").notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  
  // Display settings
  displayName: varchar("display_name", { length: 255 }),
  
  // Study settings
  dailyGoal: integer("daily_goal").notNull().default(25),
  autoAdvance: boolean("auto_advance").notNull().default(true),
  showAnswerImmediately: boolean("show_answer_immediately").notNull().default(false),
  algorithm: varchar("algorithm", { length: 50 }).notNull().default("sm2"),
  
  // Notification settings
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  studyReminders: boolean("study_reminders").notNull().default(true),
  dailyStreakReminder: boolean("daily_streak_reminder").notNull().default(true),
  performanceAlerts: boolean("performance_alerts").notNull().default(true),
  reminderTime: varchar("reminder_time", { length: 5 }).notNull().default("18:00"), // HH:MM format
  
  // Appearance settings
  theme: varchar("theme", { length: 20 }).notNull().default("light"),
  cardAnimations: boolean("card_animations").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true });
export const insertSubtopicSchema = createInsertSchema(subtopics).omit({ 
  id: true,
  createdAt: true
});
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ 
  id: true, 
  nextReview: true, 
  createdAt: true 
});
export const insertStudySessionSchema = createInsertSchema(studySessions).omit({ 
  id: true, 
  sessionDate: true 
});
export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({ 
  id: true, 
  sessionDate: true 
});
export const insertUserStatsSchema = createInsertSchema(userStats).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export const updateUserSettingsSchema = insertUserSettingsSchema.partial().omit({ userId: true });

// Types
export type User = typeof users.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Subtopic = typeof subtopics.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type InsertSubtopic = z.infer<typeof insertSubtopicSchema>;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

// Additional types for frontend
export type FlashcardWithTopic = Flashcard & { topic: Topic };
export type FlashcardWithSubtopic = Flashcard & { subtopic?: Subtopic };
export type FlashcardWithTopicAndSubtopic = Flashcard & { topic: Topic; subtopic?: Subtopic };
export type TopicWithStats = Topic & { 
  cardCount: number; 
  accuracy: number; 
  masteryPercentage: number;
  dueCount: number;
  subtopicCount: number;
};

// Statistics types
export type ReviewHistogramData = {
  day: number; // Days from today
  count: number; // Number of cards due that day
};

export type PerformanceBreakdown = {
  rating: 1 | 2 | 3 | 4;
  label: string;
  count: number;
  percentage: number;
};

export type TopicStatistics = {
  totalReviews: number;
  averageResponseTime: number;
  streakDays: number;
  lastReviewDate: Date | null;
  reviewHistogram: ReviewHistogramData[];
  performanceBreakdown: PerformanceBreakdown[];
  subtopics: (Subtopic & { cardCount: number })[];
};
