import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../components/shared/modal';

describe('Modal', () => {
  it('renderiza quando aberto', () => {
    render(
      <Modal open={true} title="Teste" onClose={vi.fn()}>
        <p>Conteudo</p>
      </Modal>
    );
    expect(screen.getByText('Teste')).toBeInTheDocument();
    expect(screen.getByText('Conteudo')).toBeInTheDocument();
  });

  it('nao renderiza quando fechado', () => {
    render(
      <Modal open={false} title="Teste" onClose={vi.fn()}>
        <p>Conteudo</p>
      </Modal>
    );
    expect(screen.queryByText('Teste')).not.toBeInTheDocument();
  });

  it('chama onClose ao clicar no X', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} title="Teste" onClose={onClose}>
        <p>Conteudo</p>
      </Modal>
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('chama onClose ao pressionar Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} title="Teste" onClose={onClose}>
        <p>Conteudo</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
