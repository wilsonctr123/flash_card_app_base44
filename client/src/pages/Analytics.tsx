import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Clock, 
  Award,
  BarChart3
} from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
  });

  const { data: topics } = useQuery({
    queryKey: ['/api/topics'],
  });

  if (isLoading) {
    return (
      <div>
        <Header title="Analytics" description="Track your learning progress and performance" />
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const stats = analytics?.stats;
  const timeline = analytics?.timeline || {};

  return (
    <div>
      <Header 
        title="Analytics" 
        description="Track your learning progress and performance"
        showCreateButton={false} 
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Study Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((stats?.totalStudyTime || 0) / 60 * 10) / 10}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cards Reviewed</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.cardsReviewed || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Accuracy</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((stats?.averageAccuracy || 0) * 100)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.studyStreak || 0} days
                </p>
              </div>
              <Award className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Topic Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Topic Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics?.map((topic: any) => (
              <div key={topic.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    ></div>
                    <span className="font-medium text-foreground">{topic.name}</span>
                  </div>
                  <Badge variant="outline">
                    {Math.round(topic.accuracy * 100)}% accuracy
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={topic.accuracy * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground min-w-0">
                    {topic.cardCount} cards
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mastery Progress */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} />
              Mastery Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics?.map((topic: any) => {
              const masteryLevel = topic.masteryPercentage;
              let masteryColor = "text-red-500";
              let masteryLabel = "Beginner";
              
              if (masteryLevel >= 80) {
                masteryColor = "text-green-500";
                masteryLabel = "Expert";
              } else if (masteryLevel >= 60) {
                masteryColor = "text-blue-500";
                masteryLabel = "Advanced";
              } else if (masteryLevel >= 40) {
                masteryColor = "text-yellow-500";
                masteryLabel = "Intermediate";
              }

              return (
                <div key={topic.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    ></div>
                    <div>
                      <p className="font-medium text-foreground">{topic.name}</p>
                      <p className={`text-sm ${masteryColor}`}>{masteryLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {Math.round(masteryLevel)}%
                    </p>
                    <p className="text-xs text-muted-foreground">mastered</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Spaced Repetition Distribution */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Spaced Repetition Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="h-24 bg-gradient-to-t from-red-500 to-red-400 rounded-lg flex items-end justify-center pb-2 mb-2">
                <span className="text-white font-bold text-lg">{timeline.sameDay || 0}</span>
              </div>
              <p className="text-sm font-medium text-foreground">Same Day</p>
              <p className="text-xs text-muted-foreground">Due now</p>
            </div>
            
            <div className="text-center">
              <div className="h-20 bg-gradient-to-t from-orange-500 to-orange-400 rounded-lg flex items-end justify-center pb-2 mb-2">
                <span className="text-white font-bold text-lg">{timeline.oneWeek || 0}</span>
              </div>
              <p className="text-sm font-medium text-foreground">1-7 Days</p>
              <p className="text-xs text-muted-foreground">Short term</p>
            </div>
            
            <div className="text-center">
              <div className="h-28 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-lg flex items-end justify-center pb-2 mb-2">
                <span className="text-white font-bold text-lg">{timeline.oneMonth || 0}</span>
              </div>
              <p className="text-sm font-medium text-foreground">2-4 Weeks</p>
              <p className="text-xs text-muted-foreground">Medium term</p>
            </div>
            
            <div className="text-center">
              <div className="h-32 bg-gradient-to-t from-green-500 to-green-400 rounded-lg flex items-end justify-center pb-2 mb-2">
                <span className="text-white font-bold text-lg">{timeline.threeMonths || 0}</span>
              </div>
              <p className="text-sm font-medium text-foreground">1-3 Months</p>
              <p className="text-xs text-muted-foreground">Long term</p>
            </div>
            
            <div className="text-center">
              <div className="h-36 bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg flex items-end justify-center pb-2 mb-2">
                <span className="text-white font-bold text-lg">{timeline.sixMonths || 0}</span>
              </div>
              <p className="text-sm font-medium text-foreground">3-6 Months</p>
              <p className="text-xs text-muted-foreground">Extended</p>
            </div>
            
            <div className="text-center">
              <div className="h-32 bg-gradient-to-t from-purple-500 to-purple-400 rounded-lg flex items-end justify-center pb-2 mb-2">
                <span className="text-white font-bold text-lg">{timeline.oneYear || 0}</span>
              </div>
              <p className="text-sm font-medium text-foreground">6+ Months</p>
              <p className="text-xs text-muted-foreground">Mastered</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
