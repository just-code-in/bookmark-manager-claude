"use client";

import { useState, useCallback } from "react";
import { FileUpload } from "@/components/import/file-upload";
import { ImportProgress } from "@/components/import/import-progress";
import { ImportSummary } from "@/components/import/import-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Phase = "upload" | "parsed" | "validating" | "complete";

interface ParseSummary {
  totalParsed: number;
  totalNew: number;
  totalDuplicates: number;
  errors: string[];
}

export default function ImportPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        setIsUploading(false);
        return;
      }

      setBatchId(data.batchId);
      setParseSummary(data.summary);
      setPhase("parsed");
    } catch {
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleValidationComplete = useCallback(() => {
    setPhase("complete");
  }, []);

  const handleStartOver = useCallback(() => {
    setPhase("upload");
    setBatchId(null);
    setParseSummary(null);
    setUploadError(null);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Import Bookmarks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a bookmark export from Safari or Chrome
            </p>
          </div>
          {phase !== "upload" && (
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              Import another file
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Phase 1: Upload */}
          {phase === "upload" && (
            <>
              <FileUpload onUpload={handleUpload} isUploading={isUploading} />
              {uploadError && (
                <p className="text-sm text-destructive">
                  {uploadError}
                </p>
              )}
            </>
          )}

          {/* Phase 2: Parse results — show summary and start validation */}
          {phase === "parsed" && parseSummary && batchId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Bookmarks Parsed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Found in file</p>
                      <p className="text-lg font-semibold tabular-nums text-foreground">{parseSummary.totalParsed}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">New bookmarks</p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums text-sky-600">{parseSummary.totalNew}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Duplicates skipped</p>
                      <p className="text-lg font-semibold tabular-nums text-muted-foreground">{parseSummary.totalDuplicates}</p>
                    </div>
                  </div>
                  {parseSummary.errors.length > 0 && (
                    <div className="mt-4">
                      {parseSummary.errors.map((err, i) => (
                        <p
                          key={i}
                          className="text-sm text-amber-600"
                        >
                          Warning: {err}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="mt-6">
                    <Button
                      onClick={() => setPhase("validating")}
                      disabled={parseSummary.totalNew === 0}
                    >
                      Validate URLs
                    </Button>
                    {parseSummary.totalNew === 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No new bookmarks to validate.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Phase 3: Validation in progress */}
          {phase === "validating" && batchId && parseSummary && (
            <ImportProgress
              batchId={batchId}
              totalNew={parseSummary.totalNew}
              onComplete={handleValidationComplete}
            />
          )}

          {/* Phase 4: Complete — show full summary */}
          {phase === "complete" && batchId && (
            <ImportSummary batchId={batchId} />
          )}
        </div>
      </div>
    </main>
  );
}
