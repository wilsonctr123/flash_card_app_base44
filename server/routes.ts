import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTopicSchema, insertFlashcardSchema, insertStudySessionSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Topics routes
  app.get("/api/topics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topics = await storage.getTopics(userId);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics-with-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicsWithStats = await storage.getTopicsWithStats(userId);
      res.json(topicsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics with stats" });
    }
  });

  app.post("/api/topics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicData = insertTopicSchema.parse({ ...req.body, userId });
      const topic = await storage.createTopic(topicData);
      res.json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create topic" });
      }
    }
  });

  app.put("/api/topics/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const topic = await storage.updateTopic(id, updateData);
      if (!topic) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  app.delete("/api/topics/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTopic(id);
      if (!deleted) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete topic" });
    }
  });

  // Flashcards routes
  app.get("/api/flashcards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flashcards = await storage.getFlashcardsWithTopics(userId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.get("/api/flashcards/due", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dueCards = await storage.getDueFlashcards(userId);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due cards" });
    }
  });

  app.get("/api/flashcards/by-topic/:topicId", isAuthenticated, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const flashcards = await storage.getFlashcardsByTopic(topicId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards for topic" });
    }
  });

  app.post("/api/flashcards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardData = insertFlashcardSchema.parse({ ...req.body, userId });
      const flashcard = await storage.createFlashcard(cardData);
      res.json(flashcard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid flashcard data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create flashcard" });
      }
    }
  });

  app.put("/api/flashcards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const flashcard = await storage.updateFlashcard(id, updateData);
      if (!flashcard) {
        res.status(404).json({ message: "Flashcard not found" });
        return;
      }
      res.json(flashcard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFlashcard(id);
      if (!deleted) {
        res.status(404).json({ message: "Flashcard not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard" });
    }
  });

  // Study session routes
  app.post("/api/study-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const sessionData = insertStudySessionSchema.parse(req.body);
      const session = await storage.createStudySession(sessionData);

      // Update card based on study session
      const rating = sessionData.rating;
      const card = await storage.getFlashcard(sessionData.cardId);
      if (card) {
        // Calculate new interval and next review date using spaced repetition algorithm
        let newInterval = card.interval;
        let newEaseFactor = card.easeFactor;
        
        if (rating >= 3) { // Good or Easy
          newInterval = Math.round(card.interval * card.easeFactor);
          if (rating === 4) { // Easy
            newEaseFactor = card.easeFactor + 0.15;
          }
        } else if (rating === 2) { // Hard
          newInterval = Math.max(1, Math.round(card.interval * 1.2));
          newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
        } else { // Again
          newInterval = 1;
          newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
        }

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        // Update success rate
        const newReviewCount = card.reviewCount + 1;
        const successCount = Math.round(card.successRate * card.reviewCount) + (rating >= 3 ? 1 : 0);
        const newSuccessRate = successCount / newReviewCount;

        await storage.updateFlashcard(sessionData.cardId, {
          interval: newInterval,
          easeFactor: newEaseFactor,
          nextReview,
          reviewCount: newReviewCount,
          successRate: newSuccessRate,
          difficulty: Math.max(0, Math.min(4, card.difficulty + (rating < 3 ? 1 : -1)))
        });
      }

      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create study session" });
      }
    }
  });

  // User stats routes
  app.get("/api/user-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      if (!stats) {
        res.status(404).json({ message: "User stats not found" });
        return;
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      const dueCards = await storage.getDueFlashcards(userId);
      const topics = await storage.getTopicsWithStats(userId);
      const allCards = await storage.getFlashcards(userId);

      // Calculate spaced repetition timeline
      const now = new Date();
      const timeline = {
        sameDay: 0,
        oneWeek: 0,
        oneMonth: 0,
        threeMonths: 0,
        sixMonths: 0,
        oneYear: 0
      };

      allCards.forEach(card => {
        const daysDiff = Math.ceil((new Date(card.nextReview).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 0) timeline.sameDay++;
        else if (daysDiff <= 7) timeline.oneWeek++;
        else if (daysDiff <= 30) timeline.oneMonth++;
        else if (daysDiff <= 90) timeline.threeMonths++;
        else if (daysDiff <= 180) timeline.sixMonths++;
        else timeline.oneYear++;
      });

      const analyticsData = {
        stats,
        dueToday: dueCards.length,
        totalCards: allCards.length,
        topics: topics.slice(0, 3), // Recent topics
        timeline,
        performanceAlert: topics.find(topic => topic.accuracy < 0.75) // Alert for low performance topics
      };

      res.json(analyticsData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
