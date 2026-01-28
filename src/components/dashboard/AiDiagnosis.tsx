
import React from 'react';

interface AiDiagnosisProps {
  warnings: string[];
}

const AiDiagnosis: React.FC<AiDiagnosisProps> = ({ warnings }) => (
  <div className="glass p-10 rounded-[48px] border-white flex flex-col">
    <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
      <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
      Diagnóstico IA
    </h4>
    <div className="space-y-4 flex-1 custom-scrollbar overflow-y-auto pr-3">
      {warnings.length > 0 ? (
        warnings.map((w, i) => (
          <div key={i} className="flex gap-4 items-start p-5 bg-white/40 rounded-3xl border border-orange-100 hover:border-orange-200 transition-all">
            <div className="w-10 h-10 shrink-0 bg-orange-50 rounded-2xl flex items-center justify-center text-xl">⚡</div>
            <p className="text-[11px] font-bold text-slate-700 leading-relaxed pt-1 uppercase tracking-tight">{w}</p>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-3xl mb-6">✓</div>
          <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Sistema Estável</p>
        </div>
      )}
    </div>
    <button className="mt-10 w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
      Consultar Analista Theseus
    </button>
  </div>
);

export default AiDiagnosis;
