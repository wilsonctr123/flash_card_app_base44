import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import CreateCard from "@/pages/CreateCard";
import StudySession from "@/pages/StudySession";
import Analytics from "@/pages/Analytics";
import Topics from "@/pages/Topics";
import TopicDetail from "@/pages/TopicDetail";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/Sidebar";

function Router() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/create" component={CreateCard} />
          <Route path="/study" component={StudySession} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/topics" component={Topics} />
          <Route path="/topics/:id" component={TopicDetail} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
