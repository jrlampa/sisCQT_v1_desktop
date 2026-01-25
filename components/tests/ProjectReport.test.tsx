import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectReport from '../ProjectReport';

const { mockShowToast } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
}));

const { mockUseProject } = vi.hoisted(() => ({
  mockUseProject: vi.fn(),
}));

const { html2pdfMock, setMock, fromMock, saveMock } = vi.hoisted(() => {
  const saveMock = vi.fn().mockResolvedValue(undefined);
  const fromMock = vi.fn().mockReturnValue({ save: saveMock });
  const setMock = vi.fn().mockReturnValue({ from: fromMock });
  const html2pdfMock = vi.fn().mockReturnValue({ set: setMock });
  return { html2pdfMock, setMock, fromMock, saveMock };
});

vi.mock('../../context/ToastContext.tsx', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('../../context/ProjectContext', () => ({
  useProject: () => mockUseProject(),
}));

vi.mock('../UnifilarDiagram', () => ({
  default: () => <div data-testid="unifilar-mock" />,
}));

vi.mock('html2pdf.js', () => ({
  default: html2pdfMock,
}));

function makeReportContext() {
  const scenario = {
    id: 'SCN-1',
    name: 'ATUAL',
    updatedAt: new Date().toISOString(),
    params: { trafoKva: 75, profile: 'Massivos', classType: 'Automatic', manualClass: 'B', normativeTable: 'PRODIST' },
    nodes: [
      { id: 'TRAFO', parentId: '', meters: 0, cable: 'C1', loads: { mono: 0, bi: 0, tri: 0, pointQty: 0, pointKva: 0, ipType: 'Sem IP', ipQty: 0, solarKva: 0, solarQty: 0 } },
      { id: 'P1', parentId: 'TRAFO', meters: 10, cable: 'C1', loads: { mono: 1, bi: 0, tri: 0, pointQty: 0, pointKva: 0, ipType: 'Sem IP', ipQty: 0, solarKva: 0, solarQty: 0 } },
    ],
  };

  const project = {
    id: 'PRJ-1',
    name: 'Projeto 1',
    metadata: { sob: 'SOB-1', electricPoint: 'PE', lat: -22.9, lng: -43.1, district: '', city: 'Rio de Janeiro' },
    scenarios: [scenario],
    activeScenarioId: scenario.id,
    updatedAt: new Date().toISOString(),
    cables: { C1: { r: 0, x: 0, coef: 0, ampacity: 100 } },
    ipTypes: { 'Sem IP': 0 },
    reportConfig: {
      showJustification: true,
      showKpis: true,
      showTopology: true,
      showMaterials: true,
      showSignatures: false,
      showUnifilar: false,
      showComparison: true,
    },
  };

  const result = {
    scenarioId: scenario.id,
    nodes: scenario.nodes,
    kpis: {
      totalLoad: 10,
      diversifiedLoad: 9,
      pointLoad: 0,
      ipLoad: 0,
      trafoOccupation: 50,
      maxCqt: 2,
      totalCustomers: 1,
      globalDmdiFactor: 0.5,
    },
    sustainability: {
      annualEnergyLossKwh: 0,
      annualFinancialLossBrl: 0,
      annualCo2Kg: 0,
      potentialSavingsBrl10y: 0,
      potentialCo2Prevented10y: 0,
      treesEquivalent: 0,
    },
    gdImpact: {
      totalInstalledKva: 0,
      maxVoltageRise: 0,
      hasReverseFlow: false,
      reverseFlowAmps: 0,
      selfConsumptionRate: 0,
    },
    warnings: [],
  };

  return {
    project,
    scenario,
    result,
    allResults: { [scenario.id]: result },
  };
}

describe('ProjectReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar PDF e mostrar toasts (fluxo exportar)', async () => {
    const ctx = makeReportContext();
    mockUseProject.mockReturnValue({
      project: ctx.project,
      activeScenario: ctx.scenario,
      activeResult: ctx.result,
      allResults: ctx.allResults,
    });

    render(
      <MemoryRouter>
        <ProjectReport />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Gerar PDF/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Iniciando geração do PDF...', 'info');
      expect(html2pdfMock).toHaveBeenCalledTimes(1);
      expect(setMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Memorial gerado com sucesso!', 'success');
    });
  });

  it('deve renderizar estado de loading quando dados do projeto ainda não existem', () => {
    mockUseProject.mockReturnValue({
      project: null,
      activeScenario: null,
      activeResult: null,
      allResults: null,
    });

    render(
      <MemoryRouter>
        <ProjectReport />
      </MemoryRouter>
    );

    expect(screen.getByText(/Carregando Relatório/i)).toBeInTheDocument();
  });
});

