import React from "react";
import { ApiStats } from "../types";
import { Activity, Clock, Cpu, CheckCircle, Flame, ShieldAlert, Zap, Brain } from "lucide-react";

interface StatsSectionProps {
  stats: ApiStats | null;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const formatTokens = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const successRate = stats && stats.totalRequests > 0 
    ? Math.round((stats.successRequests / stats.totalRequests) * 100) 
    : 100;

  // Primary analytical cards
  const cards = [
    {
      title: "Total Queries",
      value: stats ? stats.totalRequests : 0,
      subtext: "Requests processed",
      icon: <Activity className="h-4.5 w-4.5 text-blue-400" />,
    },
    {
      title: "Tokens Rendered",
      value: stats ? formatTokens(stats.totalTokens) : "0",
      subtext: "System throughput",
      icon: <Cpu className="h-4.5 w-4.5 text-indigo-400" />,
    },
    {
      title: "Response Time",
      value: stats && stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs} ms` : "---",
      subtext: "Global average latency",
      icon: <Clock className="h-4.5 w-4.5 text-amber-400" />,
    },
    {
      title: "Success Index",
      value: `${successRate}%`,
      subtext: "Guaranteed uptime",
      icon: <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />,
    },
  ];

  // Model breakdowns
  const models = [
    {
      id: "auto",
      name: "Minc Auto (Default)",
      count: stats?.modelStats?.auto || 0,
      desc: "Smart routing lane",
      color: "from-blue-400 to-indigo-500",
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-300",
      icon: <Flame className="h-3.5 w-3.5" />
    },
    {
      id: "instant",
      name: "Minc Instant",
      count: stats?.modelStats?.instant || 0,
      desc: "Zero-latency response",
      color: "from-emerald-400 to-teal-500",
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
      icon: <Zap className="h-3.5 w-3.5" />
    },
    {
      id: "low-reasoning",
      name: "Low Reasoning",
      count: stats?.modelStats?.["low-reasoning"] || 0,
      desc: "Structured logic",
      color: "from-purple-400 to-fuchsia-500",
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
      icon: <Brain className="h-3.5 w-3.5" />
    },
    {
      id: "high-reasoning",
      name: "High Reasoning",
      count: stats?.modelStats?.["high-reasoning"] || 0,
      desc: "Deep thought synthesis",
      color: "from-amber-400 to-orange-500",
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
      icon: <Brain className="h-3.5 w-3.5" />
    },
  ];

  // Calculate sum of model-specific requests to find percentages
  const modelTotal = models.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white/[0.02] border border-white/5 backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans leading-tight">
                {card.title}
              </span>
              <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg">{card.icon}</div>
            </div>
            <div className="mt-4">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">
                {card.value}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{card.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Model Distribution Area */}
      <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Model Processing Volume</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time breakdown of routing decisions</p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">No data logs displayed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {models.map((m) => {
            const percentage = Math.round((m.count / modelTotal) * 100);
            return (
              <div key={m.id} className="bg-black/20 border border-white/5 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg border ${m.bg}`}>
                    {m.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white">{m.count}</span>
                    <span className="text-[10px] text-slate-500 ml-1">({percentage}%)</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{m.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                </div>
                {/* Slim progress indicator */}
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
