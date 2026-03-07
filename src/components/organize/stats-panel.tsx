import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Collection Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <StatBox label="Total" value={stats.total} />
          <StatBox label="Live" value={stats.live} color="green" />
          <StatBox label="Redirected" value={stats.redirected} color="yellow" />
          <StatBox label="Dead" value={stats.dead} color="red" />
          <StatBox label="Triaged" value={stats.triaged} color="blue" />
          <StatBox label="Reviewed" value={`${stats.percentReviewed}%`} />
          <StatBox label="Kept" value={stats.byAction.keep} color="green" />
          <StatBox label="Archived" value={stats.byAction.archive} color="yellow" />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatBoxProps {
  label: string;
  value: number | string;
  color?: "green" | "yellow" | "red" | "blue";
}

function StatBox({ label, value, color }: StatBoxProps) {
  const bgMap: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-950",
    yellow: "bg-yellow-50 dark:bg-yellow-950",
    red: "bg-red-50 dark:bg-red-950",
    blue: "bg-blue-50 dark:bg-blue-950",
  };
  const textMap: Record<string, string> = {
    green: "text-green-700 dark:text-green-300",
    yellow: "text-yellow-700 dark:text-yellow-300",
    red: "text-red-700 dark:text-red-300",
    blue: "text-blue-700 dark:text-blue-300",
  };
  const bg = color ? (bgMap[color] ?? "bg-gray-50 dark:bg-gray-900") : "bg-gray-50 dark:bg-gray-900";
  const text = color ? (textMap[color] ?? "") : "";

  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <p className={`text-xl font-bold ${text}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
