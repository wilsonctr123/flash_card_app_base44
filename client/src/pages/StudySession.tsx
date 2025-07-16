import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import StudySessionManager from "@/components/study/StudySessionManager";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";

export default function StudySession() {
  const { settings } = useSettings();
  const [location] = useLocation();
  
  // Extract topic ID from URL query parameters
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const topicId = searchParams.get('topic');
  
  // Get all due cards
  const { data: allDueCards, isLoading: isLoadingDue } = useQuery({
    queryKey: ['/api/flashcards/due'],
  });
  
  // Get topic details if filtering by topic
  const { data: topic, isLoading: isLoadingTopic } = useQuery({
    queryKey: [`/api/topics/${topicId}`],
    enabled: !!topicId,
  });
  
  // Filter cards by topic if topicId is provided
  const dueCards = topicId 
    ? allDueCards?.filter((card: any) => card.topicId === parseInt(topicId))
    : allDueCards;
    
  const isLoading = isLoadingDue || (topicId && isLoadingTopic);


  if (isLoading) {
    return (
      <div>
        <Header title="Study Session" description="Review your due flashcards" />
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }


  return (
    <div>
      <Header 
        title="Study Session" 
        description={topicId && topic ? `Reviewing ${topic.name}` : "Review your due flashcards"} 
      />
      
      <StudySessionManager
        dueCards={dueCards || []}
        topicId={topicId}
        topicName={topic?.name}
        settings={{
          showAnswerImmediately: settings?.showAnswerImmediately,
          cardAnimations: settings?.cardAnimations,
        }}
      />
    </div>
  );
}
