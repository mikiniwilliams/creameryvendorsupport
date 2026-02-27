import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface Ticket {
  id: string;
  status: string;
  priority: string;
  created_at: string;
}

const COLORS = {
  primary: "hsl(220, 70%, 45%)",
  accent: "hsl(38, 92%, 50%)",
  success: "hsl(152, 60%, 40%)",
  muted: "hsl(220, 10%, 70%)",
  destructive: "hsl(0, 72%, 51%)",
};

const PIE_COLORS = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.muted];
const PRIORITY_COLORS: Record<string, string> = {
  low: COLORS.muted,
  medium: COLORS.primary,
  high: COLORS.accent,
  urgent: COLORS.destructive,
};

const DashboardAnalytics = ({ tickets }: { tickets: Ticket[] }) => {
  const trendData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 13);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = tickets.filter(
        (t) => format(new Date(t.created_at), "yyyy-MM-dd") === dayStr
      ).length;
      return { date: format(day, "MMM d"), tickets: count };
    });
  }, [tickets]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const label = t.status.replace("_", " ");
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    tickets.forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const resolutionRate = useMemo(() => {
    if (tickets.length === 0) return 0;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
    return Math.round((resolved / tickets.length) * 100);
  }, [tickets]);

  if (tickets.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Ticket Trend */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-lg">Tickets Over Time (14 days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 90%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="tickets"
                stroke={COLORS.primary}
                strokeWidth={2}
                fill="url(#ticketGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <span className="text-xs text-muted-foreground">Resolution</span>
              <span className="text-sm font-bold">{resolutionRate}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 90%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground capitalize">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Tickets by Priority</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" className="capitalize" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 90%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || COLORS.muted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;
