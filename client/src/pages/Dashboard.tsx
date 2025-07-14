import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  Target, 
  Flame, 
  Play, 
  AlertTriangle,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
  });

  if (isLoading) {
    return (
      <div>
        <Header 
          title="Dashboard" 
          description="Welcome back! Ready to continue your learning journey?" 
        />
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const stats = analytics?.stats;
  const timeline = analytics?.timeline || {};

  return (
    <div>
      <Header 
        title="Dashboard" 
        description="Welcome back! Ready to continue your learning journey?" 
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookOpen className="text-primary" size={20} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {analytics?.totalCards || 0}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Total Cards</h3>
            <p className="text-sm text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Clock className="text-success" size={20} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {analytics?.dueToday || 0}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Due Today</h3>
            <p className="text-sm text-muted-foreground">Review pending</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Target className="text-warning" size={20} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {Math.round((stats?.averageAccuracy || 0) * 100)}%
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Accuracy</h3>
            <p className="text-sm text-success">+5% this month</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Flame className="text-secondary" size={20} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {stats?.studyStreak || 0}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Day Streak</h3>
            <p className="text-sm text-muted-foreground">Personal best: 28</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Study Session */}
        <div className="lg:col-span-2">
          <Card className="border-border overflow-hidden">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Quick Study Session</CardTitle>
                <Link href="/study">
                  <Button variant="ghost" className="text-primary hover:text-primary/80">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="gradient-card rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {analytics?.topics?.[0]?.name || "No topics"}
                  </span>
                  <Badge className="bg-primary text-white">Due Now</Badge>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Ready to start studying?
                  </h3>
                  <p className="text-muted-foreground">
                    {analytics?.dueToday > 0 
                      ? `You have ${analytics.dueToday} cards due for review.`
                      : "No cards are due for review right now."
                    }
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Link href="/study">
                    <Button className="gradient-primary text-foreground hover:opacity-90">
                      <Play size={16} className="mr-2" />
                      Start Study Session
                    </Button>
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    <Clock size={16} className="inline mr-1" />
                    Est. 15 minutes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reviews & Performance Alert */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">Upcoming Reviews</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {analytics?.topics?.slice(0, 3).map((topic: any, index: number) => (
                <div key={topic.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{topic.name}</p>
                    <p className="text-sm text-muted-foreground">{topic.cardCount} cards</p>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {index === 0 ? "in 2 hours" : index === 1 ? "tomorrow" : "in 3 days"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance Alert */}
          {analytics?.performanceAlert && (
            <Card className="border-warning/20 bg-gradient-to-r from-warning/10 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-warning" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Performance Alert</h3>
                    <p className="text-sm text-foreground/70 mb-3">
                      Your success rate in "{analytics.performanceAlert.name}" has dropped to {Math.round(analytics.performanceAlert.accuracy * 100)}%. 
                      Consider reviewing fundamentals before adding new cards.
                    </p>
                    <Button size="sm" className="bg-warning text-white hover:bg-warning/90">
                      Review Topic
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Topics & Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Topics</CardTitle>
              <Link href="/topics">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Manage Topics
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {analytics?.topics?.map((topic: any) => (
                <div key={topic.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center gradient-primary">
                      <i className={`${topic.icon} text-white`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{topic.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {topic.cardCount} cards • {Math.round(topic.accuracy * 100)}% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-muted rounded-full mb-1">
                      <div 
                        className="h-2 bg-gradient-to-r from-success to-emerald-400 rounded-full"
                        style={{ width: `${topic.masteryPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(topic.masteryPercentage)}% mastered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Study Progress */}
        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Study Progress</CardTitle>
              <select className="text-sm border border-border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cards Reviewed</span>
                <span className="font-semibold text-foreground">{stats?.cardsReviewed || 0} total</span>
              </div>
              <Progress value={78} className="h-3" />
              
              <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-semibold text-success">
                  {Math.round((stats?.averageAccuracy || 0) * 100)}%
                </span>
              </div>
              <Progress value={(stats?.averageAccuracy || 0) * 100} className="h-3" />
              
              <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-muted-foreground">Study Time</span>
                <span className="font-semibold text-foreground">
                  {Math.round((stats?.totalStudyTime || 0) / 60 * 10) / 10} hrs
                </span>
              </div>
              <Progress value={65} className="h-3" />
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">4</p>
                  <p className="text-sm text-muted-foreground">Topics Mastered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.studyStreak || 0}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spaced Repetition Timeline */}
      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Spaced Repetition Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your cards are scheduled across optimized intervals for maximum retention
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <span>Today</span>
            <span>1 Week</span>
            <span>1 Month</span>
            <span>3 Months</span>
            <span>6 Months</span>
            <span>1 Year+</span>
          </div>
          <div className="grid grid-cols-6 gap-2 mb-6">
            <div className="space-y-2">
              <div className="h-20 bg-gradient-to-t from-red-500 to-red-400 rounded-lg flex items-end justify-center pb-2">
                <span className="text-white font-semibold text-sm">{timeline.sameDay || 0}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">Same Day</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-gradient-to-t from-orange-500 to-orange-400 rounded-lg flex items-end justify-center pb-2">
                <span className="text-white font-semibold text-sm">{timeline.oneWeek || 0}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">1-7 Days</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-lg flex items-end justify-center pb-2">
                <span className="text-white font-semibold text-sm">{timeline.oneMonth || 0}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">2-4 Weeks</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-gradient-to-t from-green-500 to-green-400 rounded-lg flex items-end justify-center pb-2">
                <span className="text-white font-semibold text-sm">{timeline.threeMonths || 0}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">1-3 Months</p>
            </div>
            <div className="space-y-2">
              <div className="h-32 bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg flex items-end justify-center pb-2">
                <span className="text-white font-semibold text-sm">{timeline.sixMonths || 0}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">3-6 Months</p>
            </div>
            <div className="space-y-2">
              <div className="h-28 bg-gradient-to-t from-purple-500 to-purple-400 rounded-lg flex items-end justify-center pb-2">
                <span className="text-white font-semibold text-sm">{timeline.oneYear || 0}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">6+ Months</p>
            </div>
          </div>
          <div className="gradient-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Optimization Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Focus on today's reviews to maintain your learning momentum
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Learn More
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
