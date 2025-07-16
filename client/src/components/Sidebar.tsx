import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Brain, Home, Plus, Play, BarChart3, Tags, Settings, User, Folder, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Create Cards", href: "/create", icon: Plus },
  { name: "Study Session", href: "/study", icon: Play },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Topics", href: "/topics", icon: Tags },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const isDev = import.meta.env.DEV;
  const { user } = useAuth();
  
  const { data: topics } = useQuery({
    queryKey: ['/api/topics'],
  });

  const { data: topicsWithStats } = useQuery({
    queryKey: ['/api/topics-with-stats'],
  });
  
  const { data: userSettings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const handleLogout = () => {
    if (isDev) {
      // In development, since auth is always on, we need to use a different approach
      // Clear any local storage and force a page that doesn't require auth
      window.location.href = '/landing';
    } else {
      // In production, use Replit logout
      window.location.href = '/api/logout';
    }
  };

  return (
    <aside className="w-64 bg-white shadow-xl border-r border-border fixed h-full z-20">
      <div className="p-6">
        <div 
          className="flex items-center space-x-3 mb-8 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogout}
        >
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Brain className="text-white text-lg" />
          </div>
          <h1 className="text-xl font-bold text-foreground">MemoryAce</h1>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Card Decks Section */}
        <div className="mt-8 mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-4 mb-3">
            Card Decks
          </h3>
          <div className="space-y-1">
            {topicsWithStats && topicsWithStats.length > 0 ? (
              topicsWithStats.map((topic: any) => {
                const topicPath = `/topics/${topic.id}`;
                const isActive = location === topicPath;
                return (
                  <Link key={topic.id} href={topicPath}>
                    <div
                      className={cn(
                        "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: topic.color || '#6366F1' }}
                      />
                      <span className="truncate">{topic.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {topic.cardCount || 0}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No topics yet. Create your first topic!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="gradient-primary p-4 rounded-xl text-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {userSettings?.displayName || user?.name || user?.username || "User"}
              </p>
              <p className="text-xs text-white/80">
                {user?.email || "member@memoryace.com"}
              </p>
            </div>
            {isDev && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-white/20 text-white p-1"
                title="Logout"
              >
                <LogOut size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
