import React, { useMemo, useState } from "react";
import {
  Clock,
  ShieldCheck,
  Users,
  TrendingUp,
  Bot,
  BarChart3,
  Zap,
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

/* -------------------------------------------------------------------------- */
/*                                RAW MOCK DATA                               */
/* -------------------------------------------------------------------------- */

const REPOSITORY_ANALYTICS = {
  totalPullRequests: 154,

  flaggedAiPullRequests: 98,

  autoClosedPullRequests: 79,

  manuallyClosedPullRequests: 11,

  challengesSent: 98,

  challengesPassed: 62,

  totalContributors: 112,

  trustedContributors: 89,

  estimatedMinutesPerReview: 15,

  workingHoursPerDay: 8,

  analyticsPeriodDays: 30,
};

const AI_VS_HUMAN_TRENDS = {
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

const MONTHLY_WORKLOAD_DATA = [
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

const calculateHoursSaved = (
  autoClosed: number,
  manuallyClosed: number,
  minutesPerReview: number
) => {
  return Number(
    (
      ((autoClosed + manuallyClosed) * minutesPerReview) /
      60
    ).toFixed(1)
  );
};

const calculateWorkingDaysSaved = (
  hoursSaved: number,
  workingHoursPerDay: number
) => {
  return Number(
    (hoursSaved / workingHoursPerDay).toFixed(1)
  );
};

const calculateChallengeSuccessRate = (
  passed: number,
  total: number
) => {
  if (total === 0) return 0;

  return Math.round((passed / total) * 100);
};

const calculateAiSlopRate = (
  flagged: number,
  total: number
) => {
  if (total === 0) return 0;

  return Number(((flagged / total) * 100).toFixed(1));
};

const calculateEfficiencyGain = (
  autoClosed: number,
  flagged: number
) => {
  if (flagged === 0) return 0;

  return Math.round((autoClosed / flagged) * 100);
};

const calculateTrustRate = (
  trusted: number,
  total: number
) => {
  if (total === 0) return 0;

  return Math.round((trusted / total) * 100);
};

const calculateAnnualProjection = (
  monthlyHoursSaved: number
) => {
  return Math.round(monthlyHoursSaved * 12);
};

const buildMonthlyHoursData = (
  workloadData: typeof MONTHLY_WORKLOAD_DATA,
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

  const hoursSaved = calculateHoursSaved(
    REPOSITORY_ANALYTICS.autoClosedPullRequests,
    REPOSITORY_ANALYTICS.manuallyClosedPullRequests,
    REPOSITORY_ANALYTICS.estimatedMinutesPerReview
  );

  const workingDaysSaved =
    calculateWorkingDaysSaved(
      hoursSaved,
      REPOSITORY_ANALYTICS.workingHoursPerDay
    );

  const challengeSuccessRate =
    calculateChallengeSuccessRate(
      REPOSITORY_ANALYTICS.challengesPassed,
      REPOSITORY_ANALYTICS.challengesSent
    );

  const aiSlopRate = calculateAiSlopRate(
    REPOSITORY_ANALYTICS.flaggedAiPullRequests,
    REPOSITORY_ANALYTICS.totalPullRequests
  );

  const efficiencyGain =
    calculateEfficiencyGain(
      REPOSITORY_ANALYTICS.autoClosedPullRequests,
      REPOSITORY_ANALYTICS.flaggedAiPullRequests
    );

  const trustRate = calculateTrustRate(
    REPOSITORY_ANALYTICS.trustedContributors,
    REPOSITORY_ANALYTICS.totalContributors
  );

  const annualProjection =
    calculateAnnualProjection(hoursSaved);

  const workloadHoursData = useMemo(
    () =>
      buildMonthlyHoursData(
        MONTHLY_WORKLOAD_DATA,
        REPOSITORY_ANALYTICS.estimatedMinutesPerReview
      ),
    []
  );

  const protectionStatus =
    challengeSuccessRate >= 60 &&
    efficiencyGain >= 75
      ? "ACTIVE"
      : "AT RISK";

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

      value:
        REPOSITORY_ANALYTICS.flaggedAiPullRequests,

      description: `${aiSlopRate}% of all submissions`,

      icon: <Bot size={18} aria-hidden />,

      color: "text-red-400",
    },

    {
      label: "Challenge Success",

      value: `${challengeSuccessRate}%`,

      description: `${REPOSITORY_ANALYTICS.challengesPassed}/${REPOSITORY_ANALYTICS.challengesSent} users passed verification`,

      icon: (
        <ShieldCheck size={18} aria-hidden />
      ),

      color: "text-green-400",
    },

    {
      label: "Trusted Contributors",

      value:
        REPOSITORY_ANALYTICS.trustedContributors,

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
        "Repository protection status derived from moderation efficiency and contributor verification rates.",
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
                AI_VS_HUMAN_TRENDS[
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