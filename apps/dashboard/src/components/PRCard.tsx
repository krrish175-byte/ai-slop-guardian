import React from "react";
import { SlopScore } from "./SlopScore";
import { ExternalLink, GitPullRequest } from "lucide-react";

interface PRCardProps {
  repoId: string;
  prNumber: number;
  title: string;
  author: string;
  score: number;
  timestamp: string;
}

export const PRCard: React.FC<PRCardProps> = ({ repoId, prNumber, title, author, score, timestamp }) => {
  return (
    <div className="glass p-5 rounded-2xl card-hover flex items-center justify-between gap-3">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary">
          <GitPullRequest size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-tight line-clamp-1 truncate">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">
            {repoId} #{prNumber} by <span className="text-slate-200 font-medium  truncate">@{author}</span>
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-2">{timestamp}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ">
        <SlopScore score={score} size="sm" />
        <a 
          href={`https://github.com/${repoId}/pull/${prNumber}`} 
          target="_blank" 
          rel="noreferrer"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ExternalLink size={20} />
        </a>
      </div>
    </div>
  );
};
