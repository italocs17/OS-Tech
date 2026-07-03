import { useState, type FormEvent } from 'react';
import { Modal } from './modal';
import { FormField } from './form-field';

interface ChangePasswordModalProps {
  userId: number;
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ userId, open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }
    if (newPassword.length < 6) {
      setError('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Confirmação de senha não confere');
      return;
    }

    setLoading(true);
    try {
      await window.osTech.user.changePassword(userId, currentPassword, newPassword);
      onClose();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Alterar Senha" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Senha Atual">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        <FormField label="Nova Senha">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            minLength={6}
          />
        </FormField>

        <FormField label="Confirmar Nova Senha">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            minLength={6}
          />
        </FormField>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Alterando...' : 'Alterar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
