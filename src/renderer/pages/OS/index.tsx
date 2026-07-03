import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { StatusBadge } from '../../components/shared/status-badge';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { SearchInput } from '../../components/shared/search-input';
import { OSForm } from '../../components/forms/os-form';
import { formatDate } from '../../lib/utils';

interface OSRow {
  id: number;
  numeroOS: string;
  tipoAtendimento: string;
  status: string;
  dataEntrada: string | Date;
  cliente?: { nome: string };
  equipamento?: { marca: string; modelo: string };
}

export function OSPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: osList, isLoading } = useQuery({
    queryKey: ['os-list'],
    queryFn: () => window.osTech.os.list(),
  });

  const columns: Column<OSRow>[] = [
    { key: 'numeroOS', header: 'Nº OS' },
    {
      key: 'tipoAtendimento',
      header: 'Tipo',
      render: (item) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          item.tipoAtendimento === 'INTERNO'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-orange-100 text-orange-700'
        }`}>
          {item.tipoAtendimento === 'INTERNO' ? 'Interno' : 'Externo'}
        </span>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (item) => item.cliente?.nome ?? '-',
    },
      {
        key: 'equipamento',
        header: 'Equipamento',
        render: (item) =>
          item.equipamento
            ? `${item.equipamento?.marca ?? ''} ${item.equipamento?.modelo ?? ''}`.trim()
            : 'ND',
      },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'dataEntrada',
      header: 'Entrada',
      render: (item) => formatDate(item.dataEntrada),
    },
  ];

  const data = Array.isArray(osList) ? osList : [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (o: OSRow) =>
        o.numeroOS.toLowerCase().includes(q) ||
        (o.cliente?.nome ?? '').toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Serviço"
        description={`${filtered.length} de ${data.length} OS`}
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Nova OS
          </button>
        }
      />
      <SearchInput
        placeholder="Buscar por nº OS ou cliente..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhuma OS cadastrada"
        onRowClick={(item) => navigate(`/os/${item.id}`)}
      />

      <Modal
        open={modalOpen}
        title="Nova Ordem de Serviço"
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <OSForm onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
