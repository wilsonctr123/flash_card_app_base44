import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import StudyCard from "@/components/StudyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";

export default function StudySession() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [cardStartTime, setCardStartTime] = useState<Date | null>(null);
  const [completedCards, setCompletedCards] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dueCards, isLoading } = useQuery({
    queryKey: ['/api/flashcards/due'],
  });

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
        userId: 1,
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
  };

  const handleRating = (rating: number) => {
    if (!cardStartTime || !dueCards?.[currentCardIndex]) return;

    const responseTime = Date.now() - cardStartTime.getTime();
    const cardId = dueCards[currentCardIndex].id;

    rateCardMutation.mutate({
      cardId,
      rating,
      responseTime,
    });

    setCompletedCards(prev => [...prev, cardId]);

    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setCardStartTime(new Date());
    } else {
      // Session completed
      setIsSessionActive(false);
      toast({
        title: "Study Session Complete!",
        description: `You reviewed ${dueCards.length} cards. Great job!`,
      });
    }
  };

  const progress = dueCards ? (completedCards.length / dueCards.length) * 100 : 0;

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
        <Header title="Study Session" description="Review your due flashcards" />
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-success mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              All caught up!
            </h2>
            <p className="text-muted-foreground mb-6">
              No cards are due for review right now. Come back later or create new cards.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/create">
                <Button className="gradient-primary text-white">
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
        <Header title="Study Session" description="Review your due flashcards" />
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Play size={64} className="mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Ready to Study?
            </h2>
            <p className="text-muted-foreground mb-6">
              You have {dueCards.length} cards due for review.
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
            <Button 
              onClick={startSession}
              className="gradient-primary text-white hover:opacity-90 px-8 py-3"
            >
              <Play size={16} className="mr-2" />
              Start Study Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = dueCards[currentCardIndex];

  return (
    <div>
      <Header title="Study Session" description="Review your due flashcards" />
      
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Progress: {completedCards.length} of {dueCards.length} cards
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
              currentIndex={currentCardIndex}
              totalCards={dueCards.length}
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
