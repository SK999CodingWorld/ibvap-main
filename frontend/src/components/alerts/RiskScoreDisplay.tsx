import React from 'react';
import { AlertTriangle, Clock, Activity, Users, FileText, Info } from 'lucide-react';

interface RiskFactor {
  name: string;
  score: number;
  description: string;
  category: 'zone' | 'time' | 'behavior' | 'correlation' | 'context' | string;
}

interface RiskScoreDisplayProps {
  score: number;
  factors?: RiskFactor[];
  expanded?: boolean;
}

export function RiskScoreDisplay({ score, factors = [], expanded = false }: RiskScoreDisplayProps) {
  // Determine severity and color
  let severity = 'INFO';
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-400/10';
  let borderClass = 'border-slate-400';

  if (score >= 81) {
    severity = 'CRITICAL';
    colorClass = 'text-red-500';
    bgClass = 'bg-red-500/10';
    borderClass = 'border-red-500';
  } else if (score >= 61) {
    severity = 'HIGH';
    colorClass = 'text-orange-500';
    bgClass = 'bg-orange-500/10';
    borderClass = 'border-orange-500';
  } else if (score >= 41) {
    severity = 'MEDIUM';
    colorClass = 'text-amber-500';
    bgClass = 'bg-amber-500/10';
    borderClass = 'border-amber-500';
  } else if (score >= 21) {
    severity = 'LOW';
    colorClass = 'text-blue-500';
    bgClass = 'bg-blue-500/10';
    borderClass = 'border-blue-500';
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'zone': return <AlertTriangle className="w-4 h-4" />;
      case 'time': return <Clock className="w-4 h-4" />;
      case 'behavior': return <Activity className="w-4 h-4" />;
      case 'correlation': return <Users className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Circular Score Indicator */}
      <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-4 ${borderClass} ${bgClass}`}>
        <div className="text-center">
          <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
          <div className={`text-xs font-semibold tracking-wider ${colorClass}`}>{severity}</div>
        </div>
      </div>

      {/* Expanded Factors Breakdown */}
      {expanded && factors.length > 0 && (
        <div className="w-full mt-6 space-y-3">
          <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2 mb-3">Risk Factor Breakdown</h4>
          {factors.map((factor, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">{getCategoryIcon(factor.category)}</span>
                  <span>{factor.name}</span>
                </div>
                <span className={`font-medium ${factor.score > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  {factor.score > 0 ? '+' : ''}{factor.score}
                </span>
              </div>
              
              {/* Visual Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${factor.score > 0 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(Math.abs(factor.score), 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{factor.description}</p>
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-700 font-bold">
            <span className="text-slate-300">Total Score</span>
            <span className={colorClass}>{score} / 100</span>
          </div>
        </div>
      )}
    </div>
  );
}
