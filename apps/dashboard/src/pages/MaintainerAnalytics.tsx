import React, { useMemo, useState, useEffect } from "react";
import {
  Clock,
  ShieldCheck,
  Users,
  TrendingUp,
  Bot,
  BarChart3,
  Zap,
  AlertTriangle,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import { fetchMaintainerAnalytics } from "../services/analyticsService";
import type { SlopRateResponse, BurnoutResponse } from "../services/analyticsService";

/* -------------------------------------------------------------------------- */
/*                                RAW MOCK DATA                               */
/* -------------------------------------------------------------------------- */

// Mock trends left as fallback for UI consistency if API doesn't provide historical timeseries yet
const FALLBACK_AI_VS_HUMAN_TRENDS = {
  "30 Days": [
    { label: "Day 1", ai: 12, human: 34 },
    { label: "Day 5", ai: 20, human: 28 },
    { label: "Day 10", ai: 18, human: 41 },
    { label: "Day 15", ai: 26, human: 33 },
    { label: "Day 20", ai: 19, human: 38 },
    { label: "Day 25", ai: 31, human: 30 },
    { label: "Day 30", ai: 28, human: 45 },
  ],

  "90 Days": [
    { label: "Week 1", ai: 42, human: 78 },
    { label: "Week 3", ai: 50, human: 71 },
    { label: "Week 5", ai: 61, human: 80 },
    { label: "Week 7", ai: 75, human: 73 },
    { label: "Week 9", ai: 70, human: 88 },
    { label: "Week 11", ai: 82, human: 91 },
    { label: "Week 13", ai: 90, human: 110 },
  ],
};

const FALLBACK_MONTHLY_WORKLOAD_DATA = [
  { month: "Jan", flaggedCount: 48 },
  { month: "Feb", flaggedCount: 64 },
  { month: "Mar", flaggedCount: 72 },
  { month: "Apr", flaggedCount: 96 },
  { month: "May", flaggedCount: 112 },
  { month: "Jun", flaggedCount: 124 },
];

/* -------------------------------------------------------------------------- */
/*                              METRIC FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const calculateWorkingDaysSaved = (
  hoursSaved: number,
  workingHoursPerDay: number
) => {
  return Number(
    (hoursSaved / workingHoursPerDay).toFixed(1)
  );
};

const buildMonthlyHoursData = (
  workloadData: typeof FALLBACK_MONTHLY_WORKLOAD_DATA,
  minutesPerReview: number
) => {
  return workloadData.map((entry) => ({
    month: entry.month,

    hours: Number(
      (
        (entry.flaggedCount * minutesPerReview) /
        60
      ).toFixed(1)
    ),
  }));
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTS                                */
/* -------------------------------------------------------------------------- */

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "12px",
  fontSize: "13px",
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = ({
  label,
  value,
  description,
  icon,
  color,
}) => {
  return (
    <div className="glass rounded-2xl p-5 border border-slate-800 hover:translate-y-[-2px] transition-all duration-200">
      <div
        className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${color}`}
      >
        {icon}
      </div>

      <div className="mt-3">
        <p className="text-slate-400 text-xs uppercase tracking-wider">
          {label}
        </p>

        <h3 className="text-3xl font-black mt-1">
          {value}
        </h3>

        <p className="text-slate-500 text-xs mt-1">
          {description}
        </p>
      </div>
    </div>
  );
};

const InsightCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}> = ({
  title,
  value,
  icon,
  description,
}) => {
  return (
    <div className="glass rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center gap-2 text-brand-primary">
        {icon}

        <span className="text-xs uppercase tracking-wider font-bold">
          {title}
        </span>
      </div>

      <div className="text-3xl font-black mt-3">
        {value}
      </div>

      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              MAIN PAGE COMPONENT                           */
/* -------------------------------------------------------------------------- */

type TimeFilter = "30 Days" | "90 Days";

export const MaintainerAnalytics: React.FC = () => {
  const [timeFilter, setTimeFilter] =
    useState<TimeFilter>("30 Days");
  
  const [data, setData] = useState<{
    slopRate: SlopRateResponse;
    burnout: BurnoutResponse;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Using owner/repo as placeholder as per requirement/backend example
        const result = await fetchMaintainerAnalytics("owner/repo");
        setData(result);
        setError(null);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Unable to connect to the analytics engine. Please ensure the backend is running at http://localhost:8000.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hoursSaved = data?.burnout.hours_wasted_month ?? 0;
  const workingDaysSaved = calculateWorkingDaysSaved(hoursSaved, 8);
  const flaggedAiPullRequests = data?.slopRate.slop_count ?? 0;
  const aiSlopRate = data?.slopRate.score ?? 0;
  const annualProjection = data?.burnout.projected_hours_annual ?? 0;
  
  // These metrics are not yet available in the backend analytics endpoints
  // but kept for UI consistency with fallback values
  const challengeSuccessRate = 0;
  const challengesPassed = 0;
  const challengesSent = 0;
  const trustedContributors = 0;
  const trustRate = 0;
  const efficiencyGain = 0;

  const workloadHoursData = useMemo(
    () =>
      buildMonthlyHoursData(
        FALLBACK_MONTHLY_WORKLOAD_DATA,
        15 // estimated minutes per review
      ),
    []
  );

  const protectionStatus =
    data?.burnout.burnout_risk.toUpperCase() === "CRITICAL" || 
    data?.burnout.burnout_risk.toUpperCase() === "HIGH"
      ? "AT RISK"
      : "ACTIVE";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-brand-primary rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse">
          Synchronizing Repository Intelligence...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500">
          <AlertTriangle size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">Analytics Offline</h2>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="glass px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all text-brand-primary border border-brand-primary/20"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Time Saved",

      value: `${hoursSaved} hrs`,

      description: `${workingDaysSaved} working days recovered`,

      icon: <Clock size={18} aria-hidden />,

      color: "text-cyan-400",
    },

    {
      label: "AI PRs Flagged",

      value: flaggedAiPullRequests,

      description: `${aiSlopRate.toFixed(1)}% slop rate detected`,

      icon: <Bot size={18} aria-hidden />,

      color: "text-red-400",
    },

    {
      label: "Challenge Success",

      value: `${challengeSuccessRate}%`,

      description: `${challengesPassed}/${challengesSent} users passed verification`,

      icon: (
        <ShieldCheck size={18} aria-hidden />
      ),

      color: "text-green-400",
    },

    {
      label: "Trusted Contributors",

      value: trustedContributors,

      description: `${trustRate}% contributor trust rate`,

      icon: <Users size={18} aria-hidden />,

      color: "text-purple-400",
    },
  ];

  const insightCards = [
    {
      title: "Efficiency Gain",

      value: `${efficiencyGain}%`,

      icon: <Zap size={18} aria-hidden />,

      description:
        "Percentage of suspicious pull requests automatically handled by the moderation system.",
    },

    {
      title: "Annual Projection",

      value: `${annualProjection} hrs`,

      icon: <Clock size={18} aria-hidden />,

      description:
        "Estimated yearly moderation time saved using current repository trends.",
    },

    {
      title: "Repository Health",

      value: protectionStatus,

      icon: (
        <ShieldCheck size={18} aria-hidden />
      ),

      description:
        `Repository protection status is currently ${protectionStatus.toLowerCase()} based on burnout risk analysis.`,
    },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black gradient-text">
            Maintainer Analytics
          </h1>

          <p className="text-slate-400 mt-1 text-sm">
            Track repository moderation health and
            AI-generated submission impact.
          </p>
        </div>

        <div className="glass px-5 py-3 rounded-2xl border border-slate-800">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Protection Status
          </p>

          <div className="flex items-center gap-2 mt-2 text-green-400 font-black text-lg">
            <ShieldCheck
              size={18}
              aria-hidden
            />

            <span>{protectionStatus}</span>
          </div>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            label={card.label}
            value={card.value}
            description={card.description}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* MAIN TREND CHART */}
      <div className="glass rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <BarChart3
                size={22}
                className="text-brand-primary"
                aria-hidden
              />

              AI vs Human Submission Trends
            </h2>

            <p className="text-slate-400 mt-1 text-sm">
              Compare suspicious AI-generated
              pull requests against legitimate
              contributor activity.
            </p>
          </div>

          <div>
            <label
              htmlFor="analytics-filter"
              className="sr-only"
            >
              Select analytics time range
            </label>

            <select
              id="analytics-filter"
              value={timeFilter}
              onChange={(event) =>
                setTimeFilter(
                  event.target
                    .value as TimeFilter
                )
              }
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none"
            >
              <option value="30 Days">
                30 Days
              </option>

              <option value="90 Days">
                90 Days
              </option>
            </select>
          </div>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={
                FALLBACK_AI_VS_HUMAN_TRENDS[
                  timeFilter
                ]
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
              />

              <XAxis
                dataKey="label"
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                contentStyle={tooltipStyle}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="ai"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 3 }}
                name="AI Generated PRs"
              />

              <Line
                type="monotone"
                dataKey="human"
                stroke="#00f2fe"
                strokeWidth={3}
                dot={{ r: 3 }}
                name="Human PRs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* WORKLOAD CHART */}
        <div className="xl:col-span-2 glass rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp
              size={20}
              className="text-brand-primary"
              aria-hidden
            />

            <h2 className="text-xl font-black">
              Moderator Workload Trend
            </h2>
          </div>

          <div className="h-[250px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={workloadHoursData}
              >
                <defs>
                  <linearGradient
                    id="workloadGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.4}
                    />

                    <stop
                      offset="95%"
                      stopColor="#8b5cf6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                />

                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#8b5cf6"
                  fill="url(#workloadGradient)"
                  strokeWidth={3}
                  name="Hours Saved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="space-y-4">
          {insightCards.map(
            (card, index) => (
              <InsightCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                description={
                  card.description
                }
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintainerAnalytics;