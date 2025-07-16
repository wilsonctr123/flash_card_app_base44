import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type PerformanceBreakdown } from "@shared/schema";
import { PieChart, TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceBreakdownProps {
  data: PerformanceBreakdown[];
  isLoading?: boolean;
}

export default function PerformanceBreakdown({ data, isLoading }: PerformanceBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart size={20} />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReviews = data.reduce((sum, item) => sum + item.count, 0);
  const successRate = totalReviews > 0 
    ? ((data.find(d => d.rating === 3)?.count || 0) + (data.find(d => d.rating === 4)?.count || 0)) / totalReviews * 100
    : 0;

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return "bg-destructive";
      case 2: return "bg-warning";
      case 3: return "bg-success";
      case 4: return "bg-primary";
      default: return "bg-muted";
    }
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 3) {
      return <TrendingUp className="w-4 h-4 text-success" />;
    }
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart size={20} />
          Performance Breakdown
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Review performance by difficulty rating
        </p>
      </CardHeader>
      <CardContent>
        {totalReviews === 0 ? (
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No review data available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start studying to see your performance breakdown
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {data.map((item) => (
                <div key={item.rating} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRatingIcon(item.rating)}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{item.count} reviews</span>
                      <span className="font-medium">{Math.round(item.percentage)}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className="h-2"
                    indicatorClassName={getRatingColor(item.rating)}
                  />
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Success Rate</span>
                <span className={`text-lg font-bold ${successRate >= 70 ? 'text-success' : 'text-warning'}`}>
                  {Math.round(successRate)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Reviews</span>
                <span className="text-lg font-bold">{totalReviews}</span>
              </div>
              {successRate < 70 && (
                <p className="text-xs text-muted-foreground italic">
                  Tip: Cards marked as "Again" or "Hard" will appear more frequently
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}