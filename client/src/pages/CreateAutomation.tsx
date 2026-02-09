import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAutomationSchema, stepSchema, type Step, type InsertAutomation } from "@shared/schema";
import { useCreateAutomation, useUpdateAutomation, useAutomation } from "@/hooks/use-automations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StepBuilder } from "@/components/StepBuilder";
import { ArrowLeft, Save, Globe, Code, Eye, LayoutGrid, List as ListIcon, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Frontend validation schema
const formSchema = insertAutomationSchema.extend({
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

export default function CreateAutomation() {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute("/edit/:id");
  const isEditing = match && params?.id;
  const [activeTab, setActiveTab] = useState<"preview" | "selectors">("preview");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [selectors, setSelectors] = useState<string[]>([]);
  const [copiedSelector, setCopiedSelector] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { data: existingAutomation, isLoading: isLoadingAutomation } = useAutomation(
    isEditing ? parseInt(params.id) : null
  );

  const createMutation = useCreateAutomation();
  const updateMutation = useUpdateAutomation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      schedule: "",
      steps: [],
    },
  });

  // Load data when editing
  useEffect(() => {
    if (existingAutomation) {
      form.reset({
        name: existingAutomation.name,
        url: existingAutomation.url,
        schedule: existingAutomation.schedule || "",
        steps: existingAutomation.steps,
      });
    }
  }, [existingAutomation, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: parseInt(params!.id), ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleFetchSelectors = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Try to access iframe content if same-origin (proxied usually is)
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        const elements = doc.querySelectorAll('button, a, input, select, [role="button"]');
        const foundSelectors = new Set<string>();
        
        elements.forEach(el => {
          if (el.id) foundSelectors.add(`#${el.id}`);
          else if (el.className && typeof el.className === 'string') {
            const firstClass = el.className.trim().split(/\s+/)[0];
            if (firstClass) foundSelectors.add(`.${firstClass}`);
          }
          foundSelectors.add(el.tagName.toLowerCase());
        });
        
        setSelectors(Array.from(foundSelectors).slice(0, 24));
      } catch (e) {
        // Fallback or cross-origin error
        setSelectors(['.btn-primary', '#submit', 'header nav a', '.form-input', 'footer button']);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "selectors") {
      handleFetchSelectors();
    }
  }, [activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSelector(text);
    toast({
      title: "Copied!",
      description: `Selector "${text}" copied to clipboard`,
    });
    setTimeout(() => setCopiedSelector(null), 2000);
  };

  if (isEditing && isLoadingAutomation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Live preview of URL for iframe
  const targetUrl = form.watch("url");

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left Panel: Form & Steps */}
      <div className="w-full md:w-1/2 lg:w-[500px] flex flex-col border-r border-border h-full bg-card/50">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-card">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">
            {isEditing ? "Edit Automation" : "Create Automation"}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form 
              id="automation-form" 
              onSubmit={form.handleSubmit(onSubmit)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Automation Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Daily Price Check" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9 font-mono" placeholder="https://..." {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule (Cron or Interval)</FormLabel>
                    <FormControl>
                      <Input placeholder="*/30 * * * * (Every 30m)" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-border">
                <FormField
                  control={form.control}
                  name="steps"
                  render={({ field }) => (
                    <StepBuilder 
                      steps={field.value} 
                      onChange={field.onChange} 
                    />
                  )}
                />
                <FormMessage>{form.formState.errors.steps?.message}</FormMessage>
              </div>
            </form>
          </Form>
        </div>

        <div className="p-4 border-t border-border bg-card">
          <Button 
            type="submit" 
            form="automation-form"
            className="w-full shadow-lg shadow-primary/20" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Save Changes" : "Create Automation"}
          </Button>
        </div>
      </div>

      {/* Right Panel: Preview & Selectors */}
      <div className="hidden md:flex flex-1 flex-col bg-muted/30 relative">
        <div className="absolute inset-0 p-8 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full h-full flex flex-col">
            <div className="bg-card rounded-t-xl border border-border border-b-0 p-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <TabsList className="h-8 bg-muted/50 p-1">
                  <TabsTrigger value="preview" className="text-xs gap-2 px-3 h-6 data-[state=active]:bg-card">
                    <Eye className="w-3 h-3" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="selectors" className="text-xs gap-2 px-3 h-6 data-[state=active]:bg-card">
                    <Code className="w-3 h-3" /> Selectors
                  </TabsTrigger>
                </TabsList>
              </div>

              {activeTab === "selectors" && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-7 w-7", layoutMode === "grid" && "bg-muted")} 
                    onClick={() => setLayoutMode("grid")}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-7 w-7", layoutMode === "list" && "bg-muted")} 
                    onClick={() => setLayoutMode("list")}
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex-1 max-w-md ml-4 bg-muted/50 rounded-md px-3 py-1.5 text-xs font-mono text-muted-foreground truncate">
                {targetUrl || "No URL entered..."}
              </div>
            </div>
            
            <div className="flex-1 bg-white border border-border rounded-b-xl shadow-2xl overflow-hidden relative">
              <TabsContent value="preview" className="m-0 w-full h-full border-0">
                {targetUrl ? (
                  <iframe 
                    ref={iframeRef}
                    src={`/api/proxy?url=${encodeURIComponent(targetUrl)}`}
                    className="w-full h-full border-0"
                    title="Preview"
                    onLoad={handleFetchSelectors}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-display text-2xl font-bold">
                    Enter a URL to preview
                  </div>
                )}
              </TabsContent>

              <TabsContent value="selectors" className="m-0 w-full h-full border-0 bg-background overflow-y-auto p-6">
                {!targetUrl ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Code className="w-12 h-12 text-muted-foreground/20 mb-4" />
                    <h3 className="font-semibold text-muted-foreground">No URL entered</h3>
                    <p className="text-sm text-muted-foreground/60">Enter a target URL to fetch its CSS selectors</p>
                  </div>
                ) : selectors.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Scanning page for interactive elements...</p>
                  </div>
                ) : (
                  <div className={cn(
                    "gap-4",
                    layoutMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                  )}>
                    {selectors.map((sel) => (
                      <Card 
                        key={sel} 
                        className="group relative p-3 hover:border-primary/50 transition-colors cursor-pointer border-border/50 shadow-none bg-card/30"
                        onClick={() => copyToClipboard(sel)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-[10px] md:text-xs font-mono text-primary truncate flex-1">
                            {sel}
                          </code>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {copiedSelector === sel ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {activeTab === "preview" && (
                <div className="absolute bottom-4 right-4 max-w-xs bg-black/80 text-white text-xs p-3 rounded-lg backdrop-blur-md shadow-xl border border-white/10">
                  <p className="font-semibold mb-1">Preview Mode</p>
                  <p className="opacity-80">
                    This is a proxied view of the target site. Interactive element selection is coming soon.
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

