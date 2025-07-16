import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import StudyCard from "@/components/StudyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { apiRequest } from "@/lib/queryClient";
import { Play, CheckCircle, Clock, Filter } from "lucide-react";
import { Link } from "wouter";

export default function StudySession() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [cardStartTime, setCardStartTime] = useState<Date | null>(null);
  const [completedCards, setCompletedCards] = useState<number[]>([]);
  const [totalCardsInSession, setTotalCardsInSession] = useState(0);
  const [cardsToReviewAgain, setCardsToReviewAgain] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
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

  const rateCardMutation = useMutation({
    mutationFn: async ({ cardId, rating, responseTime }: { 
      cardId: number; 
      rating: number; 
      responseTime: number; 
    }) => {
      const response = await apiRequest("POST", "/api/study-sessions", {
        cardId,
        rating,
        responseTime,
        userId: user?.id || "",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
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
      // If rating is "Again" (1), add the card to review again list
      if (rating === 1) {
        setCardsToReviewAgain(prev => [...prev, currentCard]);
      }

      await rateCardMutation.mutateAsync({
        cardId,
        rating,
        responseTime,
      });

      setCompletedCards(prev => [...prev, cardId]);

      // Check if this was the last card from original due list
      if (dueCards.length === 1 && cardsToReviewAgain.length === 0) {
        // Session completed
        setIsSessionActive(false);
        toast({
          title: "Study Session Complete!",
          description: `You reviewed ${completedCards.length + 1} cards. Great job!`,
        });
      } else {
        // More cards remaining
        setCardStartTime(new Date());
        setCurrentCardIndex(0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const progress = totalCardsInSession > 0 ? (completedCards.length / totalCardsInSession) * 100 : 0;

  if (isLoading) {
    return (
      <div>
        <Header title="Study Session" description="Review your due flashcards" />
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!dueCards || dueCards.length === 0) {
    return (
      <div>
        <Header 
          title="Study Session" 
          description={topicId && topic ? `Reviewing ${topic.name}` : "Review your due flashcards"} 
        />
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-success mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {topicId ? `No cards due in ${topic?.name || 'this topic'}!` : "All caught up!"}
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
      </div>
    );
  }

  if (!isSessionActive) {
    return (
      <div>
        <Header 
          title="Study Session" 
          description={topicId && topic ? `Reviewing ${topic.name}` : "Review your due flashcards"} 
        />
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Play size={64} className="mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Ready to Study?
            </h2>
            <p className="text-muted-foreground mb-6">
              You have {dueCards.length} cards due for review
              {topicId && topic && ` from ${topic.name}`}.
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
      </div>
    );
  }

  const currentCard = dueCards[currentCardIndex];

  if (!currentCard) {
    return (
      <div>
        <Header title="Study Session" description="Review your due flashcards" />
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No card available at this index.</p>
            <Link href="/">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Study Session" 
        description={topicId && topic ? `Reviewing ${topic.name}` : "Review your due flashcards"} 
      />
      
      <div className="max-w-4xl mx-auto">
        {/* Topic Filter Indicator */}
        {topicId && topic && (
          <div className="mb-6 flex items-center justify-between bg-accent rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtering by topic:</span>
              <span className="font-medium text-foreground">{topic.name}</span>
            </div>
            <Link href="/study">
              <Button variant="ghost" size="sm">
                Clear Filter
              </Button>
            </Link>
          </div>
        )}
        
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
    </div>
  );
}
