import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, type TrustScorePoint } from "../api/client";
import { ChartLine, Shield, AlertCircle } from "lucide-react";

interface TrustScoreGraphProps {
  username: string;
}

type ChartPoint = TrustScorePoint & {
  label: string;
};

const formatDateLabel = (value: string) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};

export const TrustScoreGraph: React.FC<TrustScoreGraphProps> = ({ username }) => {
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTrustHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getContributorTrustHistory(username);
        if (!isMounted) {
          return;
        }

        const formattedPoints = response.history.map((point) => ({
          ...point,
          label: formatDateLabel(point.date),
        }));

        setPoints(formattedPoints);
      } catch {
        if (isMounted) {
          setError("Unable to load trust history right now.");
          setPoints([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTrustHistory();

    return () => {
      isMounted = false;
    };
  }, [username]);

  const latestScore = points.length > 0 ? points[points.length - 1].trust_score : null;
  const firstScore = points.length > 0 ? points[0].trust_score : null;
  const delta = latestScore !== null && firstScore !== null ? latestScore - firstScore : null;

  return (
    <section className="glass rounded-3xl p-8 border border-white/10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-[0.24em] mb-4">
            <ChartLine size={14} /> Trust timeline
          </div>
          <h2 className="text-2xl font-black">{username}&apos;s trust journey</h2>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Historical contributor trust scores captured after each analysis run. The chart shows how reputation changes as PRs land.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 min-w-[140px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Latest score</div>
            <div className="text-2xl font-black mt-1 tabular-nums">
              {latestScore === null ? "--" : `${latestScore}/100`}
            </div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 min-w-[140px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">PR scans</div>
            <div className="text-2xl font-black mt-1 tabular-nums">{points.length}</div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 min-w-[140px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Delta</div>
            <div className={`text-2xl font-black mt-1 tabular-nums ${delta === null ? "text-slate-200" : delta >= 0 ? "text-slop-low" : "text-slop-high"}`}>
              {delta === null ? "--" : `${delta > 0 ? "+" : ""}${delta}`}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-primary" />
        </div>
      ) : error ? (
        <div className="h-80 flex flex-col items-center justify-center text-center gap-3 text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-black/10">
          <AlertCircle size={28} className="text-slop-medium" />
          <p className="font-medium text-slate-200">{error}</p>
          <p className="text-sm max-w-md">The chart will populate once the backend has trust snapshots for this contributor.</p>
        </div>
      ) : points.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-center gap-3 text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-black/10">
          <Shield size={28} className="text-brand-primary" />
          <p className="font-medium text-slate-200">No trust history found yet.</p>
          <p className="text-sm max-w-md">Once this contributor gets analyzed, their trust score over time will appear here.</p>
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trustStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#243244" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "12px" }}
                labelStyle={{ color: "#e2e8f0", fontWeight: 700 }}
                formatter={(value) => [`${value}/100`, "Trust score"]}
              />
              <Line
                type="monotone"
                dataKey="trust_score"
                stroke="url(#trustStroke)"
                strokeWidth={3}
                dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "#020617" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};