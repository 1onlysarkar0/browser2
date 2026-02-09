import { useAutomations, useDeleteAutomation, useStartAutomation, useStopAutomation } from "@/hooks/use-automations";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Square, Edit, Trash2, Plus, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const { data: automations, isLoading, error } = useAutomations();
  const deleteMutation = useDeleteAutomation();
  const startMutation = useStartAutomation();
  const stopMutation = useStopAutomation();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <h3 className="text-lg font-bold">Failed to load</h3>
        <p className="text-sm opacity-80">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your browser automations.</p>
        </div>
        <Link href="/create">
          <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </Link>
      </div>

      {automations?.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No automations yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Create your first automation task to have the browser perform actions for you.
          </p>
          <Link href="/create">
            <Button variant="outline" className="mt-4">Create Automation</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {automations?.map((auto) => (
            <div
              key={auto.id}
              className="group bg-card hover:bg-card/80 border border-border hover:border-primary/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                    auto.status === "running" ? "bg-green-500 shadow-green-500/50 animate-pulse" : "bg-muted-foreground/30"
                  )} />
                  <h3 className="font-semibold text-lg line-clamp-1">{auto.name}</h3>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/edit/${auto.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Automation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the automation "{auto.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(auto.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="w-4 h-4" />
                  <span className="truncate font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{auto.url}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {auto.lastRun 
                      ? `Ran ${formatDistanceToNow(new Date(auto.lastRun))} ago`
                      : "Never run"}
                  </span>
                </div>
                
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">
                  {auto.steps.length} Steps
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex gap-3">
                {auto.status === "running" ? (
                  <Button 
                    variant="destructive" 
                    className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                    onClick={() => stopMutation.mutate(auto.id)}
                    disabled={stopMutation.isPending}
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    {stopMutation.isPending ? "Stopping..." : "Stop"}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-none hover:shadow-none"
                    onClick={() => startMutation.mutate(auto.id)}
                    disabled={startMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    {startMutation.isPending ? "Starting..." : "Run Now"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
