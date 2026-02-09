import { useState } from "react";
import { type Step } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepBuilderProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export function StepBuilder({ steps, onChange }: StepBuilderProps) {
  const addStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStep: Step = {
      id: crypto.randomUUID(),
      type: "click",
      selector: "",
      value: "",
    };
    onChange([...steps, newStep]);
  };

  const updateStep = (index: number, field: keyof Step, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Automation Steps</h3>
        <Button onClick={addStep} size="sm" className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none">
          <Plus className="w-4 h-4" /> Add Step
        </Button>
      </div>

      <div className="space-y-3">
        {steps.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-muted-foreground text-sm">No steps added yet. Start by adding a step.</p>
          </div>
        )}

        {steps.map((step, index) => (
          <div key={step.id} className="group flex items-start gap-3 bg-card p-4 rounded-xl border border-border/60 hover:border-primary/30 shadow-sm transition-all duration-200">
            <div className="mt-3 cursor-move text-muted-foreground/50 group-hover:text-muted-foreground">
              <GripVertical className="w-5 h-5" />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Step Type */}
              <div className="md:col-span-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Action</label>
                <Select
                  value={step.type}
                  onValueChange={(val) => updateStep(index, "type", val as any)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goto">Go To URL</SelectItem>
                    <SelectItem value="click">Click Element</SelectItem>
                    <SelectItem value="type">Type Text</SelectItem>
                    <SelectItem value="wait">Wait (Seconds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selector (Hidden for wait/goto sometimes, but let's keep it simple) */}
              <div className={cn("md:col-span-4", step.type === "wait" ? "hidden" : "block")}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {step.type === "goto" ? "URL" : "CSS Selector"}
                </label>
                <Input
                  value={step.selector || ""}
                  onChange={(e) => updateStep(index, "selector", e.target.value)}
                  placeholder={step.type === "goto" ? "https://example.com" : ".submit-btn"}
                  className="font-mono text-sm bg-background"
                />
              </div>

              {/* Value (Hidden for click) */}
              <div className={cn("md:col-span-4", step.type === "click" ? "hidden" : "block")}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {step.type === "wait" ? "Duration (seconds)" : "Value to Type"}
                </label>
                <Input
                  value={step.value || ""}
                  onChange={(e) => updateStep(index, "value", e.target.value)}
                  placeholder={step.type === "wait" ? "5" : "Hello world"}
                  className="font-mono text-sm bg-background"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeStep(index)}
              className="mt-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
