import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StudyCard from "@/components/StudyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Play, Clock, Filter } from "lucide-react";
import { Link } from "wouter";
import type { FlashcardWithTopic } from "@shared/schema";

interface StudySessionManagerProps {
  dueCards: FlashcardWithTopic[];
  topicId?: string;
  topicName?: string;
  settings?: {
    showAnswerImmediately?: boolean;
    cardAnimations?: boolean;
  };
}

export default function StudySessionManager({ 
  dueCards, 
  topicId, 
  topicName,
  settings 
}: StudySessionManagerProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [cardStartTime, setCardStartTime] = useState<Date | null>(null);
  const [completedCards, setCompletedCards] = useState<number[]>([]);
  const [totalCardsInSession, setTotalCardsInSession] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rateCardMutation = useMutation({
    mutationFn: async ({ cardId, rating, responseTime }: { 
      cardId: number; 
      rating: number; 
      responseTime: number; 
    }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await apiRequest("POST", "/api/study-sessions", {
        cardId,
        rating,
        responseTime,
        userId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    setCardStartTime(new Date());
    setCurrentCardIndex(0);
    setCompletedCards([]);
    setTotalCardsInSession(dueCards?.length || 0);
  };

  const handleRating = async (rating: number) => {
    if (!cardStartTime || !dueCards?.[currentCardIndex]) return;

    const responseTime = Date.now() - cardStartTime.getTime();
    const currentCard = dueCards[currentCardIndex];
    const cardId = currentCard.id;

    try {
      await rateCardMutation.mutateAsync({
        cardId,
        rating,
        responseTime,
      });

      setCompletedCards(prev => [...prev, cardId]);

      // Check if this was the last card
      if (dueCards.length === 1) {
        setIsSessionActive(false);
        toast({
          title: "Study Session Complete!",
          description: `You reviewed ${completedCards.length + 1} cards. Great job!`,
        });
      } else {
        setCardStartTime(new Date());
        setCurrentCardIndex(0);
      }
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const progress = totalCardsInSession > 0 ? (completedCards.length / totalCardsInSession) * 100 : 0;

  // No cards available
  if (!dueCards || dueCards.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle size={64} className="mx-auto text-success mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {topicId ? `No cards due in ${topicName || 'this topic'}!` : "All caught up!"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {topicId 
              ? "No cards from this topic are due for review right now."
              : "No cards are due for review right now. Come back later or create new cards."
            }
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {topicId && (
              <Link href="/study">
                <Button variant="outline">
                  <Filter size={16} className="mr-2" />
                  Study All Topics
                </Button>
              </Link>
            )}
            <Link href="/create">
              <Button className="gradient-primary text-foreground">
                Create New Cards
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Session not started
  if (!isSessionActive) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Play size={64} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Ready to Study?
          </h2>
          <p className="text-muted-foreground mb-6">
            You have {dueCards.length} cards due for review
            {topicId && topicName && ` from ${topicName}`}.
          </p>
          <div className="flex items-center justify-center gap-6 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Est. {Math.ceil(dueCards.length * 0.5)} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{dueCards.length} cards</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={startSession}
              className="gradient-primary text-foreground hover:opacity-90 px-8 py-3"
            >
              <Play size={16} className="mr-2" />
              Start Study Session
            </Button>
            {topicId && (
              <Link href="/study">
                <Button variant="outline">
                  <Filter size={16} className="mr-2" />
                  Study All Topics
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentCard = dueCards[currentCardIndex];

  if (!currentCard) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No card available at this index.</p>
          <Link href="/">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Progress: {completedCards.length} of {totalCardsInSession} cards
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Study Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <StudyCard
            card={currentCard}
            onRate={handleRating}
            currentIndex={completedCards.length}
            totalCards={totalCardsInSession}
            showAnswerImmediately={settings?.showAnswerImmediately ?? false}
            cardAnimations={settings?.cardAnimations ?? true}
          />
        </div>
      </div>

      {/* Session Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        {sessionStartTime && (
          <p>
            Session time: {Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)} minutes
          </p>
        )}
      </div>
    </div>
  );
}