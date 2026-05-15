import React, { useState } from "react";
import { Users, Search, Filter } from "lucide-react";
import { TrustScoreGraph } from "../components/TrustScoreGraph";

export const TrustGraph: React.FC = () => {
  const [selectedContributor, setSelectedContributor] = useState("krrish175");

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black gradient-text">Contributor Trust Graph</h1>
          <p className="text-slate-400 mt-2">Tracking how a contributor&apos;s reputation changes across analyzed pull requests.</p>
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search contributor..." 
                    value={selectedContributor}
                    onChange={(event) => setSelectedContributor(event.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-brand-primary outline-none w-64"
                />
            </div>
            <button className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                <Filter size={20} />
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
            <TrustScoreGraph username={selectedContributor} />
        </div>

        <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Users size={20} className="text-brand-secondary" /> Top Trusted Nodes
            </h3>
            <div className="space-y-4">
                {[
                    { name: "krrish175", score: 98, role: "Maintainer" },
                    { name: "dan_abramov", score: 95, role: "Core Contributor" },
                    { name: "tobi", score: 92, role: "Contributor" },
                    { name: "rich_harris", score: 89, role: "Reviewer" },
                    { name: "evan_you", score: 87, role: "Contributor" },
                ].map((user, i) => (
                    <button key={i} type="button" onClick={() => setSelectedContributor(user.name)} className="glass p-4 rounded-2xl flex justify-between items-center hover:border-brand-primary/50 transition-colors cursor-pointer group w-full text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-brand-primary/20 group-hover:text-brand-primary transition-colors">
                                {user.name[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-sm">{user.name}</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-tighter">{user.role}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-brand-primary font-black">{user.score}</div>
                            <div className="text-[10px] text-slate-500 font-bold">TRUST</div>
                        </div>
                    </button>
                ))}
            </div>
            <button className="w-full py-4 glass rounded-2xl text-slate-400 text-sm font-bold hover:bg-white/5 transition-colors">
                VIEW GLOBAL NETWORK
            </button>
        </div>
      </div>
    </div>
  );
};
