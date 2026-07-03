import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '../components/shared/form-field';

describe('FormField', () => {
  it('renderiza label e children', () => {
    render(
      <FormField label="Nome">
        <input />
      </FormField>
    );
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('mostra asterisco quando required', () => {
    render(
      <FormField label="Nome" required>
        <input />
      </FormField>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('mostra mensagem de erro', () => {
    render(
      <FormField label="Nome" error="Campo obrigatorio">
        <input />
      </FormField>
    );
    expect(screen.getByText('Campo obrigatorio')).toBeInTheDocument();
  });

  it('nao mostra erro quando ausente', () => {
    render(
      <FormField label="Nome">
        <input />
      </FormField>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
