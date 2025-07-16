import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserSettings, UpdateUserSettings, ImportResult } from "@/types/settings";

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSettings: (updates: UpdateUserSettings) => Promise<void>;
  resetProgress: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
}

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApplyingTheme, setIsApplyingTheme] = useState(true);

  // Fetch settings
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Apply theme function
  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Apply new theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
    
    // Persist to localStorage for immediate loading on next visit
    localStorage.setItem('theme', theme);
  }, []);

  // Apply theme from localStorage immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    }
    setIsApplyingTheme(false);
  }, [applyTheme]);

  // Apply theme when settings load or change
  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme);
    }
  }, [settings?.theme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings?.theme, applyTheme]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: UpdateUserSettings) => {
      const response = await apiRequest("PATCH", "/api/settings", updates);
      return response.json();
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/settings"] });
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(["/api/settings"]);
      
      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(["/api/settings"], {
          ...previousSettings,
          ...updates,
        });
      }
      
      // Apply theme immediately if changed
      if (updates.theme) {
        applyTheme(updates.theme);
      }
      
      return { previousSettings };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(["/api/settings"], context.previousSettings);
        applyTheme(context.previousSettings.theme);
      }
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  // Reset progress mutation
  const resetProgressMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/settings/reset-progress");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your progress has been reset successfully!",
      });
      // Invalidate all data queries
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export data function
  const exportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/settings/export");
      const data = await response.json();
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flashcards-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Your data has been exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Import data function
  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await apiRequest("POST", "/api/settings/import", data);
      const result: ImportResult = await response.json();
      
      if (result.success) {
        toast({
          title: "Import Complete",
          description: `Imported ${result.imported.topics} topics and ${result.imported.flashcards} flashcards`,
        });
        
        // Refresh all data
        queryClient.invalidateQueries();
      } else {
        throw new Error("Import failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import data. Please check the file format and try again.",
        variant: "destructive",
      });
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    try {
      const response = await apiRequest("DELETE", "/api/settings/account");
      await response.json();
      
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted. Redirecting...",
      });
      
      // Clear all data and redirect
      queryClient.clear();
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value: SettingsContextType = {
    settings,
    isLoading: isLoading || isApplyingTheme,
    updateSettings: (updates) => updateSettingsMutation.mutateAsync(updates),
    resetProgress: () => resetProgressMutation.mutateAsync(),
    exportData,
    importData,
    deleteAccount,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}