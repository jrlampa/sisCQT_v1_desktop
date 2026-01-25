import type { EngineResult, MonteCarloResult, NetworkNode, ProjectParams } from '../types';
import { ElectricalEngine } from './electricalEngine';

type EngineWorkerOp = 'calculate' | 'montecarlo';

type CalculatePayload = {
  scenarioId: string;
  nodes: NetworkNode[];
  params: ProjectParams;
  cables: Record<string, any>;
  ips: Record<string, number>;
};

type MonteCarloPayload = {
  nodes: NetworkNode[];
  params: ProjectParams;
  cables: Record<string, any>;
  ips: Record<string, number>;
  iterations?: number;
  seed?: unknown;
};

type WorkerRequest =
  | { id: string; op: 'calculate'; payload: CalculatePayload }
  | { id: string; op: 'montecarlo'; payload: MonteCarloPayload };

type WorkerResponse =
  | { id: string; ok: true; result: any }
  | { id: string; ok: false; error: string };

let workerSingleton: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (workerSingleton) return workerSingleton;

  workerSingleton = new Worker(new URL('./electricalWorker.ts', import.meta.url), { type: 'module' });
  return workerSingleton;
}

function makeId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export class ElectricalWorkerClient {
  private static pending = new Map<
    string,
    { resolve: (v: any) => void; reject: (e: any) => void; timeoutId: number }
  >();

  private static ensureSubscribed(w: Worker) {
    // Evita re-registrar handlers se já foi feito.
    // @ts-expect-error - propriedade de marcação interna
    if (w.__sisqat_engine_worker_subscribed) return;

    w.addEventListener('message', (ev: MessageEvent<WorkerResponse>) => {
      const msg = ev.data;
      const entry = this.pending.get(msg.id);
      if (!entry) return;

      window.clearTimeout(entry.timeoutId);
      this.pending.delete(msg.id);

      if (msg.ok) entry.resolve(msg.result);
      else entry.reject(new Error(msg.error || 'Erro no worker'));
    });

    w.addEventListener('error', (err) => {
      // Em caso de erro de script do worker, rejeita tudo em voo.
      for (const [id, entry] of this.pending.entries()) {
        window.clearTimeout(entry.timeoutId);
        entry.reject(err);
        this.pending.delete(id);
      }
    });

    // @ts-expect-error - propriedade de marcação interna
    w.__sisqat_engine_worker_subscribed = true;
  }

  private static async call<T>(req: WorkerRequest, timeoutMs: number): Promise<T> {
    const w = getWorker();

    // Fallback para ambientes sem Worker (ex.: vitest/jsdom) — mantém compatibilidade.
    if (!w) {
      if (req.op === 'calculate') {
        const p = req.payload as CalculatePayload;
        return ElectricalEngine.calculate(p.scenarioId, p.nodes, p.params, p.cables, p.ips) as any as T;
      }
      const p = req.payload as MonteCarloPayload;
      return ElectricalEngine.runMonteCarlo(p.nodes, p.params, p.cables, p.ips, p.iterations, p.seed) as any as T;
    }

    this.ensureSubscribed(w);

    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.pending.delete(req.id);
        reject(new Error('Timeout no worker de cálculo'));
      }, timeoutMs);

      this.pending.set(req.id, { resolve, reject, timeoutId });
      w.postMessage(req);
    });
  }

  static calculateScenario(payload: CalculatePayload, opts?: { timeoutMs?: number }): Promise<EngineResult> {
    const id = makeId();
    return this.call<EngineResult>({ id, op: 'calculate', payload }, opts?.timeoutMs ?? 15000);
  }

  static runMonteCarlo(payload: MonteCarloPayload, opts?: { timeoutMs?: number }): Promise<MonteCarloResult> {
    const id = makeId();
    return this.call<MonteCarloResult>({ id, op: 'montecarlo', payload }, opts?.timeoutMs ?? 60000);
  }
}

