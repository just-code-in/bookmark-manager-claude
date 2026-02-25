# Bookmark Manager — Claude Code Instructions

## Project Overview

Local bookmark manager app that imports browser bookmarks
(Safari/Chrome), uses AI to categorize/summarize, and provides
natural-language search.
Built incrementally: Import → Triage → Organisation → Search.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Parsing:** cheerio (Netscape Bookmark File Format)
- **URL Validation:** Native Node.js fetch

## Key Files

- `src/lib/db/schema.ts` — Drizzle schema (bookmarks, importBatches, apiCostLog)
- `src/lib/db/index.ts` — DB singleton (WAL mode, foreign keys on)
- `src/lib/parser/bookmark-parser.ts` — Netscape HTML parser
- `src/lib/validator/url-validator.ts` — Concurrent URL validator
- `src/app/api/import/` — Import API routes (upload, batch status, SSE validation)
- `drizzle.config.ts` — Points to `./data/bookmarks.db`

## Development Commands

- `npm run dev` — Start dev server with Turbopack
- `npm run build` — Production build
- `npm run db:generate` — Generate Drizzle migrations from schema
- `npm run db:migrate` — Apply migrations

## Conventions

- `better-sqlite3` must be listed in `serverExternalPackages` in next.config.ts
- cheerio v1.0+ types: use `import type { Element } from "domhandler"` (not `cheerio.Element`)
- SSE endpoints use POST + ReadableStream (not EventSource which is GET-only)
- URL deduplication is on the `url` column (UNIQUE constraint)
- Database file lives at `data/bookmarks.db` (gitignored)
- Run `markdownlint` on `.md` files before committing
