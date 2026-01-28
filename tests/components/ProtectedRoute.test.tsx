import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../src/components/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('deve renderizar estado de loading quando isLoading=true', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute user={null} isLoading />}>
            <Route path="/" element={<div>Área protegida</div>} />
          </Route>
          <Route path="/login" element={<div>Tela de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Área protegida')).not.toBeInTheDocument();
    expect(screen.queryByText('Tela de Login')).not.toBeInTheDocument();
    // Indicador visual do loading (classe usada no componente)
    expect(container.querySelector('.animate-\\[loading_1\\.5s_infinite_linear\\]')).toBeTruthy();
  });

  it('deve redirecionar para /login quando user=null', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute user={null} />}>
            <Route path="/" element={<div>Área protegida</div>} />
          </Route>
          <Route path="/login" element={<div>Tela de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Tela de Login')).toBeInTheDocument();
  });

  it('deve renderizar o Outlet quando user está autenticado', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            element={
              <ProtectedRoute
                user={{ id: 'u1', name: 'User', email: 'u@x.com', plan: 'Free' }}
              />
            }
          >
            <Route path="/" element={<div>Área protegida</div>} />
          </Route>
          <Route path="/login" element={<div>Tela de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Área protegida')).toBeInTheDocument();
  });
});

