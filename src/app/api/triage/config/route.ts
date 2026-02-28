import { writeFileSync } from "fs";
import { join } from "path";
import { getApiKey, validateApiKey } from "@/lib/triage/openai-client";

export const dynamic = "force-dynamic";

/** GET /api/triage/config — Check if an API key is configured. */
export async function GET() {
  const key = getApiKey();
  return Response.json({ configured: !!key });
}

/** POST /api/triage/config — Validate and save an API key. */
export async function POST(request: Request) {
  const body = await request.json();
  const apiKey = body.apiKey as string | undefined;

  if (!apiKey?.trim()) {
    return Response.json(
      { valid: false, error: "API key is required" },
      { status: 400 },
    );
  }

  const valid = await validateApiKey(apiKey.trim());
  if (!valid) {
    return Response.json(
      { valid: false, error: "Invalid API key — could not authenticate with OpenAI" },
      { status: 400 },
    );
  }

  // Save to data/.env.triage
  const envPath = join(process.cwd(), "data", ".env.triage");
  writeFileSync(envPath, `OPENAI_API_KEY=${apiKey.trim()}\n`, "utf-8");

  return Response.json({ valid: true });
}
