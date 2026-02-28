/**
 * OpenAI API wrapper with automatic cost tracking.
 *
 * Reads the API key from process.env.OPENAI_API_KEY first,
 * then falls back to data/.env.triage.
 */

import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";
import { apiCostLog } from "@/lib/db/schema";

const MODEL = "gpt-4o-mini";
const INPUT_COST_PER_1M = 0.15; // USD
const OUTPUT_COST_PER_1M = 0.60; // USD

/** Resolve the API key from env or the local config file. */
export function getApiKey(): string | null {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  try {
    const envPath = join(process.cwd(), "data", ".env.triage");
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function getClient(): OpenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }
  return new OpenAI({ apiKey, maxRetries: 3 });
}

export interface CompletionUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface CompletionResult<T> {
  data: T;
  usage: CompletionUsage;
}

/**
 * Call GPT-4o-mini with JSON mode, log cost, and return parsed result.
 */
export async function complete<T>(
  systemPrompt: string,
  userPrompt: string,
  parseResponse: (content: string) => T,
  options?: { bookmarkId?: number; operation?: string },
): Promise<CompletionResult<T>> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? "";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const costUsd =
    (inputTokens / 1_000_000) * INPUT_COST_PER_1M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  // Log to apiCostLog
  db.insert(apiCostLog)
    .values({
      operation: options?.operation ?? "triage",
      model: MODEL,
      inputTokens,
      outputTokens,
      estimatedCostUsd: costUsd,
      bookmarkId: options?.bookmarkId ?? null,
      createdAt: new Date(),
    })
    .run();

  const data = parseResponse(content);

  return { data, usage: { inputTokens, outputTokens, costUsd } };
}

/** Validate an API key by making a lightweight call. */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new OpenAI({ apiKey, maxRetries: 0 });
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}
