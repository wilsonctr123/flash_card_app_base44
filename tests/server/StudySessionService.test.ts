import { StudySessionService } from "../../server/services/StudySessionService";
import { storage } from "../../server/storage";
import { ValidationError, NotFoundError } from "../../server/middleware/errorHandler";

// Mock the storage
jest.mock("../../server/storage", () => ({
  storage: {
    getFlashcard: jest.fn(),
    createStudySession: jest.fn(),
    updateFlashcard: jest.fn(),
    getUserStats: jest.fn(),
    createUserStats: jest.fn(),
    updateUserStats: jest.fn(),
    getFlashcards: jest.fn(),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('StudySessionService', () => {
  let service: StudySessionService;
  
  beforeEach(() => {
    service = new StudySessionService();
    jest.clearAllMocks();
  });

  describe('createStudySession', () => {
    const validSessionData = {
      userId: "user-123",
      cardId: 1,
      rating: 3,
      responseTime: 5000,
    };

    const mockCard = {
      id: 1,
      userId: "user-123",
      interval: 1,
      easeFactor: 2.5,
      reviewCount: 0,
      successRate: 0,
      difficulty: 0,
      frontText: "Test",
      backText: "Test",
      topicId: 1,
      nextReview: new Date(),
      isActive: true,
      createdAt: new Date(),
      frontImage: null,
      backImage: null,
      frontVideo: null,
      backVideo: null,
      subtopicId: null,
    };

    it('should create a study session successfully', async () => {
      mockStorage.getFlashcard.mockResolvedValue(mockCard);
      mockStorage.createStudySession.mockResolvedValue({
        id: 1,
        ...validSessionData,
        sessionDate: new Date(),
      });
      mockStorage.getUserStats.mockResolvedValue(null);
      mockStorage.getFlashcards.mockResolvedValue([mockCard]);
      mockStorage.createUserStats.mockResolvedValue({
        id: 1,
        userId: "user-123",
        totalCards: 1,
        cardsReviewed: 1,
        studyStreak: 1,
        personalBestStreak: 1,
        lastStudyDate: new Date(),
        totalStudyTime: 1,
        averageAccuracy: 1,
      });

      const result = await service.createStudySession(validSessionData);

      expect(result).toBeDefined();
      expect(mockStorage.getFlashcard).toHaveBeenCalledWith(1);
      expect(mockStorage.createStudySession).toHaveBeenCalledWith(validSessionData);
      expect(mockStorage.updateFlashcard).toHaveBeenCalled();
    });

    it('should throw NotFoundError if card does not exist', async () => {
      mockStorage.getFlashcard.mockResolvedValue(undefined);

      await expect(service.createStudySession(validSessionData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if user does not own the card', async () => {
      mockStorage.getFlashcard.mockResolvedValue({
        ...mockCard,
        userId: "different-user",
      });

      await expect(service.createStudySession(validSessionData))
        .rejects.toThrow(ValidationError);
    });

    it('should update card interval correctly for good rating', async () => {
      mockStorage.getFlashcard.mockResolvedValue(mockCard);
      mockStorage.createStudySession.mockResolvedValue({
        id: 1,
        ...validSessionData,
        sessionDate: new Date(),
      });
      mockStorage.getUserStats.mockResolvedValue(null);
      mockStorage.getFlashcards.mockResolvedValue([mockCard]);
      mockStorage.createUserStats.mockResolvedValue({
        id: 1,
        userId: "user-123",
        totalCards: 1,
        cardsReviewed: 1,
        studyStreak: 1,
        personalBestStreak: 1,
        lastStudyDate: new Date(),
        totalStudyTime: 1,
        averageAccuracy: 1,
      });

      await service.createStudySession({ ...validSessionData, rating: 3 });

      expect(mockStorage.updateFlashcard).toHaveBeenCalledWith(1, 
        expect.objectContaining({
          interval: expect.any(Number),
          easeFactor: expect.any(Number),
          nextReview: expect.any(Date),
          reviewCount: 1,
          successRate: 1,
        })
      );
    });

    it('should reset interval for "again" rating', async () => {
      mockStorage.getFlashcard.mockResolvedValue({
        ...mockCard,
        interval: 7,
        reviewCount: 5,
        successRate: 0.8,
      });
      mockStorage.createStudySession.mockResolvedValue({
        id: 1,
        ...validSessionData,
        rating: 1,
        sessionDate: new Date(),
      });
      mockStorage.getUserStats.mockResolvedValue(null);
      mockStorage.getFlashcards.mockResolvedValue([mockCard]);
      mockStorage.createUserStats.mockResolvedValue({
        id: 1,
        userId: "user-123",
        totalCards: 1,
        cardsReviewed: 1,
        studyStreak: 1,
        personalBestStreak: 1,
        lastStudyDate: new Date(),
        totalStudyTime: 1,
        averageAccuracy: 0,
      });

      await service.createStudySession({ ...validSessionData, rating: 1 });

      expect(mockStorage.updateFlashcard).toHaveBeenCalledWith(1, 
        expect.objectContaining({
          interval: 1, // Should reset to 1
          reviewCount: 6,
        })
      );
    });
  });
});