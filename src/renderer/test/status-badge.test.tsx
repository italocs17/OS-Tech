import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/shared/status-badge';

describe('StatusBadge', () => {
  it('renderiza o status ABERTA', () => {
    render(<StatusBadge status="ABERTA" />);
    expect(screen.getByText('ABERTA')).toBeInTheDocument();
  });

  it('renderiza EM_DIAGNOSTICO com underscores', () => {
    render(<StatusBadge status="EM_DIAGNOSTICO" />);
    expect(screen.getByText('EM DIAGNOSTICO')).toBeInTheDocument();
  });

  it('aplica classe de cor para status conhecido', () => {
    render(<StatusBadge status="CONCLUIDA" />);
    const badge = screen.getByText('CONCLUIDA');
    expect(badge.className).toContain('bg-green-100');
  });

  it('usa classe gray para status desconhecido', () => {
    render(<StatusBadge status="DESCONHECIDO" />);
    const badge = screen.getByText('DESCONHECIDO');
    expect(badge.className).toContain('bg-gray-100');
  });
});
