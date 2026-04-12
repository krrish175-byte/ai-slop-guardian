import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, TrendingUp, Calendar, Zap, Share2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BurnoutStats {
  hours_wasted_month: number;
  slop_prs_month: number;
  total_prs_month: number;
  projected_hours_annual: number;
  burnout_risk: "low" | "medium" | "high" | "critical";
  repo_id: string;
}

export const Burnout: React.FC = () => {
  const [stats, setStats] = useState<BurnoutStats | null>(null);

  useEffect(() => {
    // Mocking the analytics API
    setTimeout(() => {
      setStats({
        hours_wasted_month: 24.5,
        slop_prs_month: 98,
        total_prs_month: 342,
        projected_hours_annual: 294,
        burnout_risk: "high",
        repo_id: "facebook/react"
      });
    }, 800);
  }, []);

  const riskColors = {
    low: "bg-green-500/10 text-green-500 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const trendData = [
    { day: 'Day 1', hours: 0.5 },
    { day: 'Day 5', hours: 2.1 },
    { day: 'Day 10', hours: 1.8 },
    { day: 'Day 15', hours: 4.5 },
    { day: 'Day 20', hours: 3.2 },
    { day: 'Day 25', hours: 5.8 },
    { day: 'Day 30', hours: 6.6 },
  ];

  if (!stats) return <div className="animate-pulse space-y-8">...Calculating Burden...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black gradient-text">Maintainer Burnout</h1>
          <p className="text-slate-400 mt-2">Visualizing the real cost of AI-generated repository noise.</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl border ${riskColors[stats.burnout_risk]} flex flex-col items-center`}>
          <span className="text-[10px] uppercase tracking-tighter font-bold opacity-70">Burnout risk</span>
          <span className="text-xl font-black uppercase italic">{stats.burnout_risk}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 glass p-8 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Clock size={120} />
             </div>
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={24} className="text-brand-primary" /> Slop Burden Trend
             </h2>
             <div className="h-[300px] w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#00f2fe' }}
                        />
                        <Area type="monotone" dataKey="hours" stroke="#00f2fe" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>

        <div className="space-y-8">
            <div className="glass p-8 rounded-3xl border-l-4 border-slop-high">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Impact this month</div>
                <div className="text-5xl font-black text-white">{stats.hours_wasted_month} <span className="text-lg font-normal text-slate-500">hrs</span></div>
                <p className="text-slate-400 text-sm mt-4 italic">
                    You've wasted over a full day of productivity reviewing AI slop this month.
                </p>
            </div>

            <div className="glass p-8 rounded-3xl border-l-4 border-brand-secondary">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Annual projection</div>
                <div className="text-5xl font-black text-white">{stats.projected_hours_annual} <span className="text-lg font-normal text-slate-500">hrs</span></div>
                <p className="text-slate-400 text-sm mt-4 italic">
                    Equivalent to 37 working days lost per year to bot noise.
                </p>
            </div>

            <button 
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Our repo ${stats.repo_id} wastes ${stats.hours_wasted_month} hrs/month on AI slop. Using @AISlopGuardian to fight back.`)}
                className="w-full flex items-center justify-center gap-3 bg-brand-primary py-4 rounded-2xl font-black text-slate-900 hover:scale-[1.02] transition-transform"
            >
                <Share2 size={20} /> SHARE ON X
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { label: "Slop Volume", val: stats.slop_prs_month, icon: <AlertTriangle />, sub: "Flagged PRs" },
            { label: "Review Velocity", val: "15m", icon: <Clock />, sub: "Avg per PR" },
            { label: "Efficiency Gain", val: "84%", icon: <Zap />, sub: "With Guardian" },
        ].map((item, i) => (
            <div key={i} className="glass p-6 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-xl text-brand-primary">{item.icon}</div>
                <div>
                    <div className="text-sm font-bold text-slate-300">{item.label}</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black">{item.val}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{item.sub}</span>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
