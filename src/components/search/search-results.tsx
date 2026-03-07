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
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  redirected: "border-amber-200 bg-amber-50 text-amber-600",
  dead: "border-red-200 bg-red-50 text-destructive",
  pending: "border-border bg-muted text-muted-foreground",
};

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-sm font-medium text-foreground">No results</p>
        <p className="text-sm text-muted-foreground">
          No matches for <em>&ldquo;{query}&rdquo;</em>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
        <em>&ldquo;{query}&rdquo;</em>
      </p>

      {results.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:shadow-[0_1px_4px_0_oklch(0_0_0/0.05)] hover:border-border/60"
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
              <p className="mt-0.5 truncate text-xs text-muted-foreground/60">{r.url}</p>

              {r.summary && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {r.summary}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={statusColors[r.urlStatus] ?? statusColors.pending}
                >
                  {r.urlStatus === "pending" ? "untested" : r.urlStatus}
                </Badge>

                {r.category && (
                  <Badge
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-700"
                  >
                    {r.category}
                  </Badge>
                )}

                {r.tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] text-muted-foreground border-border/60"
                  >
                    {tag}
                  </Badge>
                ))}
                {r.tags.length > 4 && (
                  <span className="text-[10px] text-muted-foreground/60">
                    +{r.tags.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Relevance score */}
            <div className="shrink-0 text-right">
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {Math.round(r.score * 100)}%
              </span>
              <p className="text-[10px] text-muted-foreground/60">match</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
