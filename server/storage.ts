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
  type InsertUser, 
  type InsertTopic, 
  type InsertFlashcard, 
  type InsertStudySession, 
  type InsertUserStats,
  type UpsertUser,
  type FlashcardWithTopic,
  type TopicWithStats
} from "@shared/schema";

export interface IStorage {
  // Users (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  getFlashcardsByTopic(topicId: number): Promise<Flashcard[]>;
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
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private topics: Map<number, Topic> = new Map();
  private flashcards: Map<number, Flashcard> = new Map();
  private studySessions: Map<number, StudySession> = new Map();
  private userStats: Map<number, UserStats> = new Map();
  
  private currentUserId = 1;
  private currentTopicId = 1;
  private currentFlashcardId = 1;
  private currentStudySessionId = 1;
  private currentUserStatsId = 1;

  constructor() {
    // Create default user
    const defaultUser: User = {
      id: 1,
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
      userId: 1
    };
    const mathTopic: Topic = {
      id: 2,
      name: "Math Formulas",
      description: "Essential mathematical formulas",
      color: "#8B5CF6",
      icon: "fas fa-calculator",
      userId: 1
    };
    const chemTopic: Topic = {
      id: 3,
      name: "Chemistry Concepts",
      description: "Basic chemistry principles",
      color: "#10B981",
      icon: "fas fa-flask",
      userId: 1
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
        userId: 1,
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
        userId: 1,
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
      userId: 1,
      totalCards: 2,
      cardsReviewed: 8,
      studyStreak: 14,
      lastStudyDate: new Date(),
      totalStudyTime: 420, // 7 hours in minutes
      averageAccuracy: 0.87
    };
    this.userStats.set(1, defaultStats);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Topics
  async getTopics(userId: number): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(topic => topic.userId === userId);
  }

  async getTopicsWithStats(userId: number): Promise<TopicWithStats[]> {
    const userTopics = await this.getTopics(userId);
    return userTopics.map(topic => {
      const topicCards = Array.from(this.flashcards.values()).filter(card => card.topicId === topic.id);
      const cardCount = topicCards.length;
      const accuracy = cardCount > 0 ? topicCards.reduce((sum, card) => sum + card.successRate, 0) / cardCount : 0;
      const masteryPercentage = cardCount > 0 ? topicCards.filter(card => card.successRate >= 0.8).length / cardCount * 100 : 0;
      const dueCount = topicCards.filter(card => new Date(card.nextReview) <= new Date()).length;
      
      return {
        ...topic,
        cardCount,
        accuracy,
        masteryPercentage,
        dueCount
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
  async getFlashcards(userId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.userId === userId);
  }

  async getFlashcardsWithTopics(userId: number): Promise<FlashcardWithTopic[]> {
    const userCards = await this.getFlashcards(userId);
    return userCards.map(card => {
      const topic = this.topics.get(card.topicId)!;
      return { ...card, topic };
    });
  }

  async getFlashcardsByTopic(topicId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.topicId === topicId);
  }

  async getDueFlashcards(userId: number): Promise<FlashcardWithTopic[]> {
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
  async getStudySessions(userId: number): Promise<StudySession[]> {
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
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(stats => stats.userId === userId);
  }

  async updateUserStats(userId: number, updateData: Partial<UserStats>): Promise<UserStats | undefined> {
    const stats = Array.from(this.userStats.values()).find(s => s.userId === userId);
    if (!stats) return undefined;
    
    const updatedStats = { ...stats, ...updateData };
    this.userStats.set(stats.id, updatedStats);
    return updatedStats;
  }
}

import { DatabaseStorage } from "./databaseStorage";

// Use DatabaseStorage for production with authentication
export const storage = new DatabaseStorage();
