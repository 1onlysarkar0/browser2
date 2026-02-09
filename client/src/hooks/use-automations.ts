import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertAutomationInput, type AutomationResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAutomations() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [api.automations.list.path],
    queryFn: async () => {
      const res = await fetch(api.automations.list.path);
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to fetch automations", variant: "destructive" });
        throw new Error("Failed to fetch automations");
      }
      return api.automations.list.responses[200].parse(await res.json());
    },
  });
}

export function useAutomation(id: number | null) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [api.automations.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.automations.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) return null;
        toast({ title: "Error", description: "Failed to fetch automation details", variant: "destructive" });
        throw new Error("Failed to fetch automation");
      }
      return api.automations.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAutomationInput) => {
      // Validate with client-side schema if needed, but we rely on runtime API response validation mostly
      const validated = api.automations.create.input.parse(data);
      
      const res = await fetch(api.automations.create.path, {
        method: api.automations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.automations.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create automation");
      }
      return api.automations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automations.list.path] });
      toast({ title: "Success", description: "Automation created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertAutomationInput>) => {
      const url = buildUrl(api.automations.update.path, { id });
      const validated = api.automations.update.input.parse(updates);
      
      const res = await fetch(url, {
        method: api.automations.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update automation");
      }
      return api.automations.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automations.list.path] });
      toast({ title: "Success", description: "Automation updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.automations.delete.path, { id });
      const res = await fetch(url, { method: api.automations.delete.method });
      
      if (!res.ok) {
        throw new Error("Failed to delete automation");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automations.list.path] });
      toast({ title: "Success", description: "Automation deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useStartAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.automations.start.path, { id });
      const res = await fetch(url, { method: api.automations.start.method });
      if (!res.ok) throw new Error("Failed to start automation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automations.list.path] });
      toast({ title: "Started", description: "Automation execution started" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not start automation", variant: "destructive" });
    },
  });
}

export function useStopAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.automations.stop.path, { id });
      const res = await fetch(url, { method: api.automations.stop.method });
      if (!res.ok) throw new Error("Failed to stop automation");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automations.list.path] });
      toast({ title: "Stopped", description: "Automation stopped" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not stop automation", variant: "destructive" });
    },
  });
}

export function useBrowserHealth() {
  return useQuery({
    queryKey: [api.health.check.path],
    queryFn: async () => {
      const res = await fetch(api.health.check.path);
      if (!res.ok) throw new Error("Failed to fetch health");
      return api.health.check.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s for browser status
  });
}
