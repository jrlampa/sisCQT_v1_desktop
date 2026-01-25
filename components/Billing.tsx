
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User } from '../types';
import { ApiService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { PrivacyActions } from './PrivacyActions.tsx';

interface BillingProps {
  user: User;
  onUpdatePlan: (plan: User['plan']) => void;
}

const Billing: React.FC<BillingProps> = ({ user, onUpdatePlan }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ plan: User['plan']; authProvider?: User['authProvider']; subscription: any | null } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);
  const pollStartedAtRef = useRef<number>(0);

  const isIm3 = useMemo(() => user.email.toLowerCase().endsWith('@im3brasil.com.br'), [user.email]);
  const provider = (status?.authProvider || user.authProvider || (isIm3 ? 'ENTRA' : 'GOOGLE')) as 'ENTRA' | 'GOOGLE';

  const desktopApi = (typeof window !== 'undefined' ? (window as any).siscqtDesktop : undefined) as
    | { openExternal?: (url: string) => Promise<boolean> }
    | undefined;
  const canOpenExternal = typeof desktopApi?.openExternal === 'function';

  const refreshStatus = async () => {
    const s = await ApiService.billingStatus();
    setStatus(s);
    return s;
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const startPolling = (opts?: { intervalMs?: number; maxMs?: number }) => {
    const intervalMs = typeof opts?.intervalMs === 'number' ? opts!.intervalMs! : 3000;
    const maxMs = typeof opts?.maxMs === 'number' ? opts!.maxMs! : 2 * 60 * 1000;

    if (pollIntervalRef.current) return;
    pollStartedAtRef.current = Date.now();
    setIsPolling(true);

    const tick = async () => {
      // timeout hard: não faz polling infinito
      if (Date.now() - pollStartedAtRef.current > maxMs) {
        stopPolling();
        showToast('Ainda aguardando confirmação do pagamento. Clique em “Atualizar status” após concluir no navegador.', 'info');
        return;
      }

      try {
        const s = await refreshStatus();
        const subStatus = String((s as any)?.subscription?.status || '').toLowerCase();
        const becamePro = s.plan === 'Pro' || subStatus === 'active' || subStatus === 'trialing';
        if (becamePro) {
          stopPolling();
          showToast('Assinatura confirmada! Seu plano foi atualizado.', 'success');
        }
      } catch {
        // erros transitórios (rede/webhook ainda não processado) não devem parar o polling
      }
    };

    void tick();
    pollIntervalRef.current = window.setInterval(() => void tick(), intervalMs);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await ApiService.billingStatus();
        if (!cancelled) setStatus(s);
      } catch (e: any) {
        // status é opcional; UI ainda funciona com `user.plan`
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Em web: se voltou do Stripe com ?success=1, fazemos polling até o webhook concluir.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      startPolling();
    }
    if (params.get('canceled') === '1') {
      showToast('Checkout cancelado.', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ao voltar o foco para o app (Desktop), atualiza status imediatamente.
  useEffect(() => {
    const onFocus = () => {
      void refreshStatus();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Atualiza plan no app quando backend/webhook concluir
  useEffect(() => {
    if (!status?.plan) return;
    if (status.plan !== user.plan) onUpdatePlan(status.plan);
  }, [status?.plan]);

  const plans = [
    { 
      id: 'Free', 
      name: 'Standard', 
      price: 'R$ 0', 
      features: ['Até 3 Projetos', 'Cálculos BT Base', '1 Cenário por Projeto', 'Sem IA Theseus'],
      color: 'bg-gray-100',
      textColor: 'text-gray-500'
    },
    { 
      id: 'Pro', 
      name: 'Scale-up Pro', 
      price: 'R$ 199', 
      features: ['Projetos Ilimitados', 'Otimização Automática', '5 Cenários por Projeto', 'Theseus AI (Gemini 3)'],
      color: 'bg-blue-600',
      textColor: 'text-white',
      badge: 'MAIS POPULAR'
    },
    { 
      id: 'Enterprise', 
      name: 'Custom Enterprise', 
      price: 'Sob Consulta', 
      features: ['White Label', 'API de Integração', 'Visão de Campo AI', 'Suporte 24/7'],
      color: 'bg-[#002b4d]',
      textColor: 'text-white'
    }
  ];

  const handleUpgrade = async (planId: User['plan']) => {
    if (provider === 'ENTRA' || isIm3 || user.plan === 'Enterprise') {
      showToast('Conta corporativa: acesso irrestrito (sem cobrança).', 'info');
      return;
    }
    if (planId !== 'Pro') {
      showToast('Para avulsos, apenas o plano Pro é assinado via pagamento.', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const res = await ApiService.billingCheckout();
      if (!res?.url) throw new Error('URL de checkout não retornada.');
      if (canOpenExternal) {
        const ok = await desktopApi!.openExternal!(res.url);
        if (!ok) throw new Error('Falha ao abrir o checkout no navegador.');
        showToast('Checkout aberto no navegador. Conclua o pagamento e volte ao app — vamos confirmar automaticamente.', 'info');
        startPolling();
        return;
      }
      window.location.href = res.url;
    } catch (e: any) {
      showToast(e?.message || 'Falha ao iniciar checkout.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.billingPortal();
      if (!res?.url) throw new Error('URL do portal não retornada.');
      if (canOpenExternal) {
        const ok = await desktopApi!.openExternal!(res.url);
        if (!ok) throw new Error('Falha ao abrir o portal no navegador.');
        showToast('Portal aberto no navegador. Após ajustar sua assinatura, volte ao app — vamos atualizar o status.', 'info');
        startPolling({ maxMs: 3 * 60 * 1000 });
        return;
      }
      window.location.href = res.url;
    } catch (e: any) {
      showToast(e?.message || 'Falha ao abrir portal.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-12 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-4">Escolha sua Potência</h2>
        <p className="text-gray-500 font-medium">
          {provider === 'ENTRA' ? 'Acesso corporativo IM3 (sem cobrança).' : 'Assinatura para usuários avulsos via Stripe/Google Pay.'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <div 
            key={p.id}
            className={`glass-dark relative rounded-[40px] p-10 border-2 transition-all flex flex-col ${user.plan === p.id ? 'border-blue-500 shadow-2xl scale-105' : 'border-white/60 hover:border-blue-200'}`}
          >
            {p.badge && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg">
                {p.badge}
              </span>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-black text-gray-800 mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">{p.price}</span>
                {p.id !== 'Enterprise' && <span className="text-gray-400 text-sm font-bold">/mês</span>}
              </div>
            </div>

            <ul className="flex flex-col gap-4 mb-10 flex-1">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleUpgrade(p.id)}
              disabled={isLoading || user.plan === p.id || (provider !== 'GOOGLE' && p.id !== user.plan)}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                user.plan === p.id || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : `${p.color} ${p.textColor} shadow-xl hover:scale-105`
              }`}
            >
              {user.plan === p.id ? 'Plano Atual' : (p.id === 'Pro' && provider === 'GOOGLE' ? 'Assinar Pro' : 'Indisponível')}
            </button>
          </div>
        ))}
      </div>

      <div className="glass-dark rounded-[32px] p-8 border border-white/60 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="text-4xl bg-blue-50 w-16 h-16 flex items-center justify-center rounded-2xl">💳</div>
            <div>
               <h4 className="text-lg font-black text-gray-800">Assinatura</h4>
               <p className="text-sm text-gray-500 font-medium italic">
                 {provider === 'ENTRA'
                   ? 'Conta corporativa (sem cobrança).'
                   : (status?.subscription?.status
                       ? `Status: ${status.subscription.status}`
                       : 'Sem assinatura ativa.')}
               </p>
               {provider === 'GOOGLE' && isPolling && (
                 <p className="text-[11px] text-blue-600 font-black mt-2 uppercase tracking-widest">
                   Aguardando confirmação…
                 </p>
               )}
            </div>
         </div>
         {provider === 'GOOGLE' && (
           <div className="flex gap-3">
             <button
               onClick={async () => {
                 setIsLoading(true);
                 try {
                   await refreshStatus();
                   showToast('Status atualizado.', 'success');
                 } catch (e: any) {
                   showToast(e?.message || 'Falha ao atualizar status.', 'error');
                 } finally {
                   setIsLoading(false);
                 }
               }}
               disabled={isLoading}
               className={`text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-white/70 px-6 py-3 rounded-xl transition-all ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
             >
               Atualizar status
             </button>
             <button
               onClick={handlePortal}
               disabled={isLoading}
               className={`text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 px-6 py-3 rounded-xl transition-all ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
             >
               Gerenciar Assinatura
             </button>
           </div>
         )}
      </div>

      <PrivacyActions compact />
    </div>
  );
};

export default Billing;
