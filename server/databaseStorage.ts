import {
  users,
  topics,
  flashcards,
  studySessions,
  userStats,
  userSettings,
  subtopics,
  practiceSessions,
  type User,
  type Topic,
  type Flashcard,
  type StudySession,
  type UserStats,
  type UserSettings,
  type InsertTopic,
  type InsertFlashcard,
  type InsertStudySession,
  type InsertUserSettings,
  type UpdateUserSettings,
  type UpsertUser,
  type FlashcardWithTopic,
  type FlashcardWithSubtopic,
  type TopicWithStats,
  type TopicStatistics,
  type ReviewHistogramData,
  type PerformanceBreakdown,
  type Subtopic,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users (Required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    console.log("🔧 DatabaseStorage.getUser called with id:", id);
    try {
      console.log("🔧 Executing database query...");
    const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log("🔧 Database query result:", user ? "found user" : "no user found");
    return user;
    } catch (error) {
      console.error("❌ Database query error:", error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Delete user and all related data (cascade delete will handle relationships)
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  // Topics
  async getTopics(userId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.userId, userId));
  }

  async getTopicsWithStats(userId: string): Promise<TopicWithStats[]> {
    const result = await db
      .select({
        id: topics.id,
        name: topics.name,
        description: topics.description,
        color: topics.color,
        icon: topics.icon,
        userId: topics.userId,
        cardCount: sql<number>`count(distinct ${flashcards.id})`,
        dueCount: sql<number>`count(distinct case when ${flashcards.nextReview} <= now() then ${flashcards.id} end)`,
        accuracy: sql<number>`coalesce(avg(${flashcards.successRate}), 0)`,
        masteryPercentage: sql<number>`coalesce(avg(case when ${flashcards.successRate} >= 0.8 then 100 else 0 end), 0)`,
      })
      .from(topics)
      .leftJoin(flashcards, eq(topics.id, flashcards.topicId))
      .where(eq(topics.userId, userId))
      .groupBy(topics.id);

    // Get subtopic counts for each topic
    const subtopicCounts = await db
      .select({
        topicId: subtopics.topicId,
        subtopicCount: sql<number>`count(*)`,
      })
      .from(subtopics)
      .where(eq(subtopics.userId, userId))
      .groupBy(subtopics.topicId);

    // Merge subtopic counts with topic stats
    const subtopicCountMap = new Map(
      subtopicCounts.map(s => [s.topicId, s.subtopicCount])
    );

    return result.map(topic => ({
      ...topic,
      subtopicCount: subtopicCountMap.get(topic.id) || 0,
    }));
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  async updateTopic(id: number, updateData: Partial<Topic>): Promise<Topic | undefined> {
    const [topic] = await db
      .update(topics)
      .set(updateData)
      .where(eq(topics.id, id))
      .returning();
    return topic;
  }

  async deleteTopic(id: number): Promise<boolean> {
    const result = await db.delete(topics).where(eq(topics.id, id));
    return result.rowCount > 0;
  }

  // Flashcards
  async getFlashcards(userId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.userId, userId));
  }

  async getFlashcardsWithTopics(userId: string): Promise<FlashcardWithTopic[]> {
    const result = await db
      .select()
      .from(flashcards)
      .innerJoin(topics, eq(flashcards.topicId, topics.id))
      .where(eq(flashcards.userId, userId));

    return result.map(row => ({
      ...row.flashcards,
      topic: row.topics
    }));
  }

  async getFlashcardsByTopic(topicId: number): Promise<FlashcardWithSubtopic[]> {
    const result = await db
      .select()
      .from(flashcards)
      .leftJoin(subtopics, eq(flashcards.subtopicId, subtopics.id))
      .where(eq(flashcards.topicId, topicId));

    return result.map(row => ({
      ...row.flashcards,
      subtopic: row.subtopics || undefined
    }));
  }

  async getDueFlashcards(userId: string): Promise<FlashcardWithTopic[]> {
    const result = await db
      .select()
      .from(flashcards)
      .innerJoin(topics, eq(flashcards.topicId, topics.id))
      .where(
        and(
          eq(flashcards.userId, userId),
          lte(flashcards.nextReview, new Date()),
          eq(flashcards.isActive, true)
        )
      );

    return result.map(row => ({
      ...row.flashcards,
      topic: row.topics
    }));
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const [flashcard] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return flashcard;
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const [newFlashcard] = await db.insert(flashcards).values({
      ...flashcard,
      nextReview: new Date(),
    }).returning();
    return newFlashcard;
  }

  async updateFlashcard(id: number, updateData: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [flashcard] = await db
      .update(flashcards)
      .set(updateData)
      .where(eq(flashcards.id, id))
      .returning();
    return flashcard;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    const result = await db.delete(flashcards).where(eq(flashcards.id, id));
    return result.rowCount > 0;
  }

  // Study Sessions
  async getStudySessions(userId: string): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  }

  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const [newSession] = await db.insert(studySessions).values(session).returning();
    return newSession;
  }

  // User Stats
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    if (stats && !('personalBestStreak' in stats)) {
      // Temporary fix until migration is run
      return { ...stats, personalBestStreak: stats.studyStreak || 0 };
    }
    return stats;
  }

  async createUserStats(statsData: InsertUserStats): Promise<UserStats> {
    const [stats] = await db.insert(userStats).values(statsData).returning();
    return stats;
  }

  async updateUserStats(userId: string, updateData: Partial<UserStats>): Promise<UserStats | undefined> {
    const [stats] = await db
      .update(userStats)
      .set(updateData)
      .where(eq(userStats.userId, userId))
      .returning();
    return stats;
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: string, updateData: UpdateUserSettings): Promise<UserSettings | undefined> {
    const [settings] = await db
      .update(userSettings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings;
  }

  // Topic Statistics
  async getTopicStatistics(topicId: number, userId: string): Promise<TopicStatistics | null> {
    // Verify topic belongs to user
    const [topic] = await db.select().from(topics).where(and(
      eq(topics.id, topicId),
      eq(topics.userId, userId)
    ));
    
    if (!topic) return null;

    // Get all flashcards for this topic
    const topicFlashcards = await db.select().from(flashcards).where(
      and(
        eq(flashcards.topicId, topicId),
        eq(flashcards.userId, userId)
      )
    );

    // Get all study sessions for these flashcards
    const cardIds = topicFlashcards.map(card => card.id);
    const sessions = cardIds.length > 0 
      ? await db.select().from(studySessions).where(
          and(
            eq(studySessions.userId, userId),
            sql`${studySessions.cardId} = ANY(ARRAY[${sql.join(cardIds.map(id => sql`${id}`), sql`, `)}])`
          )
        )
      : [];

    // Calculate total reviews and average response time
    const totalReviews = sessions.length;
    const averageResponseTime = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.responseTime, 0) / sessions.length
      : 0;

    // Calculate streak days (simplified - just checking consecutive days)
    const lastReviewDate = sessions.length > 0
      ? sessions.sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime())[0].sessionDate
      : null;

    // Calculate review histogram (next 30 days)
    const now = new Date();
    const histogram: ReviewHistogramData[] = [];
    for (let i = 0; i <= 30; i++) {
      const count = topicFlashcards.filter(card => {
        const daysDiff = Math.ceil((card.nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff === i;
      }).length;
      if (count > 0) {
        histogram.push({ day: i, count });
      }
    }

    // Calculate performance breakdown
    const performanceData = await db
      .select({
        rating: studySessions.rating,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          cardIds.length > 0 ? sql`${studySessions.cardId} = ANY(ARRAY[${sql.join(cardIds.map(id => sql`${id}`), sql`, `)}])` : sql`false`
        )
      )
      .groupBy(studySessions.rating);

    const totalRatings = performanceData.reduce((sum, p) => sum + p.count, 0);
    const performanceBreakdown: PerformanceBreakdown[] = [
      { 
        rating: 1, 
        label: "Again", 
        count: performanceData.find(p => p.rating === 1)?.count || 0,
        percentage: totalRatings > 0 ? ((performanceData.find(p => p.rating === 1)?.count || 0) / totalRatings) * 100 : 0
      },
      { 
        rating: 2, 
        label: "Hard", 
        count: performanceData.find(p => p.rating === 2)?.count || 0,
        percentage: totalRatings > 0 ? ((performanceData.find(p => p.rating === 2)?.count || 0) / totalRatings) * 100 : 0
      },
      { 
        rating: 3, 
        label: "Good", 
        count: performanceData.find(p => p.rating === 3)?.count || 0,
        percentage: totalRatings > 0 ? ((performanceData.find(p => p.rating === 3)?.count || 0) / totalRatings) * 100 : 0
      },
      { 
        rating: 4, 
        label: "Easy", 
        count: performanceData.find(p => p.rating === 4)?.count || 0,
        percentage: totalRatings > 0 ? ((performanceData.find(p => p.rating === 4)?.count || 0) / totalRatings) * 100 : 0
      },
    ];

    // Get subtopics with card counts
    const subtopicsData = await db
      .select({
        id: subtopics.id,
        name: subtopics.name,
        topicId: subtopics.topicId,
        userId: subtopics.userId,
        createdAt: subtopics.createdAt,
        cardCount: sql<number>`cast(count(${flashcards.id}) as int)`,
      })
      .from(subtopics)
      .leftJoin(flashcards, eq(subtopics.id, flashcards.subtopicId))
      .where(eq(subtopics.topicId, topicId))
      .groupBy(subtopics.id);

    return {
      totalReviews,
      averageResponseTime,
      streakDays: 0, // Simplified for now
      lastReviewDate,
      reviewHistogram: histogram,
      performanceBreakdown,
      subtopics: subtopicsData,
    };
  }

  async getReviewHistogram(topicId: number, userId: string): Promise<ReviewHistogramData[]> {
    const stats = await this.getTopicStatistics(topicId, userId);
    return stats ? stats.reviewHistogram : [];
  }

  async getPerformanceBreakdown(topicId: number, userId: string): Promise<PerformanceBreakdown[]> {
    const stats = await this.getTopicStatistics(topicId, userId);
    return stats ? stats.performanceBreakdown : [];
  }

  // Subtopics
  async getSubtopicsByTopic(topicId: number, userId: string): Promise<Subtopic[]> {
    return await db
      .select()
      .from(subtopics)
      .where(and(
        eq(subtopics.topicId, topicId),
        eq(subtopics.userId, userId)
      ));
  }

  async createSubtopic(subtopicData: InsertSubtopic): Promise<Subtopic> {
    const [subtopic] = await db.insert(subtopics).values(subtopicData).returning();
    return subtopic;
  }
}