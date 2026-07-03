import { useState, useRef, useCallback, type ChangeEvent } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  placeholder?: string;
  mode?: 'cents' | 'decimal';
}

function formatBRL(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisStr = reais.toLocaleString('pt-BR');
  return `${reaisStr},${String(centavos).padStart(2, '0')}`;
}

function formatDecimal(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrencyInput({ value, onChange, className = '', min = 0, placeholder, mode = 'cents' }: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => {
    if (mode === 'decimal') {
      return value > 0 ? formatDecimal(value) : '';
    }
    const cents = Math.round(value * 100);
    return cents > 0 ? formatBRL(cents) : '';
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const toCents = useCallback((val: string): number => {
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (mode === 'decimal') {
      const cleaned = raw.replace(/[^\d,]/g, '');
      const parts = cleaned.split(',');
      let formatted = parts[0];
      if (parts.length > 1) {
        formatted += ',' + parts[1].slice(0, 2);
      }
      setDisplay(formatted);
      const num = parseFloat(formatted.replace(',', '.')) || 0;
      onChange(num);
      return;
    }

    const digits = raw.replace(/\D/g, '');
    if (digits === '') {
      setDisplay('');
      onChange(0);
      return;
    }
    const cents = parseInt(digits, 10);
    setDisplay(formatBRL(cents));
    onChange(cents / 100);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (mode === 'decimal') {
      const num = parseFloat(display.replace(',', '.')) || 0;
      if (num > 0) setDisplay(String(num).replace('.', ','));
      return;
    }
    const cents = toCents(display);
    if (cents > 0) {
      setDisplay(String(cents));
    } else {
      setDisplay('');
    }
  };

  const handleBlur = () => {
    if (mode === 'decimal') {
      const num = parseFloat(display.replace(',', '.')) || 0;
      setDisplay(num > 0 ? formatDecimal(num) : '');
      return;
    }
    const cents = toCents(display);
    if (cents > 0) {
      setDisplay(formatBRL(cents));
    } else {
      setDisplay('');
    }
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode={mode === 'decimal' ? 'decimal' : 'numeric'}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder ?? '0,00'}
        className={`w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      />
    </div>
  );
}
