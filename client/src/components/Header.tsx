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
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          {showCreateButton && (
            <Link href="/create">
              <Button className="gradient-primary text-white hover:opacity-90">
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
