import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import type { PRSummary } from "../api/client";

type Props = {
  data: PRSummary[];
};

const COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  human: "#10b981",
};

export default function AIBreakdownPieChart({ data }: Props) {
  const counts = {
    High: 0,
    Medium: 0,
    human: 0,
  };

  data.forEach((pr) => {
    if (pr.label.includes("high")) {
      counts.High += 1;
    } else if (pr.label.includes("medium")) {
      counts.Medium += 1;
    } else if (pr.label.includes("human")) {
      counts.human += 1;
    }
  });

  const chartData = Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .filter((item) => item.value > 0);

  return (
    <div className="w-full h-[330px] rounded-3xl p-2">
      <h2 className="text-white text-xl font-bold mb-4">
        AI Detection Breakdown
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            stroke="transparent"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #2a2d45",
              borderRadius: "10px",
              color: "#fff",
            }}
            labelStyle={{ color: "#fff" }}
          />

          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{
              fontSize: "14px",
              paddingTop: "10px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}