import {
  users,
  topics,
  flashcards,
  studySessions,
  userStats,
  type User,
  type Topic,
  type Flashcard,
  type StudySession,
  type UserStats,
  type InsertTopic,
  type InsertFlashcard,
  type InsertStudySession,
  type UpsertUser,
  type FlashcardWithTopic,
  type TopicWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users (Required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
        cardCount: sql<number>`count(${flashcards.id})`,
        dueCount: sql<number>`count(case when ${flashcards.nextReview} <= now() then 1 end)`,
        accuracy: sql<number>`coalesce(avg(${flashcards.successRate}), 0)`,
        masteryPercentage: sql<number>`coalesce(avg(case when ${flashcards.successRate} >= 0.8 then 100 else 0 end), 0)`,
      })
      .from(topics)
      .leftJoin(flashcards, eq(topics.id, flashcards.topicId))
      .where(eq(topics.userId, userId))
      .groupBy(topics.id);

    return result;
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

  async getFlashcardsByTopic(topicId: number): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.topicId, topicId));
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
}