import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTopicSchema } from "@shared/schema";
import { Plus, Edit, Trash2, BookOpen, Target, TrendingUp } from "lucide-react";

const formSchema = insertTopicSchema.omit({ userId: true });

const iconOptions = [
  { value: "fas fa-language", label: "Language" },
  { value: "fas fa-calculator", label: "Math" },
  { value: "fas fa-flask", label: "Science" },
  { value: "fas fa-book", label: "Book" },
  { value: "fas fa-globe", label: "Geography" },
  { value: "fas fa-music", label: "Music" },
  { value: "fas fa-palette", label: "Art" },
  { value: "fas fa-dumbbell", label: "Fitness" },
];

const colorOptions = [
  "#6366F1", "#8B5CF6", "#10B981", "#F59E0B", 
  "#EF4444", "#3B82F6", "#F97316", "#84CC16",
];

export default function Topics() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topics, isLoading } = useQuery({
    queryKey: ['/api/topics'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6366F1",
      icon: "fas fa-book",
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/topics", {
        ...data,
        userId: 1, // Add the required userId field
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic created successfully!",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/topics/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete topic. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!data.name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a topic name.",
        variant: "destructive",
      });
      return;
    }
    createTopicMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Topics" description="Manage your learning topics and track progress" />
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Topics" 
        description="Manage your learning topics and track progress"
        showCreateButton={false}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your Topics</h2>
          <p className="text-muted-foreground">
            {topics?.length || 0} topics • Organize your flashcards by subject
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-foreground hover:opacity-90">
              <Plus size={16} className="mr-2" />
              New Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Topic</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spanish Vocabulary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of this topic..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 flex-wrap">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => field.onChange(color)}
                              className={`w-8 h-8 rounded-full border-2 ${
                                field.value === color ? 'border-foreground' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-4 gap-2">
                          {iconOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={`p-3 rounded-lg border text-center hover:bg-accent ${
                                field.value === option.value ? 'border-primary bg-primary/10' : 'border-border'
                              }`}
                            >
                              <i className={option.value}></i>
                              <p className="text-xs mt-1">{option.label}</p>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="gradient-primary text-foreground"
                    disabled={createTopicMutation.isPending}
                  >
                    {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics?.map((topic: any) => (
          <Card key={topic.id} className="hover-lift border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: topic.color }}
                  >
                    <i className={topic.icon}></i>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteTopicMutation.mutate(topic.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen size={14} className="text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{topic.cardCount}</p>
                  <p className="text-xs text-muted-foreground">Cards</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target size={14} className="text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {Math.round(topic.accuracy * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp size={14} className="text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {Math.round(topic.masteryPercentage)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Mastery</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mastery Progress</span>
                  <span className="font-medium text-foreground">
                    {Math.round(topic.masteryPercentage)}%
                  </span>
                </div>
                <Progress value={topic.masteryPercentage} className="h-2" />
              </div>
              
              {topic.dueCount > 0 && (
                <Badge variant="outline" className="w-full justify-center">
                  {topic.dueCount} cards due for review
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {topics?.length === 0 && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-8 text-center">
            <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No topics yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first topic to start organizing your flashcards.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="gradient-primary text-foreground"
            >
              <Plus size={16} className="mr-2" />
              Create Topic
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
