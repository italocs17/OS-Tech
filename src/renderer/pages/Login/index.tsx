import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FormField } from '../../components/shared/form-field';

export function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ login: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.login, form.senha);
    } catch (err) {
      console.error('[Login]', err);
      setError(err instanceof Error ? err.message : 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="text-3xl">🔧</span>
          <h1 className="mt-2 text-xl font-bold">OS.Tech</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestão de Assistência Técnica
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Login" required>
            <input
              type="text"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Digite seu login"
              required
            />
          </FormField>

          <FormField label="Senha" required>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Digite sua senha"
              required
            />
          </FormField>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
