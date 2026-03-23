import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { MessageSquare, Plus, Trash2, Zap, Settings, Command } from "lucide-react";
import { useListOpenaiConversations, useDeleteOpenaiConversation, getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function Sidebar({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();
  const { data: conversations, isLoading } = useListOpenaiConversations();
  const { mutate: deleteConversation } = useDeleteOpenaiConversation();
  const queryClient = useQueryClient();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (location === `/c/${id}`) {
            setLocation("/");
          }
        },
      }
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#050507] border-r border-white/5", className)}>
      <div className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 px-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-white">Nexus<span className="text-primary">.ai</span></span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <Link 
          href="/"
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium transition-all hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Thread
          <div className="ml-auto flex items-center gap-1 opacity-40">
            <Command className="w-3 h-3" />
            <span className="text-xs">K</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-3 pb-2 text-xs font-semibold text-white/30 tracking-wider uppercase">
          Recent
        </div>
        
        {isLoading ? (
          <div className="px-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-white/40">
            No conversations yet.
          </div>
        ) : (
          conversations?.map((conv) => {
            const isActive = location === `/c/${conv.id}`;
            return (
              <Link 
                key={conv.id} 
                href={`/c/${conv.id}`}
                className={cn(
                  "group relative flex flex-col gap-1 w-full px-3 py-3 rounded-xl text-sm transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                <div className="flex items-center justify-between w-full truncate">
                  <div className="flex items-center gap-3 truncate">
                    <MessageSquare className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-white/40")} />
                    <span className="truncate font-medium">{conv.title || "Untitled"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all shrink-0 text-white/40 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className={cn("text-[10px] pl-7 opacity-60", isActive && "text-primary/70")}>
                  {format(new Date(conv.createdAt), "MMM d, h:mm a")}
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-white/5 mt-auto">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
