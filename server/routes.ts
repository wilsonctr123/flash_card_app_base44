import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createErrorHandler, asyncHandler, validateAuth, ValidationError, NotFoundError } from "./middleware/errorHandler";
import { studySessionService } from "./services/StudySessionService";
import { ValidationService } from "./services/ValidationService";
import { insertTopicSchema, insertFlashcardSchema, insertStudySessionSchema, insertUserSettingsSchema, updateUserSettingsSchema, insertSubtopicSchema } from "@shared/schema";
import { z } from "zod";
import { devAuthMiddleware, isDevAuthenticated } from "./devAuth";
import { setupDevUser } from "./devSetup";

// Use development auth in development mode
const isDev = process.env.NODE_ENV === "development";
// Auth middleware will be set conditionally below

export async function registerRoutes(app: Express): Promise<Server> {
  let finalAuthMiddleware;
  
  // Auth middleware - skip Replit auth in development
  if (!isDev) {
    const { setupAuth, isAuthenticated } = await import("./replitAuth");
    await setupAuth(app);
    finalAuthMiddleware = isAuthenticated;
  } else {
    // Setup development user in database
    await setupDevUser();
    
    // Apply dev auth middleware globally in development
    app.use(devAuthMiddleware);
    finalAuthMiddleware = isDevAuthenticated;
  }

  // Auth routes
  app.get('/api/auth/user', finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // In development, create the user if it doesn't exist
      if (!user && isDev) {
        user = await storage.upsertUser({
          id: userId,
          username: req.user.claims.email?.split('@')[0] || 'devuser',
          email: req.user.claims.email || 'dev@localhost.com',
          name: req.user.claims.name || 'Development User'
        });
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Topics routes
  app.get("/api/topics", finalAuthMiddleware, asyncHandler(async (req: any, res) => {
    const userId = validateAuth(req);
    const topics = await storage.getTopics(userId);
    res.json(topics);
  }));

  app.get("/api/topics-with-stats", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicsWithStats = await storage.getTopicsWithStats(userId);
      res.json(topicsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics with stats" });
    }
  });

  app.post("/api/topics", finalAuthMiddleware, asyncHandler(async (req: any, res) => {
    const userId = validateAuth(req);
    const topicData = ValidationService.validateSchema(insertTopicSchema, { ...req.body, userId });
    const topic = await storage.createTopic(topicData);
    res.json(topic);
  }));

  app.get("/api/topics/:id", finalAuthMiddleware, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const topic = await storage.getTopic(id);
      if (!topic) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      // Check if user owns this topic
      if (topic.userId !== userId) {
        res.status(403).json({ message: "Access denied" });
        return;
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  app.put("/api/topics/:id", finalAuthMiddleware, async (req: any, res) => {
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

  app.delete("/api/topics/:id", finalAuthMiddleware, async (req: any, res) => {
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
  app.get("/api/flashcards", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const flashcards = await storage.getFlashcardsWithTopics(userId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.get("/api/flashcards/due", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dueCards = await storage.getDueFlashcards(userId);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due cards" });
    }
  });

  app.get("/api/flashcards/by-topic/:topicId", finalAuthMiddleware, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const flashcards = await storage.getFlashcardsByTopic(topicId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards for topic" });
    }
  });

  app.post("/api/flashcards", finalAuthMiddleware, async (req: any, res) => {
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

  app.put("/api/flashcards/:id", finalAuthMiddleware, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData = { ...req.body };
      
      console.log("PUT /api/flashcards/:id - ID:", id);
      console.log("Raw update data:", JSON.stringify(updateData, null, 2));
      
      // Convert date strings to Date objects
      if (updateData.nextReview) {
        updateData.nextReview = new Date(updateData.nextReview);
        console.log("Converted nextReview to Date:", updateData.nextReview);
      }
      
      const flashcard = await storage.updateFlashcard(id, updateData);
      if (!flashcard) {
        res.status(404).json({ message: "Flashcard not found" });
        return;
      }
      res.json(flashcard);
    } catch (error: any) {
      console.error("Error updating flashcard:", error);
      console.error("Final update data:", JSON.stringify(updateData, null, 2));
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to update flashcard",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  });

  // Reset flashcard endpoint
  app.post("/api/flashcards/:id/reset", finalAuthMiddleware, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if card exists and belongs to user
      const cards = await storage.getFlashcards(userId);
      const card = cards.find(c => c.id === id);
      
      if (!card) {
        res.status(404).json({ message: "Flashcard not found or access denied" });
        return;
      }
      
      // Reset the card
      const resetData = {
        nextReview: new Date(),
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        successRate: 0,
        difficulty: 0
      };
      
      const updatedCard = await storage.updateFlashcard(id, resetData);
      res.json({ success: true, card: updatedCard });
    } catch (error) {
      console.error("Error resetting flashcard:", error);
      res.status(500).json({ message: "Failed to reset flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", finalAuthMiddleware, async (req: any, res) => {
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
  app.post("/api/study-sessions", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertStudySessionSchema.parse({ ...req.body, userId });
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

      // Update user stats
      let userStats = await storage.getUserStats(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!userStats) {
        // Create initial stats if they don't exist
        const createData: any = {
          userId,
          totalCards: await storage.getFlashcards(userId).then(cards => cards.length),
          cardsReviewed: 1,
          studyStreak: 1,
          lastStudyDate: new Date(),
          totalStudyTime: Math.round(sessionData.responseTime / 60000), // Convert ms to minutes
          averageAccuracy: rating >= 3 ? 1 : 0,
        };
        
        // Only add personalBestStreak if we're using memory storage
        if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
          createData.personalBestStreak = 1;
        }
        
        userStats = await storage.createUserStats(createData);
      } else {
        // Calculate new average accuracy
        const totalRatings = userStats.cardsReviewed + 1;
        const successfulRatings = Math.round(userStats.averageAccuracy * userStats.cardsReviewed) + (rating >= 3 ? 1 : 0);
        const newAverageAccuracy = successfulRatings / totalRatings;
        
        // Calculate study streak
        let newStreak = userStats.studyStreak;
        if (userStats.lastStudyDate) {
          const lastStudy = new Date(userStats.lastStudyDate);
          lastStudy.setHours(0, 0, 0, 0);
          const daysSinceLastStudy = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastStudy === 0) {
            // Already studied today, keep current streak
            newStreak = userStats.studyStreak;
          } else if (daysSinceLastStudy === 1) {
            // Studied yesterday, increment streak
            newStreak = userStats.studyStreak + 1;
          } else {
            // Missed a day, reset streak
            newStreak = 1;
          }
        }
        
        const updateData: any = {
          cardsReviewed: userStats.cardsReviewed + 1,
          studyStreak: newStreak,
          lastStudyDate: new Date(),
          totalStudyTime: userStats.totalStudyTime + Math.round(sessionData.responseTime / 60000),
          averageAccuracy: newAverageAccuracy,
          totalCards: await storage.getFlashcards(userId).then(cards => cards.length),
        };
        
        // Only add personalBestStreak if the column exists
        if ('personalBestStreak' in userStats) {
  app.post("/api/study-sessions", finalAuthMiddleware, asyncHandler(async (req: any, res) => {
    const userId = validateAuth(req);
    const sessionData = ValidationService.validateSchema(insertStudySessionSchema, { ...req.body, userId });
    const session = await studySessionService.createStudySession(sessionData);
    res.json(session);
  }));

  // Add error handler middleware
  app.use(createErrorHandler());

  // User stats routes
  app.get("/api/user-stats", finalAuthMiddleware, async (req: any, res) => {
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
  app.get("/api/analytics/dashboard", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      const dueCards = await storage.getDueFlashcards(userId);
      const topics = await storage.getTopicsWithStats(userId);
      const allCards = await storage.getFlashcards(userId);
      const allSessions = await storage.getStudySessions(userId);

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

      // Calculate weekly and monthly changes
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const cardsAddedThisWeek = allCards.filter(card => 
        new Date(card.createdAt) > oneWeekAgo
      ).length;
      
      const sessionsThisMonth = allSessions.filter(session => 
        new Date(session.sessionDate) > oneMonthAgo
      );
      
      const sessionsLastMonth = allSessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        return sessionDate > twoMonthsAgo && sessionDate <= oneMonthAgo;
      });
      
      const accuracyThisMonth = sessionsThisMonth.length > 0
        ? sessionsThisMonth.filter(s => s.rating >= 3).length / sessionsThisMonth.length
        : stats?.averageAccuracy || 0;
        
      const accuracyLastMonth = sessionsLastMonth.length > 0
        ? sessionsLastMonth.filter(s => s.rating >= 3).length / sessionsLastMonth.length
        : stats?.averageAccuracy || 0;
      
      const accuracyChange = ((accuracyThisMonth - accuracyLastMonth) * 100);

      // Calculate topics mastered (topics where >80% of cards have high success rate)
      const topicsMastered = topics.filter(topic => {
        const topicCards = allCards.filter(card => card.topicId === topic.id);
        const masteredCards = topicCards.filter(card => card.successRate >= 0.8);
        return topicCards.length > 0 && (masteredCards.length / topicCards.length) >= 0.8;
      }).length;

      // Get personal best streak from stats

      // Calculate cards reviewed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cardsReviewedToday = allSessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      }).length;

      const analyticsData = {
        stats: {
          ...stats,
          cardsReviewedToday,
          topicsMastered,
        },
        dueToday: dueCards.length,
        totalCards: allCards.length,
        cardsAddedThisWeek,
        accuracyChangeThisMonth: accuracyChange,
        topics: topics.sort((a, b) => b.dueCount - a.dueCount).slice(0, 3), // Topics with most due cards
        timeline,
        performanceAlert: topics.find(topic => topic.accuracy < 0.75) // Alert for low performance topics
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Get upcoming reviews
  app.get("/api/analytics/upcoming-reviews", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allCards = await storage.getFlashcardsWithTopics(userId);
      const now = new Date();
      
      // Group cards by when they're due
      const upcomingReviews = allCards
        .filter(card => new Date(card.nextReview) > now)
        .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
        .slice(0, 10) // Get next 10 reviews
        .map(card => {
          const dueDate = new Date(card.nextReview);
          const hoursUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          const daysUntilDue = Math.floor(hoursUntilDue / 24);
          
          let timeUntilDue;
          if (hoursUntilDue < 1) {
            timeUntilDue = "in a few minutes";
          } else if (hoursUntilDue < 24) {
            timeUntilDue = `in ${hoursUntilDue} hour${hoursUntilDue === 1 ? '' : 's'}`;
          } else if (daysUntilDue === 1) {
            timeUntilDue = "tomorrow";
          } else if (daysUntilDue < 7) {
            timeUntilDue = `in ${daysUntilDue} days`;
          } else {
            timeUntilDue = dueDate.toLocaleDateString();
          }
          
          return {
            cardId: card.id,
            topicId: card.topicId,
            topicName: card.topic.name,
            frontText: card.frontText,
            nextReview: card.nextReview,
            timeUntilDue,
            difficulty: card.difficulty,
          };
        });
      
      res.json(upcomingReviews);
    } catch (error) {
      console.error("Upcoming reviews error:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reviews" });
    }
  });

  // Subtopics routes
  app.get("/api/topics/:topicId/subtopics", finalAuthMiddleware, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const userId = req.user.claims.sub;
      const subtopics = await storage.getSubtopicsByTopic(topicId, userId);
      res.json(subtopics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subtopics" });
    }
  });

  app.post("/api/topics/:topicId/subtopics", finalAuthMiddleware, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const userId = req.user.claims.sub;
      const subtopicData = insertSubtopicSchema.parse({ 
        ...req.body, 
        topicId,
        userId 
      });
      const subtopic = await storage.createSubtopic(subtopicData);
      res.json(subtopic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid subtopic data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create subtopic" });
      }
    }
  });

  // Topic statistics routes
  app.get("/api/topics/:id/statistics", finalAuthMiddleware, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get topic statistics
      const topicStats = await storage.getTopicStatistics(topicId, userId);
      if (!topicStats) {
        res.status(404).json({ message: "Topic not found" });
        return;
      }
      
      res.json(topicStats);
    } catch (error) {
      console.error("Error fetching topic statistics:", error);
      res.status(500).json({ message: "Failed to fetch topic statistics" });
    }
  });

  app.get("/api/topics/:id/review-histogram", finalAuthMiddleware, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get review histogram data
      const histogram = await storage.getReviewHistogram(topicId, userId);
      
      res.json(histogram);
    } catch (error) {
      console.error("Error fetching review histogram:", error);
      res.status(500).json({ message: "Failed to fetch review histogram" });
    }
  });

  app.get("/api/topics/:id/performance-breakdown", finalAuthMiddleware, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get performance breakdown
      const breakdown = await storage.getPerformanceBreakdown(topicId, userId);
      
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching performance breakdown:", error);
      res.status(500).json({ message: "Failed to fetch performance breakdown" });
    }
  });

  // Settings routes
  app.get("/api/settings", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let settings = await storage.getUserSettings(userId);
      
      // Create default settings if they don't exist
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          displayName: req.user.claims.name || null,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = updateUserSettingsSchema.parse(req.body);
      
      // Ensure settings exist
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        await storage.createUserSettings({
          userId,
          displayName: req.user.claims.name || null,
        });
      }
      
      const updatedSettings = await storage.updateUserSettings(userId, updateData);
      if (!updatedSettings) {
        res.status(404).json({ message: "Settings not found" });
        return;
      }
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  app.post("/api/settings/reset-progress", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Reset all flashcards for this user
      const userCards = await storage.getFlashcards(userId);
      for (const card of userCards) {
        await storage.updateFlashcard(card.id, {
          interval: 1,
          easeFactor: 2.5,
          reviewCount: 0,
          successRate: 0,
          difficulty: 0,
          nextReview: new Date(),
        });
      }
      
      // Reset user stats
      await storage.updateUserStats(userId, {
        cardsReviewed: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        averageAccuracy: 0,
      });
      
      res.json({ success: true, message: "Progress reset successfully" });
    } catch (error) {
      console.error("Error resetting progress:", error);
      res.status(500).json({ message: "Failed to reset progress" });
    }
  });

  app.get("/api/settings/export", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Gather all user data
      const user = await storage.getUser(userId);
      const settings = await storage.getUserSettings(userId);
      const topics = await storage.getTopics(userId);
      const flashcards = await storage.getFlashcards(userId);
      const studySessions = await storage.getStudySessions(userId);
      const stats = await storage.getUserStats(userId);
      
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        user,
        settings,
        topics,
        flashcards,
        studySessions,
        stats,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="flashcards-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/settings/import", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const importData = req.body;
      
      // Validate import data structure
      if (!importData.version || !importData.topics || !importData.flashcards) {
        res.status(400).json({ message: "Invalid import data format" });
        return;
      }
      
      let imported = {
        topics: 0,
        flashcards: 0,
        errors: [] as string[],
      };
      
      // Import topics
      const topicIdMap = new Map<number, number>();
      for (const topic of importData.topics) {
        try {
          const newTopic = await storage.createTopic({
            name: topic.name,
            description: topic.description,
            color: topic.color,
            icon: topic.icon,
            userId,
          });
          topicIdMap.set(topic.id, newTopic.id);
          imported.topics++;
        } catch (error) {
          imported.errors.push(`Failed to import topic: ${topic.name}`);
        }
      }
      
      // Import flashcards with mapped topic IDs
      for (const card of importData.flashcards) {
        try {
          const newTopicId = topicIdMap.get(card.topicId);
          if (!newTopicId) {
            imported.errors.push(`Failed to import card: topic not found`);
            continue;
          }
          
          await storage.createFlashcard({
            frontText: card.frontText,
            backText: card.backText,
            frontImage: card.frontImage,
            backImage: card.backImage,
            frontVideo: card.frontVideo,
            backVideo: card.backVideo,
            topicId: newTopicId,
            userId,
          });
          imported.flashcards++;
        } catch (error) {
          imported.errors.push(`Failed to import flashcard`);
        }
      }
      
      res.json({
        success: true,
        imported: {
          topics: imported.topics,
          flashcards: imported.flashcards,
        },
        errors: imported.errors,
      });
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  app.delete("/api/settings/account", finalAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Delete all user data (cascade delete will handle related data)
      // Note: In production, you might want to implement soft delete
      // or data retention policies
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Clear the session after successful deletion
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
          }
        });
      }
      
      res.json({ success: true, message: "Account successfully deleted" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
