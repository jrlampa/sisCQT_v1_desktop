import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectHub from '../../src/components/ProjectHub';

const { mockShowToast } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
}));

const {
  mockUseProject,
  createProjectMock,
  importXlsxProjectMock,
  createWelcomeProjectMock,
  updateProjectMock,
  deleteProjectMock,
  duplicateProjectMock,
  setCurrentProjectIdMock,
} = vi.hoisted(() => ({
  mockUseProject: vi.fn(),
  createProjectMock: vi.fn(),
  importXlsxProjectMock: vi.fn(),
  createWelcomeProjectMock: vi.fn(),
  updateProjectMock: vi.fn(),
  deleteProjectMock: vi.fn(),
  duplicateProjectMock: vi.fn(),
  setCurrentProjectIdMock: vi.fn(),
}));

vi.mock('@/src/context/ToastContext.tsx', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('@/src/context/ProjectContext', () => ({
  useProject: () => mockUseProject(),
}));

function makeProject(id: string, name: string, sob: string) {
  return {
    id,
    name,
    metadata: { sob, electricPoint: 'PE', lat: -22.9, lng: -43.1, city: 'Rio de Janeiro', district: '' },
    scenarios: [],
    activeScenarioId: '',
    updatedAt: new Date().toISOString(),
    cables: {},
    ipTypes: {},
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
}

describe('ProjectHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockUseProject.mockReturnValue({
      savedProjects: { P1: makeProject('P1', 'Projeto A', 'SOB-A') },
      createProject: createProjectMock,
      importXlsxProject: importXlsxProjectMock,
      createWelcomeProject: createWelcomeProjectMock,
      updateProject: updateProjectMock,
      deleteProject: deleteProjectMock,
      duplicateProject: duplicateProjectMock,
      setCurrentProjectId: setCurrentProjectIdMock,
    });
  });

  it('deve validar formulário (campos obrigatórios) e mostrar toast warning', async () => {
    render(
      <MemoryRouter>
        <ProjectHub
          user={{ id: 'u1', name: 'User', email: 'u@x.com', plan: 'Free' }}
          onLogout={() => {}}
          onBilling={() => {}}
          onSelectProject={() => {}}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Projeto/i }));

    // Preenche apenas SOB e deixa título vazio
    fireEvent.change(screen.getByLabelText('SOB / ID'), { target: { value: 'SOB-123' } });
    fireEvent.click(screen.getByRole('button', { name: /Inicializar Workspace/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Preencha os campos obrigatórios', 'warning');
    });

    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it('deve criar projeto via createProject (fluxo criar)', async () => {
    createProjectMock.mockResolvedValue('PRJ-NEW');

    render(
      <MemoryRouter>
        <ProjectHub
          user={{ id: 'u1', name: 'User', email: 'u@x.com', plan: 'Free' }}
          onLogout={() => {}}
          onBilling={() => {}}
          onSelectProject={() => {}}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Projeto/i }));

    fireEvent.change(screen.getByLabelText('SOB / ID'), { target: { value: 'SOB-999' } });
    fireEvent.change(screen.getByLabelText('Título do Estudo'), { target: { value: 'Meu Estudo' } });
    fireEvent.click(screen.getByRole('button', { name: /Inicializar Workspace/i }));

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledTimes(1);
    });

    // Lat/Lng ainda não têm inputs no modal; hoje chegam como NaN.
    expect(createProjectMock).toHaveBeenCalledWith('Meu Estudo', 'SOB-999', '', NaN, NaN);
    await waitFor(() => {
      expect(screen.queryByText(/Configurar Novo Estudo/i)).not.toBeInTheDocument();
    });
  });

  it('deve importar XLSX e selecionar projeto (fluxo importar)', async () => {
    importXlsxProjectMock.mockResolvedValue('PRJ-IMP-1');
    const onSelectProject = vi.fn();

    render(
      <MemoryRouter>
        <ProjectHub
          user={{ id: 'u1', name: 'User', email: 'u@x.com', plan: 'Free' }}
          onLogout={() => {}}
          onBilling={() => {}}
          onSelectProject={onSelectProject}
        />
      </MemoryRouter>
    );

    const input = screen.getByLabelText('Importar arquivo KML/KMZ/XLSX') as HTMLInputElement;
    const file = new File(['dummy'], 'rede.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(importXlsxProjectMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Importação XLSX concluída!', 'success');
      expect(setCurrentProjectIdMock).toHaveBeenCalledWith('PRJ-IMP-1');
      expect(onSelectProject).toHaveBeenCalledWith('PRJ-IMP-1');
    });
  });
});

