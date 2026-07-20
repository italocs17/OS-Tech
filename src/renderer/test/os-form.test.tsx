import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OSForm } from '../components/forms/os-form';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, nome: 'Admin', perfil: 'PROPRIETARIO' },
    isProprietario: true,
    isGestor: false,
    hasAccessToCategoria: () => true,
    getCategoriasIds: () => [],
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('OSForm', () => {
  beforeEach(() => {
    vi.stubGlobal('osTech', {
      client: {
        list: vi.fn().mockResolvedValue([{ id: 1, nome: 'João', cpf: '529.982.247-25' }]),
      },
      equipment: {
        listByClient: vi.fn().mockResolvedValue([{ id: 1, etiqueta: 'ABC12', marca: 'Dell', modelo: 'Inspiron', clienteId: 1 }]),
      },
      email: {
        listContatos: vi.fn().mockResolvedValue([]),
      },
      categoriaServico: {
        list: vi.fn().mockResolvedValue([{ id: 1, nome: 'Bancada' }]),
      },
      os: {
        create: vi.fn().mockResolvedValue({ id: 1, numeroOS: '2026/06/001' }),
      },
    });
  });

  it('renderiza campos obrigatorios', async () => {
    render(<OSForm onClose={vi.fn()} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Cliente')).toBeInTheDocument());
    expect(screen.getByText('Equipamento')).toBeInTheDocument();
    expect(screen.getByText('Observações')).toBeInTheDocument();
  });

  it('mostra erros de validacao ao submeter sem selecao', async () => {
    render(<OSForm onClose={vi.fn()} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Cliente')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Abrir OS'));
    expect(screen.getByText('Selecione um cliente')).toBeInTheDocument();
  });
});
