import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Brain, Home, Plus, Play, BarChart3, Tags, Settings, User } from "lucide-react";

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

  return (
    <aside className="w-64 bg-white shadow-xl border-r border-border fixed h-full z-20">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
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
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="gradient-primary p-4 rounded-xl text-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <p className="font-medium text-sm">Demo User</p>
              <p className="text-xs text-white/80">Pro Member</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
