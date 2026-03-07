export interface OrganizeStats {
  total: number;
  live: number;
  redirected: number;
  dead: number;
  pending: number;
  triaged: number;
  percentReviewed: number;
  byAction: {
    unreviewed: number;
    keep: number;
    archive: number;
    delete: number;
  };
}

interface StatsPanelProps {
  stats: OrganizeStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      <StatBox label="Total" value={stats.total} />
      <StatBox label="Live" value={stats.live} color="green" />
      <StatBox label="Redirected" value={stats.redirected} color="yellow" />
      <StatBox label="Dead" value={stats.dead} color="red" />
      <StatBox label="Triaged" value={stats.triaged} color="blue" />
      <StatBox label="Reviewed" value={`${stats.percentReviewed}%`} />
      <StatBox label="Kept" value={stats.byAction.keep} color="green" />
      <StatBox label="Archived" value={stats.byAction.archive} color="yellow" />
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: number | string;
  color?: "green" | "yellow" | "red" | "blue";
}

function StatBox({ label, value, color }: StatBoxProps) {
  const dotColors: Record<string, string> = {
    green: "bg-emerald-500",
    yellow: "bg-amber-400",
    red: "bg-red-500",
    blue: "bg-sky-500",
  };
  const numColors: Record<string, string> = {
    green: "text-emerald-600",
    yellow: "text-amber-500",
    red: "text-destructive",
    blue: "text-sky-600",
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        {color && (
          <span className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`} />
        )}
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={`text-lg font-semibold tabular-nums ${
          color ? numColors[color] : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
