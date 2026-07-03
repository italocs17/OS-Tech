import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from '../components/shared/data-table';

interface TestItem {
  id: number;
  nome: string;
  valor: number;
}

const columns: Column<TestItem>[] = [
  { key: 'id', header: 'ID' },
  { key: 'nome', header: 'Nome' },
  {
    key: 'valor',
    header: 'Valor',
    render: (item) => `R$ ${item.valor}`,
  },
];

const data: TestItem[] = [
  { id: 1, nome: 'Item A', valor: 100 },
  { id: 2, nome: 'Item B', valor: 200 },
];

describe('DataTable', () => {
  it('renderiza cabecalhos', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} />
    );
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('renderiza linhas de dados', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} />
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('R$ 100')).toBeInTheDocument();
  });

  it('mostra mensagem de vazio quando sem dados', () => {
    render(
      <DataTable columns={columns} data={[]} keyExtractor={(item) => item.id} />
    );
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });

  it('chama onRowClick ao clicar na linha', () => {
    const onClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        onRowClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('Item A'));
    expect(onClick).toHaveBeenCalledWith(data[0]);
  });

  it('mostra mensagem de vazio customizada', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="Nada aqui"
      />
    );
    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
  });
});
