
import React from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  status: 'critical' | 'warning' | 'positive' | 'ok' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, status }) => (
  <div className="glass p-8 rounded-[40px] border-white group relative overflow-hidden transition-all duration-500 hover:bg-white/60">
    <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.05] group-hover:scale-125 transition-transform">{icon}</div>
    <div className="flex justify-between items-start mb-8 relative z-10">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-xl group-hover:animate-bounce">{icon}</span>
    </div>
    <p className={`text-4xl font-black tracking-tighter relative z-10
      ${status === 'critical' ? 'text-red-500' :
        status === 'warning' ? 'text-orange-500' :
        status === 'positive' ? 'text-green-600' : 'text-blue-900'}`}>
      {value}
    </p>
  </div>
);

interface KpiGridProps {
  stats: KpiCardProps[];
}

const KpiGrid: React.FC<KpiGridProps> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
    {stats.map((stat, i) => (
      <KpiCard key={i} {...stat} />
    ))}
  </div>
);

export default KpiGrid;
