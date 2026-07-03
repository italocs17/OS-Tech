import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentForm } from '../components/forms/equipment-form';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nome: 'Admin', perfil: 'PROPRIETARIO' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('EquipmentForm', () => {
  beforeEach(() => {
    vi.stubGlobal('osTech', {
      client: {
        list: vi.fn().mockResolvedValue([{ id: 1, nome: 'João', cpf: '529.982.247-25' }]),
      },
      equipment: {
        create: vi.fn().mockResolvedValue({ id: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
      },
    });
  });

  it('renderiza campos obrigatorios', async () => {
    render(<EquipmentForm onClose={vi.fn()} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Cliente')).toBeInTheDocument());
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Marca')).toBeInTheDocument();
    expect(screen.getByText('Modelo')).toBeInTheDocument();
  });

  it('mostra erros de validacao ao submeter vazio', async () => {
    render(<EquipmentForm onClose={vi.fn()} />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText('Cliente')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cadastrar'));
    expect(screen.getByText('Selecione um cliente')).toBeInTheDocument();
    expect(screen.getByText('Tipo é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Marca é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Modelo é obrigatório')).toBeInTheDocument();
  });

  it('renderiza dados do equipamento no modo edicao', async () => {
    const equipment = {
      id: 1, clienteId: 1, etiqueta: 'ABC12',
      tipo: 'Notebook', marca: 'Dell', modelo: 'Inspiron',
      numeroSerie: 'SN123', observacoes: 'Teste',
      dataCadastro: new Date(), ativo: true,
    };
    render(<EquipmentForm equipment={equipment} onClose={vi.fn()} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Dell')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Inspiron')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SN123')).toBeInTheDocument();
  });
});
