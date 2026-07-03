import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/shared/modal';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigModal({ open, onClose }: ConfigModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [error, setError] = useState('');

  const { data: config } = useQuery({
    queryKey: ['email-config'],
    queryFn: () => window.osTech.email.configGet() as Promise<{ email: string; appPassword: string } | null>,
    enabled: open,
  });

  useEffect(() => {
    if (config) {
      setEmail(config.email);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: { email: string; appPassword: string }) =>
      window.osTech.email.configSave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.message || 'Erro ao salvar configuracao');
    },
  });

  const handleSave = () => {
    if (!email || !appPassword) {
      setError('Preencha todos os campos');
      return;
    }
    setError('');
    saveMutation.mutate({ email, appPassword });
  };

  return (
    <Modal open={open} title="Configuração de E-mail" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Use uma senha de app do Google (requer 2FA ativado). 
          Crie em: <strong>myaccount.google.com/apppasswords</strong>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="suporte.ostech@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Senha de App</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Senha de 16 caracteres"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
