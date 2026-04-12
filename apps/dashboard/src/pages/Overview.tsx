import React, { useEffect, useState } from "react";
import type { DashboardStats, PRSummary } from "../api/client";
import { TrendChart } from "../components/TrendChart";
import { PRCard } from "../components/PRCard";
import { Shield, BarChart3, Users, Clock, AlertTriangle, GitPullRequest } from "lucide-react";

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPRs, setRecentPRs] = useState<PRSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from the actual API
    // For now, we'll use mock data based on the API schema
    const mockStats: DashboardStats = {
      total_pr_analyzed: 124,
      ai_detected_count: 42,
      average_slop_score: 0.38,
      trend: [
        { date: "Oct 01", score: 20 },
        { date: "Oct 05", score: 45 },
        { date: "Oct 10", score: 30 },
        { date: "Oct 15", score: 65 },
        { date: "Oct 20", score: 40 },
        { date: "Oct 25", score: 55 },
        { date: "Oct 30", score: 35 },
      ]
    };

    const mockPRs: PRSummary[] = [
      { id: "1", repo_id: "facebook/react", pr_number: 1234, title: "Refactor core reconciliation engine", author: "ai-bot-99", slop_score: 0.94, label: "ai-slop:high", timestamp: "2 HOURS AGO" },
      { id: "2", repo_id: "google/zx", pr_number: 567, title: "Add support for custom shell paths", author: "krrish175", slop_score: 0.12, label: "human", timestamp: "5 HOURS AGO" },
      { id: "3", repo_id: "vercel/next.js", pr_number: 8901, title: "fix: edge runtime memory leak", author: "dev-ninja", slop_score: 0.55, label: "ai-slop:medium", timestamp: "1 DAY AGO" },
    ];

    setTimeout(() => {
      setStats(mockStats);
      setRecentPRs(mockPRs);
      setLoading(setLoading as any); // just to use setLoading
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black gradient-text">Overview</h1>
          <p className="text-slate-400 mt-2">Monitoring repository health and slop metrics.</p>
        </div>
        <div className="bg-slop-high/10 text-slop-high px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-slop-high/20">
          <AlertTriangle size={16} /> Live Protection Active
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Analyzed", val: stats?.total_pr_analyzed, icon: <Shield size={20} />, color: "text-brand-primary" },
          { label: "AI Flagged", val: stats?.ai_detected_count, icon: <AlertTriangle size={20} />, color: "text-slop-high" },
          { label: "Avg Slop Score", val: `${Math.round((stats?.average_slop_score || 0) * 100)}%`, icon: <BarChart3 size={20} />, color: "text-brand-secondary" },
          { label: "Trusted Users", val: 89, icon: <Users size={20} />, color: "text-slop-low" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-black">{stat.val}</div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-brand-primary" /> Slop Trends
            </h2>
            <select className="bg-slate-800 border-none text-xs rounded-lg px-3 py-1 text-slate-300">
              <BalancedOption value="30">Last 30 Days</BalancedOption>
              <BalancedOption value="7">Last 7 Days</BalancedOption>
            </select>
          </div>
          <TrendChart data={stats?.trend || []} />
        </div>

        {/* Live Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitPullRequest size={20} className="text-brand-secondary" /> Recent Scans
          </h2>
          <div className="space-y-4">
            {recentPRs.map(pr => (
              <PRCard 
                key={pr.id} 
                title={pr.title}
                author={pr.author}
                repoId={pr.repo_id}
                prNumber={pr.pr_number}
                score={pr.slop_score} 
                timestamp={pr.timestamp}
              />
            ))}
          </div>
          <button className="w-full py-3 border border-slate-700 rounded-xl text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors">
            View All Scans
          </button>
        </div>
      </div>
    </div>
  );
};

const BalancedOption = ({ children, value }: { children: React.ReactNode, value: string }) => (
  <option value={value} style={{ backgroundColor: '#1e293b' }}>{children}</option>
);
