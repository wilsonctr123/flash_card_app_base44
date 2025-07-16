import { storage } from "../storage";
import { insertStudySessionSchema, type InsertStudySession, type Flashcard } from "@shared/schema";
import { ValidationError, NotFoundError } from "../middleware/errorHandler";

export class StudySessionService {
  async createStudySession(sessionData: InsertStudySession) {
    // Validate input
    const validatedData = insertStudySessionSchema.parse(sessionData);
    
    // Verify card exists and belongs to user
    const card = await storage.getFlashcard(validatedData.cardId);
    if (!card) {
      throw new NotFoundError("Flashcard not found");
    }
    
    if (card.userId !== validatedData.userId) {
      throw new ValidationError("Access denied to this flashcard");
    }
    
    // Create study session
    const session = await storage.createStudySession(validatedData);
    
    // Update card using spaced repetition algorithm
    await this.updateCardFromSession(card, validatedData.rating);
    
    // Update user stats
    await this.updateUserStats(validatedData.userId, validatedData.rating, validatedData.responseTime);
    
    return session;
  }
  
  private async updateCardFromSession(card: Flashcard, rating: number) {
    // Calculate new interval and next review date using spaced repetition algorithm
    let newInterval = card.interval;
    let newEaseFactor = card.easeFactor;
    
    if (rating >= 3) { // Good or Easy
      newInterval = Math.round(card.interval * card.easeFactor);
      if (rating === 4) { // Easy
        newEaseFactor = Math.min(2.5, card.easeFactor + 0.15);
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

    await storage.updateFlashcard(card.id, {
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReview,
      reviewCount: newReviewCount,
      successRate: newSuccessRate,
      difficulty: Math.max(0, Math.min(4, card.difficulty + (rating < 3 ? 1 : -1)))
    });
  }
  
  private async updateUserStats(userId: string, rating: number, responseTime: number) {
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
        totalStudyTime: Math.round(responseTime / 60000), // Convert ms to minutes
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
        totalStudyTime: userStats.totalStudyTime + Math.round(responseTime / 60000),
        averageAccuracy: newAverageAccuracy,
        totalCards: await storage.getFlashcards(userId).then(cards => cards.length),
      };
      
      // Only add personalBestStreak if the column exists
      if ('personalBestStreak' in userStats) {
        updateData.personalBestStreak = Math.max(newStreak, userStats.personalBestStreak || 0);
      }
      
      await storage.updateUserStats(userId, updateData);
    }
  }
}

export const studySessionService = new StudySessionService();