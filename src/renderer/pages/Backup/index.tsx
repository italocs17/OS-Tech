import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/page-header';
import { DataTable } from '../../components/shared/data-table';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { Modal } from '../../components/shared/modal';
import { LoadingSpinner } from '../../components/shared/loading-spinner';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '@/lib/auth-context';

interface BackupEntry {
  filename: string;
  size: number;
  date: string;
  type: string;
}

export function BackupPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [resultModal, setResultModal] = useState<{ title: string; message: string; success: boolean } | null>(null);
  const usuarioId = user?.id ?? 1;

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => window.osTech.backup.list() as Promise<BackupEntry[]>,
  });

  const createBackupMutation = useMutation({
    mutationFn: (type: 'auto' | 'manual') => window.osTech.backup.create(usuarioId, type),
    onSuccess: (path: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setResultModal({
        title: 'Backup criado',
        message: `Arquivo salvo em: ${String(path).replace(/\\/g, '\\\u200B')}`,
        success: true,
      });
    },
    onError: (err: Error) => {
      setResultModal({
        title: 'Erro ao criar backup',
        message: err.message,
        success: false,
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (filename: string) => window.osTech.backup.restore(filename, usuarioId),
    onSuccess: () => {
      setRestoreTarget(null);
      setResultModal({
        title: 'Restauração concluída',
        message: 'Banco de dados restaurado com sucesso. Reinicie a aplicação.',
        success: true,
      });
    },
    onError: (err: Error) => {
      setRestoreTarget(null);
      setResultModal({
        title: 'Erro na restauração',
        message: err.message,
        success: false,
      });
    },
  });

  const backupList = Array.isArray(backups) ? backups : [];

  const columns = [
    { key: 'filename', header: 'Arquivo' },
    {
      key: 'size',
      header: 'Tamanho',
      render: (item: BackupEntry) => {
        const kb = item.size / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
      },
    },
    {
      key: 'date',
      header: 'Data',
      render: (item: BackupEntry) => formatDateTime(item.date),
    },
    { key: 'type', header: 'Tipo' },
    {
      key: 'acoes',
      header: 'Ações',
      render: (item: BackupEntry) => (
        <button
          onClick={(e) => { e.stopPropagation(); setRestoreTarget(item); }}
          className="rounded-lg border px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          Restaurar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Restore"
        description="Gerencie backups do banco de dados"
      />

      <div className="flex gap-3">
        <button
          onClick={() => createBackupMutation.mutate('manual')}
          disabled={createBackupMutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createBackupMutation.isPending ? 'Criando...' : 'Criar Backup Manual'}
        </button>
        <button
          onClick={() => createBackupMutation.mutate('auto')}
          disabled={createBackupMutation.isPending}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          Backup Automático
        </button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium">Backups Realizados</h3>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            columns={columns}
            data={backupList}
            keyExtractor={(item: BackupEntry) => item.filename}
            emptyMessage="Nenhum backup encontrado"
          />
        )}
      </div>

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restaurar Backup"
        description={`Tem certeza que deseja restaurar o backup "${restoreTarget?.filename}"? O banco atual será sobrescrito após uma cópia de segurança.`}
        confirmLabel="Restaurar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => restoreTarget && restoreMutation.mutate(restoreTarget.filename)}
        onCancel={() => setRestoreTarget(null)}
      />

      <Modal
        open={!!resultModal}
        title={resultModal?.title ?? ''}
        onClose={() => setResultModal(null)}
        size="md"
      >
        <div className="space-y-4">
          <p className={`text-sm break-all ${resultModal?.success ? 'text-green-600' : 'text-destructive'}`}>
            {resultModal?.message}
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setResultModal(null)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Ok
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
