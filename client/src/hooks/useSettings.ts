import { useMemo } from "react";
import { useSettingsContext } from "@/contexts/SettingsContext";
import type { UpdateUserSettings } from "@/types/settings";

export function useSettings() {
  const context = useSettingsContext();
  
  // Memoized helper functions for common settings updates
  const helpers = useMemo(() => ({
    // Theme helpers
    setTheme: (theme: 'light' | 'dark' | 'system') => 
      context.updateSettings({ theme }),
    
    // Study settings helpers
    setDailyGoal: (dailyGoal: number) => 
      context.updateSettings({ dailyGoal }),
    
    setAutoAdvance: (autoAdvance: boolean) => 
      context.updateSettings({ autoAdvance }),
    
    setShowAnswerImmediately: (showAnswerImmediately: boolean) => 
      context.updateSettings({ showAnswerImmediately }),
    
    setAlgorithm: (algorithm: 'sm2' | 'fsrs' | 'anki') => 
      context.updateSettings({ algorithm }),
    
    // Notification helpers
    setNotificationsEnabled: (notificationsEnabled: boolean) => 
      context.updateSettings({ notificationsEnabled }),
    
    setStudyReminders: (studyReminders: boolean) => 
      context.updateSettings({ studyReminders }),
    
    setDailyStreakReminder: (dailyStreakReminder: boolean) => 
      context.updateSettings({ dailyStreakReminder }),
    
    setPerformanceAlerts: (performanceAlerts: boolean) => 
      context.updateSettings({ performanceAlerts }),
    
    setReminderTime: (reminderTime: string) => 
      context.updateSettings({ reminderTime }),
    
    // Appearance helpers
    setCardAnimations: (cardAnimations: boolean) => 
      context.updateSettings({ cardAnimations }),
    
    // Profile helpers
    setDisplayName: (displayName: string | null) => 
      context.updateSettings({ displayName }),
    
    // Batch update
    updateMultiple: (updates: UpdateUserSettings) => 
      context.updateSettings(updates),
  }), [context]);
  
  return {
    ...context,
    ...helpers,
  };
}