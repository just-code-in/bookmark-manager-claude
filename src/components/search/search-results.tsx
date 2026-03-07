import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  urlStatus: string;
  userAction: string;
  score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

const statusColors: Record<string, string> = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  redirected: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  dead: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
};

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        No results for <em>&ldquo;{query}&rdquo;</em>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
        <em>&ldquo;{query}&rdquo;</em>
      </p>

      {results.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-gray-200 bg-[var(--background)] p-4 dark:border-gray-800"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 font-medium hover:underline"
              >
                <span className="line-clamp-1">{r.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60" />
              </a>
              <p className="mt-0.5 truncate text-xs text-gray-400">{r.url}</p>

              {r.summary && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {r.summary}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={statusColors[r.urlStatus] ?? statusColors.pending}
                >
                  {r.urlStatus === "pending" ? "untested" : r.urlStatus}
                </Badge>

                {r.category && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >
                    {r.category}
                  </Badge>
                )}

                {r.tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
                {r.tags.length > 4 && (
                  <span className="text-[10px] text-gray-400">
                    +{r.tags.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Relevance score */}
            <div className="shrink-0 text-right">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(r.score * 100)}%
              </span>
              <p className="text-[10px] text-gray-400">match</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
