import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ToastProvider } from '../src/context/ToastContext';

const {
  getProjectsMock,
  getConstantsMock,
  createProjectMock,
  updateProjectMock,
  importXlsxMock,
} = vi.hoisted(() => ({
  getProjectsMock: vi.fn(),
  getConstantsMock: vi.fn(),
  createProjectMock: vi.fn(),
  updateProjectMock: vi.fn(),
  importXlsxMock: vi.fn(),
}));

const { mockShowToast } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
}));

vi.mock('../services/apiService', () => {
  return {
    ApiService: {
      getProjects: (...args: any[]) => getProjectsMock(...args),
      getConstants: (...args: any[]) => getConstantsMock(...args),
      createProject: (...args: any[]) => createProjectMock(...args),
      updateProject: (...args: any[]) => updateProjectMock(...args),
      importXlsx: (...args: any[]) => importXlsxMock(...args),
    },
  };
});

vi.mock('../src/context/ToastContext', async () => {
  const actual = await vi.importActual<any>('../src/context/ToastContext');
  return {
    ...actual,
    useToast: () => ({
      showToast: mockShowToast,
    }),
  };
});

vi.mock('../services/electricalWorkerClient', () => {
  return {
    ElectricalWorkerClient: {
      calculateScenario: vi.fn().mockResolvedValue({
        scenarioId: 'mock',
        nodes: [],
        kpis: {
          totalLoad: 0,
          diversifiedLoad: 0,
          pointLoad: 0,
          ipLoad: 0,
          trafoOccupation: 0,
          maxCqt: 0,
          totalCustomers: 0,
          globalDmdiFactor: 0,
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
      }),
      runMonteCarlo: vi.fn(),
    },
  };
});

import { useProjectManagement } from '../src/hooks/useProjectManagement';

describe('useProjectManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Evita interferência entre casos: /welcome e energia default
    localStorage.clear();
  });

  it('não deve disparar loop de sincronização de projetos (dedup em StrictMode)', async () => {
    // Mantém a 1ª chamada "em voo" tempo suficiente para capturar o duplo-invoke do StrictMode.
    getProjectsMock.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({}), 25)));
    getConstantsMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ cables: {}, ipTypes: {}, dmdiTables: {}, profiles: {} }), 25)
        )
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <React.StrictMode>
        <ToastProvider>{children}</ToastProvider>
      </React.StrictMode>
    );

    renderHook(() => useProjectManagement(), { wrapper });

    await waitFor(() => {
      expect(getProjectsMock).toHaveBeenCalledTimes(1);
      expect(getConstantsMock).toHaveBeenCalledTimes(1);
    });
  });

  it('deve criar projeto e chamar ApiService.createProject (fluxo criar)', async () => {
    getProjectsMock.mockResolvedValue({});
    getConstantsMock.mockResolvedValue({ cables: { C1: { r: 0, x: 0, coef: 0, ampacity: 100 } }, ipTypes: { 'Sem IP': 0 }, dmdiTables: {}, profiles: {} });
    createProjectMock.mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useProjectManagement(), { wrapper });

    await waitFor(() => {
      expect(getProjectsMock).toHaveBeenCalledTimes(1);
      expect(getConstantsMock).toHaveBeenCalledTimes(1);
    });

    let newId = '';
    await act(async () => {
      newId = await result.current.createProject('Meu Estudo', 'SOB-1', 'PE-1', -22.9, -43.1);
    });

    expect(newId).toBeTruthy();
    expect(createProjectMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(Object.keys(result.current.savedProjects)).toContain(newId);
    });
  });

  it('deve atualizar projeto atual e chamar ApiService.updateProject (fluxo editar)', async () => {
    const prj = {
      id: 'PRJ-1',
      name: 'Projeto 1',
      metadata: { sob: 'S1', electricPoint: 'PE', lat: -22.9, lng: -43.1 },
      scenarios: [
        {
          id: 'SCN-1',
          name: 'CENÁRIO 1',
          updatedAt: new Date().toISOString(),
          params: { trafoKva: 75, profile: 'Massivos', classType: 'Automatic', manualClass: 'A', normativeTable: 'NBR' },
          nodes: [],
        },
      ],
      activeScenarioId: 'SCN-1',
      updatedAt: new Date().toISOString(),
      cables: { C1: { r: 0, x: 0, coef: 0, ampacity: 100 } },
      ipTypes: { 'Sem IP': 0 },
      reportConfig: {
        showJustification: false,
        showKpis: false,
        showTopology: false,
        showMaterials: false,
        showSignatures: false,
        showUnifilar: false,
        showComparison: false,
      },
    };

    getProjectsMock.mockResolvedValue({ [prj.id]: prj } as any);
    getConstantsMock.mockResolvedValue({ cables: prj.cables, ipTypes: prj.ipTypes, dmdiTables: {}, profiles: {} });
    updateProjectMock.mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>;
    const { result, unmount } = renderHook(() => useProjectManagement(), { wrapper });

    await waitFor(() => {
      expect(getProjectsMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setCurrentProjectId(prj.id);
    });

    act(() => {
      result.current.updateProject({ name: 'Projeto 1 (editado)' } as any);
    });

    expect(updateProjectMock).toHaveBeenCalledTimes(1);
    expect(updateProjectMock).toHaveBeenCalledWith(prj.id, { name: 'Projeto 1 (editado)' });

    // Evita efeitos pendentes de cálculo pós-teste
    unmount();
  });

  it('deve importar XLSX e atualizar savedProjects (fluxo importar)', async () => {
    getProjectsMock.mockResolvedValue({});
    getConstantsMock.mockResolvedValue({ cables: { C1: { r: 0, x: 0, coef: 0, ampacity: 100 } }, ipTypes: { 'Sem IP': 0 }, dmdiTables: {}, profiles: {} });

    const importedProject = {
      id: 'PRJ-IMP',
      name: 'Importado',
      metadata: { sob: 'S-IMP', electricPoint: 'PE', lat: -22.9, lng: -43.1 },
      scenarios: [],
      activeScenarioId: '',
      updatedAt: new Date().toISOString(),
      cables: { C1: { r: 0, x: 0, coef: 0, ampacity: 100 } },
      ipTypes: { 'Sem IP': 0 },
      reportConfig: {
        showJustification: false,
        showKpis: false,
        showTopology: false,
        showMaterials: false,
        showSignatures: false,
        showUnifilar: false,
        showComparison: false,
      },
    };

    importXlsxMock.mockResolvedValue({ projectId: importedProject.id, project: importedProject });

    const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useProjectManagement(), { wrapper });

    await waitFor(() => {
      expect(getProjectsMock).toHaveBeenCalledTimes(1);
    });

    const file = new File(['dummy'], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    let importedId = '';
    await act(async () => {
      importedId = await (result.current as any).importXlsxProject(file);
    });

    expect(importedId).toBe(importedProject.id);
    expect(importXlsxMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(Object.keys(result.current.savedProjects)).toContain(importedProject.id);
    });
  });
});

