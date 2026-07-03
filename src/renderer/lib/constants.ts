/**
 * OS.Tech - Constantes da Aplicação
 * Valores fixos reutilizáveis em todo o sistema.
 */

export const APP_NAME = 'OS.Tech';
declare const __APP_VERSION__: string;
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export const STATUS_OS: { value: string; label: string; color: string }[] = [
  { value: 'ABERTA', label: 'Aberta', color: 'blue' },
  { value: 'EM_DIAGNOSTICO', label: 'Em Diagnóstico', color: 'yellow' },
  { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação', color: 'orange' },
  { value: 'AGUARDANDO_PECA', label: 'Aguardando Peça', color: 'purple' },
  { value: 'EM_EXECUCAO', label: 'Em Execução', color: 'cyan' },
  { value: 'CONCLUIDA', label: 'Concluída', color: 'green' },
  { value: 'ENTREGUE', label: 'Entregue', color: 'emerald' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'red' },
];
