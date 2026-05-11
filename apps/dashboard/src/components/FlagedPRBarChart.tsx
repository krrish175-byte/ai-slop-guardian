import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { day: "Oct 1", flagged: 2 },
  { day: "Oct 5", flagged: 5 },
  { day: "Oct 10", flagged: 3 },
  { day: "Oct 15", flagged: 8 },
  { day: "Oct 20", flagged: 4 },
  { day: "Oct 25", flagged: 6 },
  { day: "Oct 30", flagged: 2 },
];

export default function FlaggedPRBarChart() {
  return (
    <div className="w-full h-[460px] glass rounded-3xl border border-[#2a2d45] bg-[#1b1d2b] p-5">
      <h2 className="text-white text-xl font-semibold mb-4">Flagged PRs</h2>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d45" />

          <XAxis
            dataKey="day"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #2a2d45",
              borderRadius: "10px",
              color: "#fff",
            }}
          />

          <Bar dataKey="flagged" radius={[8, 8, 0, 0]} fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
