
import { ElectricalEngine } from './electricalEngine.ts';

/**
 * Theseus Engine Web Worker
 * Responsável por processar simulações de Monte Carlo e cálculos intensivos
 * sem bloquear a UI thread.
 */

type EngineWorkerOp = 'calculate' | 'montecarlo';

type WorkerRequest =
  | {
      id: string;
      op: 'calculate';
      payload: {
        scenarioId: string;
        nodes: any[];
        params: any;
        cables: Record<string, any>;
        ips: Record<string, number>;
      };
    }
  | {
      id: string;
      op: 'montecarlo';
      payload: {
        nodes: any[];
        params: any;
        cables: Record<string, any>;
        ips: Record<string, number>;
        iterations?: number;
        seed?: any;
      };
    };

type WorkerResponse =
  | { id: string; ok: true; result: any }
  | { id: string; ok: false; error: string };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, op, payload } = e.data;

  try {
    let result: any;
    if (op === 'calculate') {
      const { scenarioId, nodes, params, cables, ips } = payload as any;
      result = ElectricalEngine.calculate(scenarioId, nodes, params, cables, ips);
    } else if (op === 'montecarlo') {
      const { nodes, params, cables, ips, iterations, seed } = payload as any;
      result = ElectricalEngine.runMonteCarlo(nodes, params, cables, ips, iterations || 1000, seed);
    } else {
      throw new Error(`Operação inválida no worker: ${String(op as EngineWorkerOp)}`);
    }

    const msg: WorkerResponse = { id, ok: true, result };
    self.postMessage(msg);
  } catch (error) {
    const msg: WorkerResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no worker',
    };
    self.postMessage(msg);
  }
};
