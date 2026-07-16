import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientForm } from '../components/forms/client-form';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, nome: 'Admin', perfil: 'PROPRIETARIO' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ClientForm', () => {
  beforeEach(() => {
    vi.stubGlobal('osTech', {
      client: {
        create: vi.fn().mockResolvedValue({ id: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
      },
    });
  });

  it('renderiza campos obrigatorios', () => {
    render(<ClientForm onClose={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('CPF/CNPJ')).toBeInTheDocument();
    expect(screen.getByText('RG')).toBeInTheDocument();
    expect(screen.getAllByText('Telefone').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('mostra erros de validacao ao submeter vazio', () => {
    render(<ClientForm onClose={vi.fn()} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText('Cadastrar'));
    expect(screen.getByText('Nome e obrigatorio')).toBeInTheDocument();
    expect(screen.getByText('CPF/CNPJ e obrigatorio')).toBeInTheDocument();
  });

  it('renderiza dados do cliente no modo edicao', () => {
    const client = {
      id: 1, nome: 'João', cpfCnpj: '529.982.247-25',
      rg: '1234567', telefone: '11912345678',
      email: 'joao@teste.com', endereco: 'Rua A',
      observacoes: 'Obs', dataCadastro: new Date(), ativo: true,
      whatsapp: null,
    };
    render(<ClientForm client={client} onClose={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByDisplayValue('João')).toBeInTheDocument();
    expect(screen.getByDisplayValue('529.982.247-25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rua A')).toBeInTheDocument();
  });

  it('chama create ao submeter dados validos', async () => {
    render(<ClientForm onClose={vi.fn()} />, { wrapper: createWrapper() });

    const nomeInput = screen.getAllByRole('textbox')[0];
    const cpfInput = screen.getAllByRole('textbox')[1];

    await act(async () => {
      fireEvent.change(nomeInput, { target: { value: 'Maria' } });
    });
    await act(async () => {
      fireEvent.change(cpfInput, { target: { value: '529' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Cadastrar'));
    });

    await waitFor(() => {
      expect(window.osTech.client.create).toHaveBeenCalledOnce();
    });
  });
});
