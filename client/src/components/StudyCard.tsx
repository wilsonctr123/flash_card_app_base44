import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Clock, Check, Rocket } from "lucide-react";
import type { FlashcardWithTopic } from "@shared/schema";

interface StudyCardProps {
  card: FlashcardWithTopic;
  onRate: (rating: number) => void;
  currentIndex: number;
  totalCards: number;
  showAnswerImmediately?: boolean;
  cardAnimations?: boolean;
}

export default function StudyCard({ 
  card, 
  onRate, 
  currentIndex, 
  totalCards, 
  showAnswerImmediately = false,
  cardAnimations = true 
}: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(showAnswerImmediately);

  const handleRate = (rating: number) => {
    setIsFlipped(false);
    // Small delay to show the flip animation before moving to next card
    setTimeout(() => {
      onRate(rating);
    }, 300);
  };

  return (
    <Card 
      className={`gradient-card border-border overflow-hidden hover-lift cursor-pointer ${
        cardAnimations ? 'transition-transform duration-200' : ''
      }`}
      onClick={() => !isFlipped && setIsFlipped(true)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {card?.topic?.name || 'Unknown Topic'}
          </Badge>
          <Badge variant="outline">
            Due Now
          </Badge>
        </div>
        
        <div className="mb-6 min-h-[200px] flex items-center justify-center">
          <div 
            className={`text-center w-full ${
              cardAnimations ? 'transition-all duration-300 ease-in-out' : ''
            }`}
          >
            {!isFlipped ? (
              <div className={cardAnimations ? 'animate-fade-in' : ''}>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {card?.frontText || 'No question'}
                </h3>
                {card.frontImage && (
                  <img 
                    src={card.frontImage} 
                    alt="Front" 
                    className="max-w-full max-h-40 mx-auto rounded-lg mb-2"
                  />
                )}
                {!showAnswerImmediately && (
                  <p className="text-muted-foreground">Click to reveal answer</p>
                )}
              </div>
            ) : (
              <div className={cardAnimations ? 'animate-fade-in' : ''}>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {card?.backText || 'No answer'}
                </h3>
                {card.backImage && (
                  <img 
                    src={card.backImage} 
                    alt="Back" 
                    className="max-w-full max-h-40 mx-auto rounded-lg mb-2"
                  />
                )}
              </div>
            )}
          </div>
        </div>
        
        {isFlipped && (
          <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="flex space-x-3">
              <Button 
                onClick={() => handleRate(1)}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                <RotateCcw size={14} className="mr-1" />
                Again
              </Button>
              <Button 
                onClick={() => handleRate(2)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                size="sm"
              >
                <Clock size={14} className="mr-1" />
                Hard
              </Button>
              <Button 
                onClick={() => handleRate(3)}
                className="bg-success hover:bg-success/90 text-white"
                size="sm"
              >
                <Check size={14} className="mr-1" />
                Good
              </Button>
              <Button 
                onClick={() => handleRate(4)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Rocket size={14} className="mr-1" />
                Easy
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {totalCards}
            </span>
          </div>
        )}
        
        {!isFlipped && (
          <div className="flex justify-end">
            <span className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {totalCards}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
