"use client";

import { AI_MODELS } from "@/ai/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Bot, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setModelPreference } from "./actions";

export function SettingsClient({ currentModel }: { currentModel: string }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [isPending, startTransition] = useTransition();

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    startTransition(async () => {
      await setModelPreference(modelId);
      const model = AI_MODELS.find((m) => m.id === modelId);
      toast({
        title: "Model switched",
        description: `Now using ${model?.name ?? modelId}`,
      });
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const active = AI_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="px-4 pb-4 pt-6 space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* AI Model */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            AI Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {active && (
            <p className="text-xs text-muted-foreground">{active.description}</p>
          )}
          <p className="text-[11px] text-muted-foreground/60">
            All models run on NVIDIA NIM (free tier). Switch anytime — takes effect immediately.
          </p>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card>
        <CardContent className="pt-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
