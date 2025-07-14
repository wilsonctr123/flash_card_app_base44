import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Edit, Trash2, Play, Plus, BookOpen } from "lucide-react";

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const topicId = parseInt(id || "0");

  const { data: topic } = useQuery({
    queryKey: [`/api/topics/${topicId}`],
  });

  const { data: cards } = useQuery({
    queryKey: [`/api/flashcards/by-topic/${topicId}`],
  });

  if (!topic) {
    return (
      <div>
        <Header title="Topic not found" />
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">The requested topic could not be found.</p>
          <Link href="/topics">
            <Button>Back to Topics</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title={topic.name} 
        description={topic.description || "No description provided"}
        showCreateButton={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {cards?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Due Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {cards?.filter((card: any) => new Date(card.nextReview) <= new Date()).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {cards?.length ? Math.round((cards.filter((card: any) => card.successRate >= 0.8).length / cards.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Flashcards</h2>
        <div className="flex gap-3">
          <Link href={`/study?topic=${topicId}`}>
            <Button className="gradient-primary text-foreground">
              <Play size={16} className="mr-2" />
              Study Topic
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="outline">
              <Plus size={16} className="mr-2" />
              Add Card
            </Button>
          </Link>
        </div>
      </div>

      {cards && cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card: any) => (
            <Card key={card.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={new Date(card.nextReview) <= new Date() ? "destructive" : "secondary"}>
                    {new Date(card.nextReview) <= new Date() ? "Due" : "Scheduled"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Front</h4>
                    <p className="text-sm line-clamp-2">{card.frontText}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Back</h4>
                    <p className="text-sm line-clamp-2">{card.backText}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Reviews: {card.reviewCount}</span>
                    <span>Success: {Math.round(card.successRate * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your knowledge by creating flashcards for this topic.
            </p>
            <Link href="/create">
              <Button className="gradient-primary text-foreground">
                <Plus size={16} className="mr-2" />
                Create First Card
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}