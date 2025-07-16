import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ReviewHistogramData } from "@shared/schema";
import { BarChart3, Calendar } from "lucide-react";

interface ReviewHistogramProps {
  data: ReviewHistogramData[];
  isLoading?: boolean;
}

export default function ReviewHistogram({ data, isLoading }: ReviewHistogramProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Review Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barHeight = 160;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={20} />
          Review Schedule
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Cards due for review over the next 30 days
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No cards scheduled for review</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative h-48 overflow-hidden">
              <div className="flex items-end justify-between h-full gap-1">
                {Array.from({ length: 31 }, (_, i) => {
                  const dayData = data.find(d => d.day === i);
                  const count = dayData?.count || 0;
                  const height = count > 0 ? (count / maxCount) * barHeight : 0;
                  const isToday = i === 0;
                  const isWeekend = new Date(Date.now() + i * 24 * 60 * 60 * 1000).getDay() % 6 === 0;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div className="relative w-full group">
                        {count > 0 && (
                          <>
                            <div 
                              className={`w-full rounded-t transition-all ${
                                isToday 
                                  ? 'bg-primary hover:bg-primary/90' 
                                  : isWeekend 
                                    ? 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                                    : 'bg-primary/60 hover:bg-primary/70'
                              }`}
                              style={{ height: `${height}px` }}
                            />
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                              {count} card{count !== 1 ? 's' : ''}
                              {isToday && ' (Today)'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Today</span>
              <span>+1 week</span>
              <span>+2 weeks</span>
              <span>+3 weeks</span>
              <span>+30 days</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Due Today</p>
                <p className="text-2xl font-bold text-primary">
                  {data.find(d => d.day === 0)?.count || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Next 7 Days</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {data.filter(d => d.day >= 0 && d.day <= 7).reduce((sum, d) => sum + d.count, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}