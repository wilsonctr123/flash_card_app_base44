/**
 * Spaced Repetition Algorithm Implementation
 * Based on the SM-2 algorithm with modifications for better UX
 */

export interface CardSchedule {
  interval: number; // days until next review
  easeFactor: number; // difficulty multiplier
  nextReview: Date;
}

export const SPACED_REPETITION_INTERVALS = {
  SAME_DAY: 0,
  ONE_DAY: 1,
  FOUR_DAYS: 4,
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
  ONE_MONTH: 30,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  ONE_YEAR: 365,
  TWO_YEARS: 730
};

/**
 * Calculate the next review schedule based on user rating
 * @param currentSchedule Current card schedule
 * @param rating User rating (1-4): 1=Again, 2=Hard, 3=Good, 4=Easy
 * @returns New schedule for the card
 */
export function calculateNextReview(
  currentSchedule: CardSchedule,
  rating: number
): CardSchedule {
  const { interval, easeFactor } = currentSchedule;
  
  let newInterval: number;
  let newEaseFactor: number;

  // Adjust ease factor based on rating
  if (rating >= 3) {
    // Good or Easy response
    newEaseFactor = Math.min(2.5, easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
  } else {
    // Hard or Again response
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  }

  // Calculate new interval
  switch (rating) {
    case 1: // Again - restart from beginning
      newInterval = 1;
      break;
    case 2: // Hard - increase interval slightly
      newInterval = Math.max(1, Math.round(interval * 1.2));
      break;
    case 3: // Good - normal progression
      if (interval === 1) {
        newInterval = 6;
      } else if (interval < 6) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
      break;
    case 4: // Easy - accelerated progression
      if (interval === 1) {
        newInterval = 4;
      } else {
        newInterval = Math.round(interval * newEaseFactor * 1.3);
      }
      newEaseFactor = Math.min(2.5, newEaseFactor + 0.15);
      break;
    default:
      newInterval = interval;
      newEaseFactor = easeFactor;
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(9, 0, 0, 0); // Set to 9 AM for consistency

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReview
  };
}

/**
 * Get the category of a review interval for timeline visualization
 */
export function getIntervalCategory(interval: number): string {
  if (interval <= 0) return 'sameDay';
  if (interval <= 7) return 'oneWeek';
  if (interval <= 30) return 'oneMonth';
  if (interval <= 90) return 'threeMonths';
  if (interval <= 180) return 'sixMonths';
  return 'oneYear';
}

/**
 * Calculate optimal study session size based on available time and card difficulty
 */
export function calculateSessionSize(
  availableMinutes: number,
  averageCardTime: number = 30, // seconds per card
  maxCards: number = 50
): number {
  const maxCardsFromTime = Math.floor((availableMinutes * 60) / averageCardTime);
  return Math.min(maxCards, maxCardsFromTime);
}

/**
 * Determine if a user should be warned about adding new cards
 * based on their current performance
 */
export function shouldWarnAboutNewCards(
  averageAccuracy: number,
  dueCardCount: number,
  threshold: number = 0.75,
  maxDueCards: number = 100
): boolean {
  return averageAccuracy < threshold || dueCardCount > maxDueCards;
}
