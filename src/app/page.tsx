import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
          Bookmark Manager
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Import your browser bookmarks, let AI categorize and summarize them,
          then search in plain English.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Link
            href="/import"
            className="group rounded-xl border border-gray-200 p-6 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-950"
          >
            <h2 className="text-xl font-semibold group-hover:text-blue-600">
              Import Bookmarks
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Upload a bookmark export from Safari or Chrome. We&apos;ll parse
              your bookmarks and check which links are still alive.
            </p>
          </Link>

          <div className="cursor-not-allowed rounded-xl border border-gray-200 p-6 opacity-50 dark:border-gray-800">
            <h2 className="text-xl font-semibold">AI Triage</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Categorize, tag, and summarize your bookmarks with AI. Coming
              soon.
            </p>
          </div>

          <Link
            href="/bookmarks"
            className="group rounded-xl border border-gray-200 p-6 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-950"
          >
            <h2 className="text-xl font-semibold group-hover:text-blue-600">
              Browse & Organize
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              View all imported bookmarks. Filter by status — live, redirected,
              dead, or untested.
            </p>
          </Link>

          <div className="cursor-not-allowed rounded-xl border border-gray-200 p-6 opacity-50 dark:border-gray-800">
            <h2 className="text-xl font-semibold">Search</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Find bookmarks using natural language. Coming soon.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
