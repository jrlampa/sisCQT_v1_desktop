
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonteCarloResult } from '../../../types';

interface MonteCarloSimulationProps {
  activeMonteCarlo: MonteCarloResult | null;
  isMonteCarloRunning: boolean;
  runMonteCarlo: (iterations?: number) => Promise<void>;
}

const MonteCarloSimulation: React.FC<MonteCarloSimulationProps> = ({ activeMonteCarlo, isMonteCarloRunning, runMonteCarlo }) => (
  <div className="glass p-10 rounded-[48px] border-white">
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Simulação Monte Carlo</h4>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest opacity-70">
          Variabilidade de carga/GD e risco de violação (sob demanda)
        </p>
      </div>
      <button
        onClick={() => runMonteCarlo(1000)}
        disabled={isMonteCarloRunning}
        className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all border border-white/60 bg-blue-600 text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isMonteCarloRunning ? 'Rodando...' : 'Rodar Simulação'}
      </button>
    </header>

    {!activeMonteCarlo ? (
      <div className="py-10 text-center opacity-60">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Clique em “Rodar Simulação” para gerar o histograma e métricas.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeMonteCarlo.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.02)" />
                <XAxis dataKey="x" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', fontWeight: 900, boxShadow: '0 20px 60px rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                  labelFormatter={(v) => `Max CQT ≤ ${v}%`}
                />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-dark p-6 rounded-[28px] border border-white/80">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Índice de Estabilidade</div>
            <div className="text-3xl font-black tracking-tighter text-blue-900 mt-2">
              {(activeMonteCarlo.stabilityIndex * 100).toFixed(0)}%
            </div>
          </div>
          <div className="glass-dark p-6 rounded-[28px] border border-white/80">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Risco de Falha</div>
            <div className="text-3xl font-black tracking-tighter text-red-500 mt-2">
              {(activeMonteCarlo.failureRisk * 100).toFixed(1)}%
            </div>
          </div>
          <div className="glass-dark p-6 rounded-[28px] border border-white/80">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">P95 (Max CQT)</div>
            <div className="text-3xl font-black tracking-tighter text-orange-600 mt-2">
              {activeMonteCarlo.p95Cqt.toFixed(2)}%
            </div>
          </div>
          <div className="glass-dark p-6 rounded-[28px] border border-white/80">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Média (Max CQT)</div>
            <div className="text-3xl font-black tracking-tighter text-slate-800 mt-2">
              {activeMonteCarlo.avgMaxCqt.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default MonteCarloSimulation;
