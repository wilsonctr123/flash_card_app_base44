/**
 * Date utility functions for the spaced repetition application
 */

/**
 * Format a date for display in the UI
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return formatRelativeTime(dateObj);
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'long' 
    ? { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    : { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format time duration in a human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format relative time (e.g., "in 2 hours", "3 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  if (Math.abs(diffDays) >= 1) {
    if (diffDays > 0) {
      return diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;
    } else {
      return Math.abs(diffDays) === 1 ? 'yesterday' : `${Math.abs(diffDays)} days ago`;
    }
  }

  if (Math.abs(diffHours) >= 1) {
    if (diffHours > 0) {
      return diffHours === 1 ? 'in 1 hour' : `in ${diffHours} hours`;
    } else {
      return Math.abs(diffHours) === 1 ? '1 hour ago' : `${Math.abs(diffHours)} hours ago`;
    }
  }

  if (Math.abs(diffMinutes) >= 1) {
    if (diffMinutes > 0) {
      return diffMinutes === 1 ? 'in 1 minute' : `in ${diffMinutes} minutes`;
    } else {
      return Math.abs(diffMinutes) === 1 ? '1 minute ago' : `${Math.abs(diffMinutes)} minutes ago`;
    }
  }

  return diffMs > 0 ? 'due now' : 'just now';
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is overdue (past today)
 */
export function isOverdue(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dateObj < today;
}

/**
 * Get the start and end of a date range for analytics
 */
export function getDateRange(period: 'week' | 'month' | '3months' | 'year'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case '3months':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Calculate study streak from study sessions
 */
export function calculateStudyStreak(studyDates: Date[]): number {
  if (studyDates.length === 0) return 0;

  // Sort dates in descending order
  const sortedDates = studyDates
    .map(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  // Remove duplicates
  const uniqueDates = sortedDates.filter((date, index) => 
    index === 0 || date.getTime() !== sortedDates[index - 1].getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (uniqueDates[i].getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Format study time in hours and minutes
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get time of day greeting
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Calculate the optimal review time based on user's study patterns
 */
export function calculateOptimalReviewTime(studySessions: Date[]): number {
  if (studySessions.length === 0) return 18; // Default to 6 PM

  const hours = studySessions.map(date => new Date(date).getHours());
  const hourCounts = hours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Find the hour with the most study sessions
  const optimalHour = Object.entries(hourCounts)
    .reduce((max, [hour, count]) => 
      count > max.count ? { hour: parseInt(hour), count } : max, 
      { hour: 18, count: 0 }
    ).hour;

  return optimalHour;
}
