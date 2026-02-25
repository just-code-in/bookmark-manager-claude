"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Home
            </Link>
            <h1 className="mt-1 text-2xl font-bold">Import Bookmarks</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a bookmark export from Safari or Chrome
            </p>
          </div>
          {phase !== "upload" && (
            <Button variant="outline" onClick={handleStartOver}>
              Import Another File
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Phase 1: Upload */}
          {phase === "upload" && (
            <>
              <FileUpload onUpload={handleUpload} isUploading={isUploading} />
              {uploadError && (
                <p className="text-sm text-red-600 dark:text-red-400">
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <p className="text-2xl font-bold">
                        {parseSummary.totalParsed}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Found in file
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {parseSummary.totalNew}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        New bookmarks
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <p className="text-2xl font-bold text-gray-500">
                        {parseSummary.totalDuplicates}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Duplicates skipped
                      </p>
                    </div>
                  </div>
                  {parseSummary.errors.length > 0 && (
                    <div className="mt-4">
                      {parseSummary.errors.map((err, i) => (
                        <p
                          key={i}
                          className="text-sm text-yellow-600 dark:text-yellow-400"
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
                      <p className="mt-2 text-sm text-gray-500">
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
