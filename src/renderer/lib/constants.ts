/**
 * OS.Tech - Constantes da Aplicação
 * Valores fixos reutilizáveis em todo o sistema.
 */

export const APP_NAME = 'OS.Tech';
declare const __APP_VERSION__: string;
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export const STATUS_OS: { value: string; label: string; color: string }[] = [
  { value: 'AGUARDANDO_ATENDIMENTO', label: 'Aguardando Atendimento', color: 'blue' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento', color: 'yellow' },
  { value: 'PAUSADO', label: 'Pausado', color: 'orange' },
  { value: 'CONCLUIDA', label: 'Concluída', color: 'green' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'red' },
];

export const STATUS_LOGISTICO: { value: string; label: string; color: string }[] = [
  { value: 'PENDENTE', label: 'Pendente', color: 'gray' },
  { value: 'RECEBIDO', label: 'Recebido', color: 'blue' },
  { value: 'ENTREGUE', label: 'Entregue', color: 'green' },
];
