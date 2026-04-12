import React from "react";
import { Users, Shield, Link2, Search, Filter } from "lucide-react";

export const TrustGraph: React.FC = () => {
  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black gradient-text">Contributor Trust Graph</h1>
          <p className="text-slate-400 mt-2">Visualizing the decentralized trust network of your repository.</p>
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search contributor..." 
                    className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-brand-primary outline-none w-64"
                />
            </div>
            <button className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                <Filter size={20} />
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass rounded-3xl min-h-[600px] relative overflow-hidden flex items-center justify-center">
            {/* Mock Graph Visualization */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-brand-primary rounded-full blur-[2px]"></div>
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-brand-secondary rounded-full blur-[1px]"></div>
                <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-slop-low rounded-full"></div>
                {/* Visual lines connecting circles */}
                <svg className="w-full h-full stroke-slate-700 stroke-1 fill-none">
                    <line x1="33%" y1="25%" x2="50%" y2="50%" />
                    <line x1="50%" y1="50%" x2="25%" y2="66%" />
                    <circle cx="33%" cy="25%" r="10" className="fill-slate-900 stroke-brand-primary" />
                    <circle cx="50%" cy="50%" r="20" className="fill-slate-900 stroke-brand-secondary" />
                    <circle cx="25%" cy="66%" r="15" className="fill-slate-900 stroke-slop-low" />
                </svg>
            </div>
            
            <div className="text-center z-10 px-12">
                <Shield size={64} className="text-brand-primary mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Live Trust Network</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                    The trust graph identifies "islands of excellence" — clusters of contributors who verify each other's work through the Guardian Trust Protocol.
                </p>
                <div className="mt-8 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl inline-flex items-center gap-3">
                    <Link2 size={20} className="text-brand-primary" />
                    <span className="text-sm font-bold">142 Trust Links Active</span>
                </div>
            </div>
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
                    <div key={i} className="glass p-4 rounded-2xl flex justify-between items-center hover:border-brand-primary/50 transition-colors cursor-pointer group">
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
                    </div>
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
