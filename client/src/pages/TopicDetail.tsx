import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFlashcardSchema } from "@shared/schema";
import { Link } from "wouter";
import { Edit, Trash2, Play, Plus, BookOpen, RotateCcw, Clock, Target, Brain, FolderOpen, FolderPlus } from "lucide-react";
import ReviewHistogram from "@/components/ReviewHistogram";
import PerformanceBreakdown from "@/components/PerformanceBreakdown";

const formSchema = insertFlashcardSchema.pick({ frontText: true, backText: true });

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const topicId = parseInt(id || "0");
  const [editingCard, setEditingCard] = useState<any>(null);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<number | null>(null);
  const [showCreateSubtopic, setShowCreateSubtopic] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topic, isLoading: topicLoading, error: topicError } = useQuery({
    queryKey: [`/api/topics/${topicId}`],
  });

  const { data: cards, isLoading: cardsLoading, error: cardsError } = useQuery({
    queryKey: [`/api/flashcards/by-topic/${topicId}`],
  });

  const { data: statistics, isLoading: statisticsLoading, error: statisticsError } = useQuery({
    queryKey: [`/api/topics/${topicId}/statistics`],
    enabled: !!topicId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frontText: "",
      backText: "",
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const response = await apiRequest("PUT", `/api/flashcards/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Flashcard updated successfully!",
      });
      setEditingCard(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/flashcards/by-topic/${topicId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/flashcards/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Flashcard deleted successfully!",
      });
      setDeletingCardId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/flashcards/by-topic/${topicId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSubtopicMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/topics/${topicId}/subtopics`, { name });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subtopic created successfully!",
      });
      setShowCreateSubtopic(false);
      setNewSubtopicName("");
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${topicId}/statistics`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subtopic. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/flashcards/${id}/reset`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Card reset to review pile!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/flashcards/by-topic/${topicId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due'] });
    },
    onError: (error: any) => {
      console.error("Reset card error:", error);
      toast({
        title: "Error",
        description: "Failed to reset card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (card: any) => {
    setEditingCard(card);
    form.setValue("frontText", card.frontText);
    form.setValue("backText", card.backText);
  };

  const handleEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingCard) {
      updateCardMutation.mutate({ id: editingCard.id, data });
    }
  };

  const handleDelete = (id: number) => {
    deleteCardMutation.mutate(id);
  };

  // Group cards by subtopic
  const groupedCards = cards?.reduce((acc: any, card: any) => {
    const subtopicId = card.subtopicId || 'no-subtopic';
    const subtopicName = card.subtopic?.name || 'No Subtopic';
    
    if (!acc[subtopicId]) {
      acc[subtopicId] = {
        id: subtopicId,
        name: subtopicName,
        cards: []
      };
    }
    
    acc[subtopicId].cards.push(card);
    return acc;
  }, {});

  // Filter cards by selected subtopic
  const filteredCards = selectedSubtopic 
    ? cards?.filter((card: any) => card.subtopicId === selectedSubtopic)
    : selectedSubtopic === 0 
    ? cards?.filter((card: any) => !card.subtopicId)
    : cards;

  if (topicLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading topic details...</p>
        </div>
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div>
        <Header title="Error" />
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {topicError ? `Error: ${topicError.message}` : 'Topic not found'}
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen size={16} />
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {cards?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock size={16} />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {cards?.filter((card: any) => new Date(card.nextReview) <= new Date()).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target size={16} />
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statistics?.totalReviews || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain size={16} />
              Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {cards?.length ? Math.round((cards.filter((card: any) => card.successRate >= 0.8).length / cards.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ReviewHistogram 
          data={statistics?.reviewHistogram || []} 
          isLoading={statisticsLoading} 
        />
        <PerformanceBreakdown 
          data={statistics?.performanceBreakdown || []} 
          isLoading={statisticsLoading} 
        />
      </div>

      {/* Subtopics Section */}
      {(statistics?.subtopics?.length > 0 || cards?.length > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen size={20} />
                Filter by Subtopic
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateSubtopic(true)}
              >
                <FolderPlus size={16} className="mr-2" />
                Add Subtopic
              </Button>
            </div>
          </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedSubtopic(null)}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    selectedSubtopic === null ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <span className="font-medium">All Cards</span>
                  <Badge variant={selectedSubtopic === null ? "secondary" : "outline"}>
                    {cards?.length || 0} cards
                  </Badge>
                </button>
                
                <button
                  onClick={() => setSelectedSubtopic(0)}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    selectedSubtopic === 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <span className="font-medium">No Subtopic</span>
                  <Badge variant={selectedSubtopic === 0 ? "secondary" : "outline"}>
                    {cards?.filter((c: any) => !c.subtopicId).length || 0} cards
                  </Badge>
                </button>
                
                {statistics?.subtopics?.map((subtopic) => (
                <button
                  key={subtopic.id}
                  onClick={() => setSelectedSubtopic(subtopic.id)}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    selectedSubtopic === subtopic.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <span className="font-medium">{subtopic.name}</span>
                  <Badge variant={selectedSubtopic === subtopic.id ? "secondary" : "outline"}>
                    {subtopic.cardCount} cards
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {filteredCards && filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card: any) => (
            <Card key={card.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Badge variant={new Date(card.nextReview) <= new Date() ? "destructive" : "secondary"}>
                      {new Date(card.nextReview) <= new Date() ? "Due" : "Scheduled"}
                    </Badge>
                    {card.subtopic && (
                      <Badge variant="outline" className="text-xs">
                        <FolderOpen size={10} className="mr-1" />
                        {card.subtopic.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => resetCardMutation.mutate(card.id)}
                      title="Reset to review"
                    >
                      <RotateCcw size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(card)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingCardId(card.id)}>
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
            <h3 className="text-lg font-semibold mb-2">
              {selectedSubtopic !== null ? 'No cards in this subtopic' : 'No cards yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedSubtopic !== null 
                ? 'Create flashcards for this subtopic to start learning.'
                : 'Start building your knowledge by creating flashcards for this topic.'
              }
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

      {/* Edit Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Make changes to your flashcard. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="frontText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Front (Question)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter the question or prompt" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="backText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Back (Answer)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter the answer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCard(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCardMutation.isPending}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCardId} onOpenChange={(open) => !open && setDeletingCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this flashcard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCardId && handleDelete(deletingCardId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Subtopic Dialog */}
      <Dialog open={showCreateSubtopic} onOpenChange={setShowCreateSubtopic}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Subtopic</DialogTitle>
            <DialogDescription>
              Add a subtopic to better organize your flashcards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="subtopic-name">Subtopic Name</Label>
              <Input
                id="subtopic-name"
                value={newSubtopicName}
                onChange={(e) => setNewSubtopicName(e.target.value)}
                placeholder="Enter subtopic name..."
                className="mt-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newSubtopicName.trim()) {
                    createSubtopicMutation.mutate(newSubtopicName.trim());
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateSubtopic(false);
                setNewSubtopicName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (newSubtopicName.trim()) {
                  createSubtopicMutation.mutate(newSubtopicName.trim());
                }
              }}
              disabled={!newSubtopicName.trim() || createSubtopicMutation.isPending}
            >
              Create Subtopic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}