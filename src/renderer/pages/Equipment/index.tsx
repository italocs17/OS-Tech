import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable, type Column } from '../../components/shared/data-table';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { Modal } from '../../components/shared/modal';
import { SearchInput } from '../../components/shared/search-input';
import { EquipmentForm } from '../../components/forms/equipment-form';
import { formatDate } from '../../lib/utils';
import type { Equipamento } from '@shared/types/entities.types';

interface EquipmentRow {
  id: number;
  etiqueta: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string | null;
  dataCadastro: string | Date;
}

export function EquipmentPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipamento | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => window.osTech.equipment.list(),
  });

  const columns: Column<EquipmentRow>[] = [
    { key: 'etiqueta', header: 'Etiqueta' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'marca', header: 'Marca' },
    { key: 'modelo', header: 'Modelo' },
    { key: 'numeroSerie', header: 'Nº Série' },
    {
      key: 'dataCadastro',
      header: 'Cadastro',
      render: (item) => formatDate(item.dataCadastro),
    },
  ];

  const data = Array.isArray(equipment) ? equipment : [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (e: EquipmentRow) =>
        e.etiqueta.toLowerCase().includes(q) ||
        (e.numeroSerie ?? '').toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (isLoading) return <LoadingSpinner />;

  const handleNew = () => {
    setEditingEquipment(null);
    setModalOpen(true);
  };

  const handleEdit = (item: EquipmentRow) => {
    const full = (equipment as Equipamento[]).find((e) => e.id === item.id);
    if (full) {
      setEditingEquipment(full);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipamentos"
        description={`${filtered.length} de ${data.length} equipamentos`}
        actions={
          <button
            onClick={handleNew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Novo Equipamento
          </button>
        }
      />
      <SearchInput
        placeholder="Buscar por etiqueta ou nº série..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhum equipamento cadastrado"
        onRowClick={handleEdit}
      />

      <Modal
        open={modalOpen}
        title={editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <EquipmentForm equipment={editingEquipment ?? undefined} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
