import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ElectricalEngine } from '../services/electricalEngine';
import type { EngineResult, NetworkNode, ProjectParams } from '../types';

type EngineInput = {
  scenarioId: string;
  nodes: NetworkNode[];
  params: ProjectParams & Record<string, any>;
  cables: Record<string, { r: number; x: number; coef: number; ampacity: number }>;
  ips: Record<string, number>;
};

type GoldenCase = {
  name: string;
  input: EngineInput;
  expected: any;
};

function roundNum(n: any, digits = 4): any {
  if (typeof n !== 'number' || !Number.isFinite(n)) return n;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function roundDeep(value: any): any {
  if (Array.isArray(value)) return value.map(roundDeep);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = roundDeep(v);
    return out;
  }
  return roundNum(value);
}

function digestEngineResult(result: EngineResult) {
  const nodes = [...(result.nodes || [])]
    .map((n: any) => ({
      id: n.id,
      parentId: n.parentId,
      meters: n.meters,
      cable: n.cable,
      loads: {
        mono: n.loads?.mono ?? 0,
        bi: n.loads?.bi ?? 0,
        tri: n.loads?.tri ?? 0,
        pointKva: n.loads?.pointKva ?? 0,
        ipType: n.loads?.ipType ?? 'Sem IP',
        ipQty: n.loads?.ipQty ?? 0,
        solarKva: n.loads?.solarKva ?? 0,
      },
      // Internos expostos no resultado (TreeNode spread)
      subtreeTotalKva: n.subtreeTotalKva,
      subtreeTotalSolarKva: n.subtreeTotalSolarKva,
      nodeDistributedKva: n.nodeDistributedKva,
      nodeConcentratedKva: n.nodeConcentratedKva,
      nodeSolarKva: n.nodeSolarKva,
      // Saídas relevantes
      calculatedLoad: n.calculatedLoad,
      accumulatedCqt: n.accumulatedCqt,
      solarVoltageRise: n.solarVoltageRise,
      jouleLossWatts: n.jouleLossWatts,
      netCurrentDay: n.netCurrentDay,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const rounded = roundDeep({
    scenarioId: result.scenarioId,
    kpis: {
      totalLoad: result.kpis?.totalLoad,
      diversifiedLoad: result.kpis?.diversifiedLoad,
      pointLoad: result.kpis?.pointLoad,
      ipLoad: result.kpis?.ipLoad,
      trafoOccupation: result.kpis?.trafoOccupation,
      maxCqt: result.kpis?.maxCqt,
      totalCustomers: result.kpis?.totalCustomers,
      globalDmdiFactor: result.kpis?.globalDmdiFactor,
    },
    gdImpact: {
      totalInstalledKva: result.gdImpact?.totalInstalledKva,
      maxVoltageRise: result.gdImpact?.maxVoltageRise,
      hasReverseFlow: result.gdImpact?.hasReverseFlow,
      reverseFlowAmps: result.gdImpact?.reverseFlowAmps,
      selfConsumptionRate: result.gdImpact?.selfConsumptionRate,
    },
    warnings: [...(result.warnings || [])].sort(),
    nodes,
  });
  // Remove campos undefined (para comparar com golden JSON de forma estável)
  return JSON.parse(JSON.stringify(rounded));
}

async function loadGolden(filename: string): Promise<GoldenCase> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const p = path.resolve(here, filename);
  const raw = await readFile(p, 'utf-8');
  return JSON.parse(raw);
}

describe('ElectricalEngine — regressão PRODIST (golden files)', () => {
  it('caso 1 (baseline)', async () => {
    const g = await loadGolden('./golden.prodist.case1.json');
    const r = ElectricalEngine.calculate(g.input.scenarioId, g.input.nodes, g.input.params, g.input.cables, g.input.ips);
    expect(digestEngineResult(r)).toEqual(g.expected);
  });

  it('caso 2 (GD + reverse flow)', async () => {
    const g = await loadGolden('./golden.prodist.case2.json');
    const r = ElectricalEngine.calculate(g.input.scenarioId, g.input.nodes, g.input.params, g.input.cables, g.input.ips);
    expect(digestEngineResult(r)).toEqual(g.expected);
  });
});

