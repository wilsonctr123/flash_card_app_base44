import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFlashcardSchema } from "@shared/schema";
import { Image, Video, Plus } from "lucide-react";

const formSchema = insertFlashcardSchema.extend({
  topicId: z.coerce.number().positive("Please select a topic"),
});

export default function CreateCard() {
  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topics } = useQuery({
    queryKey: ['/api/topics'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frontText: "",
      backText: "",
      frontImage: "",
      backImage: "",
      frontVideo: "",
      backVideo: "",
      topicId: undefined, // No default topic
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/flashcards", {
        ...data,
        frontImage: frontImage || null,
        backImage: backImage || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Flashcard created successfully!",
      });
      form.reset();
      setFrontImage("");
      setBackImage("");
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!data.topicId || data.topicId === 0) {
      toast({
        title: "Error",
        description: "Please select a topic.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.frontText.trim() || !data.backText.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both front and back text.",
        variant: "destructive",
      });
      return;
    }
    
    createCardMutation.mutate(data);
  };

  return (
    <div>
      <Header 
        title="Create Flashcard" 
        description="Create multimedia flashcards with text, images, and videos"
        showCreateButton={false}
      />

      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="topicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics?.map((topic: any) => (
                            <SelectItem key={topic.id} value={topic.id.toString()}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Front Side */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Front Side</span>
                    <span className="text-sm text-muted-foreground">(Question)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="frontText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the question or prompt..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Label>Image (Optional)</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="url"
                        placeholder="Enter image URL..."
                        value={frontImage}
                        onChange={(e) => setFrontImage(e.target.value)}
                      />
                      {frontImage && (
                        <div className="border border-border rounded-lg p-2">
                          <img 
                            src={frontImage} 
                            alt="Front preview" 
                            className="max-w-full max-h-40 rounded"
                            onError={() => setFrontImage("")}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="frontVideo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="Enter video URL..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Back Side */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Back Side</span>
                    <span className="text-sm text-muted-foreground">(Answer)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="backText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the answer or explanation..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Label>Image (Optional)</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="url"
                        placeholder="Enter image URL..."
                        value={backImage}
                        onChange={(e) => setBackImage(e.target.value)}
                      />
                      {backImage && (
                        <div className="border border-border rounded-lg p-2">
                          <img 
                            src={backImage} 
                            alt="Back preview" 
                            className="max-w-full max-h-40 rounded"
                            onError={() => setBackImage("")}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="backVideo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="Enter video URL..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-8 mb-8 pt-4 border-t border-border">
              <Button 
                type="submit" 
                className="gradient-primary text-foreground hover:opacity-90 px-12 py-4 text-lg font-semibold shadow-lg"
                disabled={createCardMutation.isPending}
              >
                {createCardMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus size={20} className="mr-2" />
                    Create Flashcard
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
