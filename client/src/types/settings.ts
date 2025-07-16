export interface UserSettings {
  id: number;
  userId: string;
  displayName: string | null;
  dailyGoal: number;
  autoAdvance: boolean;
  showAnswerImmediately: boolean;
  algorithm: 'sm2' | 'fsrs' | 'anki';
  notificationsEnabled: boolean;
  studyReminders: boolean;
  dailyStreakReminder: boolean;
  performanceAlerts: boolean;
  reminderTime: string;
  theme: 'light' | 'dark' | 'system';
  cardAnimations: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateUserSettings = Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface ImportResult {
  success: boolean;
  imported: {
    topics: number;
    flashcards: number;
  };
  errors: string[];
}

export interface ExportData {
  version: string;
  exportDate: string;
  user: any;
  settings: UserSettings | null;
  topics: any[];
  flashcards: any[];
  studySessions: any[];
  stats: any;
}