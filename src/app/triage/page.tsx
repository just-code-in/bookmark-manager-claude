"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &larr; Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold">AI Triage</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <p className="text-sm text-gray-500">Checking configuration...</p>
                  )}

                  {apiKeyConfigured === true && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      API key is configured.
                    </p>
                  )}

                  {apiKeyConfigured === false && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter your OpenAI API key to enable AI triage. You can also
                        set <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">OPENAI_API_KEY</code> in{" "}
                        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">.env.local</code>.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="sk-..."
                          className="flex-1 rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                        />
                        <Button
                          onClick={handleSaveApiKey}
                          disabled={!apiKeyInput.trim() || apiKeySaving}
                        >
                          {apiKeySaving ? "Validating..." : "Save Key"}
                        </Button>
                      </div>
                      {apiKeyError && (
                        <p className="text-sm text-red-600 dark:text-red-400">
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                        <p className="text-2xl font-bold">{triageStats.total}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total bookmarks
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {pendingCount}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pending triage
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {triageStats.completed}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Already triaged
                        </p>
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
                        <p className="mt-2 text-sm text-gray-500">
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
