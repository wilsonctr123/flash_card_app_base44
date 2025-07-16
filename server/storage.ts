import { 
  users, 
  topics, 
  flashcards, 
  studySessions, 
  userStats,
  userSettings,
  type User, 
  type Topic, 
  type Flashcard, 
  type StudySession, 
  type UserStats,
  type UserSettings,
  type InsertUser, 
  type InsertTopic, 
  type InsertFlashcard, 
  type InsertStudySession, 
  type InsertUserStats,
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
  type InsertSubtopic
} from "@shared/schema";

export interface IStorage {
  // Users (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Topics
  getTopics(userId: string): Promise<Topic[]>;
  getTopicsWithStats(userId: string): Promise<TopicWithStats[]>;
  getTopic(id: number): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: number, topic: Partial<Topic>): Promise<Topic | undefined>;
  deleteTopic(id: number): Promise<boolean>;

  // Flashcards
  getFlashcards(userId: string): Promise<Flashcard[]>;
  getFlashcardsWithTopics(userId: string): Promise<FlashcardWithTopic[]>;
  getFlashcardsByTopic(topicId: number): Promise<FlashcardWithSubtopic[]>;
  getDueFlashcards(userId: string): Promise<FlashcardWithTopic[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, flashcard: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<boolean>;

  // Study Sessions
  getStudySessions(userId: string): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;

  // User Stats
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats | undefined>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings | undefined>;

  // Topic Statistics
  getTopicStatistics(topicId: number, userId: string): Promise<TopicStatistics | null>;
  getReviewHistogram(topicId: number, userId: string): Promise<ReviewHistogramData[]>;
  getPerformanceBreakdown(topicId: number, userId: string): Promise<PerformanceBreakdown[]>;

  // Subtopics
  getSubtopicsByTopic(topicId: number, userId: string): Promise<Subtopic[]>;
  createSubtopic(subtopic: InsertSubtopic): Promise<Subtopic>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private topics: Map<number, Topic> = new Map();
  private flashcards: Map<number, Flashcard> = new Map();
  private studySessions: Map<number, StudySession> = new Map();
  private userStats: Map<number, UserStats> = new Map();
  private userSettings: Map<number, UserSettings> = new Map();
  private subtopics: Map<number, Subtopic> = new Map();
  
  private currentUserId = 1;
  private currentTopicId = 1;
  private currentFlashcardId = 1;
  private currentStudySessionId = 1;
  private currentUserStatsId = 1;
  private currentUserSettingsId = 1;
  private currentSubtopicId = 1;

  constructor() {
    // Create default user
    const defaultUser: User = {
      id: "1",
      username: "demo",
      email: "demo@memoryace.com",
      name: "Demo User"
    };
    this.users.set(1, defaultUser);

    // Create default topics
    const spanishTopic: Topic = {
      id: 1,
      name: "Spanish Vocabulary",
      description: "Learn Spanish words and phrases",
      color: "#3B82F6",
      icon: "fas fa-language",
      userId: "1"
    };
    const mathTopic: Topic = {
      id: 2,
      name: "Math Formulas",
      description: "Essential mathematical formulas",
      color: "#8B5CF6",
      icon: "fas fa-calculator",
      userId: "1"
    };
    const chemTopic: Topic = {
      id: 3,
      name: "Chemistry Concepts",
      description: "Basic chemistry principles",
      color: "#10B981",
      icon: "fas fa-flask",
      userId: "1"
    };

    this.topics.set(1, spanishTopic);
    this.topics.set(2, mathTopic);
    this.topics.set(3, chemTopic);
    this.currentTopicId = 4;

    // Create sample flashcards
    const now = new Date();
    const sampleCards = [
      {
        id: 1,
        frontText: "What does 'biblioteca' mean?",
        backText: "Library",
        frontImage: null,
        backImage: null,
        frontVideo: null,
        backVideo: null,
        topicId: 1,
        userId: "1",
        difficulty: 1,
        nextReview: new Date(now.getTime() - 60000), // Due now
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 3,
        successRate: 0.89,
        isActive: true,
        createdAt: new Date(now.getTime() - 86400000 * 7) // 1 week ago
      },
      {
        id: 2,
        frontText: "Quadratic Formula",
        backText: "x = (-b ± √(b²-4ac)) / 2a",
        frontImage: null,
        backImage: null,
        frontVideo: null,
        backVideo: null,
        topicId: 2,
        userId: "1",
        difficulty: 2,
        nextReview: new Date(now.getTime() + 3600000), // Due in 1 hour
        interval: 4,
        easeFactor: 2.3,
        reviewCount: 5,
        successRate: 0.76,
        isActive: true,
        createdAt: new Date(now.getTime() - 86400000 * 14)
      }
    ];

    sampleCards.forEach(card => this.flashcards.set(card.id, card));
    this.currentFlashcardId = 3;

    // Create user stats
    const defaultStats: UserStats = {
      id: 1,
      userId: "1",
      totalCards: 2,
      cardsReviewed: 8,
      studyStreak: 14,
      personalBestStreak: 28,
      lastStudyDate: new Date(),
      totalStudyTime: 420, // 7 hours in minutes
      averageAccuracy: 0.87
    };
    this.userStats.set(1, defaultStats);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(parseInt(id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id: id.toString() };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    // For MemStorage, just create or update the user
    const existingUser = this.users.get(parseInt(user.id));
    if (existingUser) {
      const updated = { ...existingUser, ...user };
      this.users.set(parseInt(user.id), updated);
      return updated;
    } else {
      const newUser: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      };
      this.users.set(parseInt(user.id), newUser);
      return newUser;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const userId = parseInt(id);
    if (!this.users.has(userId)) {
      return false;
    }
    
    // Delete user and all related data
    this.users.delete(userId);
    
    // Delete all user's topics
    Array.from(this.topics.keys()).forEach(key => {
      if (this.topics.get(key)?.userId === id) {
        this.topics.delete(key);
      }
    });
    
    // Delete all user's flashcards
    Array.from(this.flashcards.keys()).forEach(key => {
      if (this.flashcards.get(key)?.userId === id) {
        this.flashcards.delete(key);
      }
    });
    
    // Delete user stats
    Array.from(this.userStats.keys()).forEach(key => {
      if (this.userStats.get(key)?.userId === id) {
        this.userStats.delete(key);
      }
    });
    
    // Delete user settings
    Array.from(this.userSettings.keys()).forEach(key => {
      if (this.userSettings.get(key)?.userId === id) {
        this.userSettings.delete(key);
      }
    });
    
    return true;
  }

  // Topics
  async getTopics(userId: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(topic => topic.userId === userId);
  }

  async getTopicsWithStats(userId: string): Promise<TopicWithStats[]> {
    const userTopics = await this.getTopics(userId);
    return userTopics.map(topic => {
      const topicCards = Array.from(this.flashcards.values()).filter(card => card.topicId === topic.id);
      const cardCount = topicCards.length;
      const accuracy = cardCount > 0 ? topicCards.reduce((sum, card) => sum + card.successRate, 0) / cardCount : 0;
      const masteryPercentage = cardCount > 0 ? topicCards.filter(card => card.successRate >= 0.8).length / cardCount * 100 : 0;
      const dueCount = topicCards.filter(card => new Date(card.nextReview) <= new Date()).length;
      const subtopicCount = Array.from(this.subtopics.values()).filter(sub => sub.topicId === topic.id).length;
      
      return {
        ...topic,
        cardCount,
        accuracy,
        masteryPercentage,
        dueCount,
        subtopicCount
      };
    });
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.currentTopicId++;
    const topic: Topic = { 
      ...insertTopic, 
      id,
      color: insertTopic.color || "#6366F1",
      description: insertTopic.description || null,
      icon: insertTopic.icon || "fas fa-book"
    };
    this.topics.set(id, topic);
    return topic;
  }

  async updateTopic(id: number, updateData: Partial<Topic>): Promise<Topic | undefined> {
    const topic = this.topics.get(id);
    if (!topic) return undefined;
    
    const updatedTopic = { ...topic, ...updateData };
    this.topics.set(id, updatedTopic);
    return updatedTopic;
  }

  async deleteTopic(id: number): Promise<boolean> {
    return this.topics.delete(id);
  }

  // Flashcards
  async getFlashcards(userId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.userId === userId);
  }

  async getFlashcardsWithTopics(userId: string): Promise<FlashcardWithTopic[]> {
    const userCards = await this.getFlashcards(userId);
    return userCards.map(card => {
      const topic = this.topics.get(card.topicId)!;
      return { ...card, topic };
    });
  }

  async getFlashcardsByTopic(topicId: number): Promise<FlashcardWithSubtopic[]> {
    const cards = Array.from(this.flashcards.values()).filter(card => card.topicId === topicId);
    return cards.map(card => {
      const subtopic = card.subtopicId ? this.subtopics.get(card.subtopicId) : undefined;
      return { ...card, subtopic };
    });
  }

  async getDueFlashcards(userId: string): Promise<FlashcardWithTopic[]> {
    const userCards = await this.getFlashcardsWithTopics(userId);
    const now = new Date();
    return userCards.filter(card => new Date(card.nextReview) <= now && card.isActive);
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentFlashcardId++;
    const now = new Date();
    const flashcard: Flashcard = {
      ...insertFlashcard,
      id,
      nextReview: now,
      createdAt: now,
      difficulty: 0,
      interval: 1,
      easeFactor: 2.5,
      reviewCount: 0,
      successRate: 0,
      isActive: true,
      frontImage: insertFlashcard.frontImage || null,
      backImage: insertFlashcard.backImage || null,
      frontVideo: insertFlashcard.frontVideo || null,
      backVideo: insertFlashcard.backVideo || null
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcard(id: number, updateData: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) return undefined;
    
    const updatedFlashcard = { ...flashcard, ...updateData };
    this.flashcards.set(id, updatedFlashcard);
    return updatedFlashcard;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    return this.flashcards.delete(id);
  }

  // Study Sessions
  async getStudySessions(userId: string): Promise<StudySession[]> {
    return Array.from(this.studySessions.values()).filter(session => {
      const card = this.flashcards.get(session.cardId);
      return card?.userId === userId;
    });
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = this.currentStudySessionId++;
    const session: StudySession = {
      ...insertSession,
      id,
      sessionDate: new Date()
    };
    this.studySessions.set(id, session);
    return session;
  }

  // User Stats
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(stats => stats.userId === userId);
  }

  async createUserStats(statsData: InsertUserStats): Promise<UserStats> {
    const stats: UserStats = {
      ...statsData,
      id: this.currentUserStatsId++,
    };
    this.userStats.set(stats.id, stats);
    return stats;
  }

  async updateUserStats(userId: string, updateData: Partial<UserStats>): Promise<UserStats | undefined> {
    const stats = Array.from(this.userStats.values()).find(s => s.userId === userId);
    if (!stats) return undefined;
    
    const updatedStats = { ...stats, ...updateData };
    this.userStats.set(stats.id, updatedStats);
    return updatedStats;
  }

  // Topic Statistics
  async getTopicStatistics(topicId: number, userId: string): Promise<TopicStatistics | null> {
    const topic = this.topics.get(topicId);
    if (!topic || topic.userId !== userId) return null;

    const topicCards = Array.from(this.flashcards.values()).filter(
      card => card.topicId === topicId && card.userId === userId
    );
    
    const sessions = Array.from(this.studySessions.values()).filter(
      session => session.userId === userId && topicCards.some(card => card.id === session.cardId)
    );

    // Calculate histogram
    const histogram: ReviewHistogramData[] = [];
    const now = new Date();
    for (let i = 0; i <= 30; i++) {
      const count = topicCards.filter(card => {
        const daysDiff = Math.ceil((new Date(card.nextReview).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff === i;
      }).length;
      if (count > 0) {
        histogram.push({ day: i, count });
      }
    }

    // Calculate performance breakdown
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    sessions.forEach(session => {
      ratingCounts[session.rating as 1 | 2 | 3 | 4]++;
    });
    
    const totalRatings = sessions.length;
    const performanceBreakdown: PerformanceBreakdown[] = [
      { rating: 1, label: "Again", count: ratingCounts[1], percentage: totalRatings ? (ratingCounts[1] / totalRatings) * 100 : 0 },
      { rating: 2, label: "Hard", count: ratingCounts[2], percentage: totalRatings ? (ratingCounts[2] / totalRatings) * 100 : 0 },
      { rating: 3, label: "Good", count: ratingCounts[3], percentage: totalRatings ? (ratingCounts[3] / totalRatings) * 100 : 0 },
      { rating: 4, label: "Easy", count: ratingCounts[4], percentage: totalRatings ? (ratingCounts[4] / totalRatings) * 100 : 0 },
    ];

    return {
      totalReviews: sessions.length,
      averageResponseTime: sessions.length ? sessions.reduce((sum, s) => sum + s.responseTime, 0) / sessions.length : 0,
      streakDays: 0, // Simplified for memory storage
      lastReviewDate: sessions.length ? sessions[sessions.length - 1].sessionDate : null,
      reviewHistogram: histogram,
      performanceBreakdown,
      subtopics: [], // Not implemented in memory storage
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
    return Array.from(this.subtopics.values()).filter(
      subtopic => subtopic.topicId === topicId && subtopic.userId === userId
    );
  }

  async createSubtopic(subtopicData: InsertSubtopic): Promise<Subtopic> {
    const subtopic: Subtopic = {
      ...subtopicData,
      id: this.currentSubtopicId++,
      createdAt: new Date(),
    };
    this.subtopics.set(subtopic.id, subtopic);
    return subtopic;
  }
}

import { DatabaseStorage } from "./databaseStorage";

// Use DatabaseStorage for production with authentication
export const storage = new DatabaseStorage();
