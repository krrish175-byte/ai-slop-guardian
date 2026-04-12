import React from "react";

interface SlopScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const SlopScore: React.FC<SlopScoreProps> = ({ score, size = "md" }) => {
  const percentage = Math.round(score * 100);
  
  const getColor = () => {
    if (score >= 0.75) return "text-slop-high";
    if (score >= 0.40) return "text-slop-medium";
    return "text-slop-low";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm": return "text-xl font-bold";
      case "lg": return "text-6xl font-black";
      default: return "text-3xl font-extrabold";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${getSizeClasses()} ${getColor()} tabular-nums`}>
        {percentage}%
      </div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">
        AI Probability
      </div>
      {size === "lg" && (
        <div className="mt-4 w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${score >= 0.75 ? 'bg-slop-high' : score >= 0.40 ? 'bg-slop-medium' : 'bg-slop-low'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
