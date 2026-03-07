"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriageProgress } from "@/components/triage/triage-progress";
import { TriageSummary } from "@/components/triage/triage-summary";

type Phase = "preflight" | "running" | "complete";

interface TriageStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

interface CompleteStats {
  categorized: number;
  failed: number;
  categories: number;
  totalCost: number;
}

export default function TriagePage() {
  const [phase, setPhase] = useState<Phase>("preflight");
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [triageStats, setTriageStats] = useState<TriageStats | null>(null);
  const [completeStats, setCompleteStats] = useState<CompleteStats | null>(null);

  // Check API key and load triage stats on mount
  useEffect(() => {
    fetch("/api/triage/config")
      .then((res) => res.json())
      .then((data) => setApiKeyConfigured(data.configured))
      .catch(() => setApiKeyConfigured(false));

    fetch("/api/triage")
      .then((res) => res.json())
      .then((data) => {
        setTriageStats({
          total: data.triageStats.total,
          pending: data.triageStats.pending + data.triageStats.failed,
          completed: data.triageStats.completed,
          failed: data.triageStats.failed,
        });
        // If everything is already completed, show the summary
        if (data.triageStats.pending === 0 && data.triageStats.failed === 0 && data.triageStats.completed > 0) {
          setPhase("complete");
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveApiKey = useCallback(async () => {
    setApiKeySaving(true);
    setApiKeyError(null);

    try {
      const res = await fetch("/api/triage/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setApiKeyError(data.error || "Failed to validate API key");
      } else {
        setApiKeyConfigured(true);
        setApiKeyInput("");
      }
    } catch {
      setApiKeyError("Failed to save API key");
    } finally {
      setApiKeySaving(false);
    }
  }, [apiKeyInput]);

  const handleComplete = useCallback((stats: CompleteStats) => {
    setCompleteStats(stats);
    setPhase("complete");
  }, []);

  const handleRetryFailed = useCallback(() => {
    setPhase("running");
    setCompleteStats(null);
  }, []);

  const pendingCount = triageStats?.pending ?? 0;
  const canStart = apiKeyConfigured === true && pendingCount > 0;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">AI Triage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Categorise, tag, and summarise your bookmarks using AI
          </p>
        </div>

        <div className="space-y-6">
          {/* Phase 1: Preflight */}
          {phase === "preflight" && (
            <>
              {/* API Key section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">OpenAI API Key</CardTitle>
                </CardHeader>
                <CardContent>
                  {apiKeyConfigured === null && (
                    <p className="text-sm text-muted-foreground">Checking configuration...</p>
                  )}

                  {apiKeyConfigured === true && (
                    <p className="text-sm text-emerald-600">
                      API key is configured.
                    </p>
                  )}

                  {apiKeyConfigured === false && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Enter your OpenAI API key to enable AI triage. You can also
                        set <code className="rounded bg-muted px-1 text-xs font-mono">OPENAI_API_KEY</code> in{" "}
                        <code className="rounded bg-muted px-1 text-xs font-mono">.env.local</code>.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="sk-..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSaveApiKey}
                          disabled={!apiKeyInput.trim() || apiKeySaving}
                        >
                          {apiKeySaving ? "Validating..." : "Save Key"}
                        </Button>
                      </div>
                      {apiKeyError && (
                        <p className="text-sm text-destructive">
                          {apiKeyError}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookmark stats */}
              {triageStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bookmark Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Total bookmarks</p>
                        <p className="text-lg font-semibold tabular-nums text-foreground">{triageStats.total}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pending triage</p>
                        </div>
                        <p className="text-lg font-semibold tabular-nums text-sky-600">{pendingCount}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Already triaged</p>
                        </div>
                        <p className="text-lg font-semibold tabular-nums text-emerald-600">{triageStats.completed}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        onClick={() => setPhase("running")}
                        disabled={!canStart}
                      >
                        Start AI Triage ({pendingCount} bookmarks)
                      </Button>
                      {!canStart && apiKeyConfigured === true && pendingCount === 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          All bookmarks have already been triaged.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Phase 2: Running */}
          {phase === "running" && (
            <TriageProgress onComplete={handleComplete} />
          )}

          {/* Phase 3: Complete */}
          {phase === "complete" && (
            <TriageSummary
              initialStats={completeStats ?? undefined}
              onRetryFailed={handleRetryFailed}
            />
          )}
        </div>
      </div>
    </main>
  );
}
