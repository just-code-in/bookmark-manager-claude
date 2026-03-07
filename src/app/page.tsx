import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Bookmark Manager
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Import your browser bookmarks, let AI categorize and summarize them,
          then search in plain English.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/import"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_0_oklch(0_0_0/0.06),0_1px_2px_-1px_oklch(0_0_0/0.04)] transition-all duration-150 hover:shadow-[0_4px_12px_0_oklch(0_0_0/0.08)] hover:-translate-y-px hover:border-border/60"
          >
            <span className="text-xs font-medium text-muted-foreground/50 tracking-widest uppercase">
              01
            </span>
            <h2 className="text-base font-semibold text-foreground">
              Import Bookmarks
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload a bookmark export from Safari or Chrome. We&apos;ll parse
              your bookmarks and check which links are still alive.
            </p>
          </Link>

          <Link
            href="/triage"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_0_oklch(0_0_0/0.06),0_1px_2px_-1px_oklch(0_0_0/0.04)] transition-all duration-150 hover:shadow-[0_4px_12px_0_oklch(0_0_0/0.08)] hover:-translate-y-px hover:border-border/60"
          >
            <span className="text-xs font-medium text-muted-foreground/50 tracking-widest uppercase">
              02
            </span>
            <h2 className="text-base font-semibold text-foreground">
              AI Triage
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Categorize, tag, and summarize your bookmarks with AI. Uses
              GPT-4o-mini to analyse page content and generate categories.
            </p>
          </Link>

          <Link
            href="/organize"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_0_oklch(0_0_0/0.06),0_1px_2px_-1px_oklch(0_0_0/0.04)] transition-all duration-150 hover:shadow-[0_4px_12px_0_oklch(0_0_0/0.08)] hover:-translate-y-px hover:border-border/60"
          >
            <span className="text-xs font-medium text-muted-foreground/50 tracking-widest uppercase">
              03
            </span>
            <h2 className="text-base font-semibold text-foreground">
              Organise
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Browse by category, keep or archive bookmarks, edit AI-generated
              summaries and tags, and manage categories.
            </p>
          </Link>

          <Link
            href="/search"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_0_oklch(0_0_0/0.06),0_1px_2px_-1px_oklch(0_0_0/0.04)] transition-all duration-150 hover:shadow-[0_4px_12px_0_oklch(0_0_0/0.08)] hover:-translate-y-px hover:border-border/60"
          >
            <span className="text-xs font-medium text-muted-foreground/50 tracking-widest uppercase">
              04
            </span>
            <h2 className="text-base font-semibold text-foreground">
              Search
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find bookmarks in plain English using semantic search — no exact
              keywords needed.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
