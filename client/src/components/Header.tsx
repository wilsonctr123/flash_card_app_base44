import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  title: string;
  description?: string;
  showCreateButton?: boolean;
}

export default function Header({ title, description, showCreateButton = true }: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => {
              // TODO: Implement notification panel
              // For now, just show a message
              alert("Notifications coming soon!");
            }}
          >
            <Bell size={20} />
            {/* TODO: Add real notification count */}
          </Button>
          {showCreateButton && (
            <Link href="/create">
              <Button className="gradient-primary text-foreground hover:opacity-90">
                <Plus size={16} className="mr-2" />
                New Card
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
