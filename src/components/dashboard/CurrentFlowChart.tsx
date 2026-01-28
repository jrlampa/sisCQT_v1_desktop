
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  id: string;
  current: number;
  limit: number;
}

interface CurrentFlowChartProps {
  data: ChartData[];
}

const CurrentFlowChart: React.FC<CurrentFlowChartProps> = ({ data }) => (
  <div className="lg:col-span-2 glass p-10 rounded-[48px] border-white">
    <header className="mb-12 flex justify-between items-end">
      <div>
        <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Fluxo de Corrente por Trecho</h4>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest opacity-70">Monitoramento térmico em tempo real</p>
      </div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Demanda</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite</span></div>
      </div>
    </header>
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.02)" />
          <XAxis dataKey="id" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis unit="A" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
            contentStyle={{ borderRadius: '24px', border: 'none', fontWeight: 900, boxShadow: '0 20px 60px rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
          />
          <Bar dataKey="current" fill="#3b82f6" radius={[12, 12, 12, 12]} barSize={24} />
          <Bar dataKey="limit" fill="#f1f5f9" radius={[12, 12, 12, 12]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default CurrentFlowChart;
