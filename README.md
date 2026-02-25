# Bookmark Manager — Claude Code Build

Part of the **Built Twice** series. See [PRD.md](./PRD.md) for the shared specification.

Built with Claude Code.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Parsing:** cheerio (Netscape Bookmark File Format)
- **URL Validation:** Native Node.js fetch with concurrency pool

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd bookmark-manager-claude

# 2. Install dependencies
npm install

# 3. Set up the database
npm run db:generate
npm run db:migrate

# 4. Start the app
npm run dev

# 5. Open in your browser
open http://localhost:3000
```

## Usage

1. **Export your bookmarks** from Safari or Chrome as an HTML file
   - **Safari:** File > Export > Bookmarks...
   - **Chrome:** Bookmarks Manager > three-dot menu > Export bookmarks
2. **Go to Import** at [localhost:3000/import](http://localhost:3000/import)
3. **Drop your file** or click to browse
4. **Review** the parse summary, then click "Validate URLs" to check link status

## Project Structure

```text
src/
├── app/                  # Next.js pages and API routes
│   ├── api/import/       # Upload, batch status, and validation endpoints
│   └── import/           # Import page
├── components/           # React components
│   ├── import/           # File upload, progress, summary
│   └── ui/               # shadcn/ui primitives
├── hooks/                # Custom React hooks (SSE)
└── lib/                  # Core logic
    ├── db/               # Schema, connection, migrations
    ├── parser/           # Bookmark HTML parser
    └── validator/        # URL validator with concurrency pool
```

## Scripts

| Command | Description |
| ---------------------- | ---------------------------------------- |
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
