import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatProvider } from "@/context/ChatContext";
import { Sidebar } from "@/components/Sidebar";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark h-screen w-full flex overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <Sidebar className="w-72 hidden md:flex shrink-0 z-20" />
      <main className="flex-1 flex flex-col min-w-0 relative">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <MainLayout>
          <HomePage />
        </MainLayout>
      </Route>
      <Route path="/c/:id">
        <MainLayout>
          <ChatPage />
        </MainLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ChatProvider>
            <Router />
          </ChatProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
