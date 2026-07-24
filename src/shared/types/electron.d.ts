/**
 * OS.Tech - Tipagens para o objeto global window.osTech
 * Declara as APIs expostas pelo preload script ao renderer.
 */

import type { LogFiltros } from '../../main/services/log.service';

export interface ClientAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
  setContatoPadrao: (clienteId: number, contatoId: number) => Promise<unknown>;
}

export interface EquipmentAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  listByClient: (clienteId: number) => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  getByTag: (etiqueta: string) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

export interface OSAPI {
  list: () => Promise<unknown>;
  listByClient: (clienteId: number) => Promise<unknown>;
  listByPeriod: (dataInicio: string, dataFim: string) => Promise<unknown>;
  listByEquipamento: (equipamentoId: number) => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown, usuarioId: number) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
  changeStatus: (id: number, status: string, usuarioId: number, motivo?: string) => Promise<unknown>;
  pausar: (id: number, justificativa: string, usuarioId: number) => Promise<unknown>;
  retomar: (id: number, justificativa: string, usuarioId: number) => Promise<unknown>;
  changeLogisticoStatus: (id: number, status: string, usuarioId: number) => Promise<unknown>;
  addEvent: (data: unknown) => Promise<unknown>;
  addItem: (data: unknown) => Promise<unknown>;
  removeItem: (id: number) => Promise<unknown>;
  getItens: (osId: number) => Promise<unknown>;
  getEventos: (osId: number) => Promise<unknown>;
  calcularTotal: (osId: number) => Promise<unknown>;
  countByStatus: () => Promise<unknown>;
}

export interface UserAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
  login: (login: string, senha: string) => Promise<unknown>;
  changePassword: (id: number, currentPassword: string, newPassword: string) => Promise<void>;
}

export interface InventoryAPI {
  get: (osId: number) => Promise<unknown>;
  list: () => Promise<unknown>;
  saveManual: (osId: number, data: unknown, usuarioId: number) => Promise<unknown>;
  listByOs: (osId: number) => Promise<unknown>;
  listByEquipamento: (equipamentoId: number) => Promise<unknown>;
}

export interface BackupAPI {
  create: (usuarioId: number, type: 'auto' | 'manual') => Promise<unknown>;
  list: () => Promise<unknown>;
  restore: (filename: string, usuarioId: number) => Promise<unknown>;
}

export interface ReportAPI {
  generate: (type: string, osId: number) => Promise<string>;
  financial: (dataInicio: string, dataFim: string, modo?: string) => Promise<string>;
  osByPeriod: (dataInicio: string, dataFim: string, modo?: string) => Promise<string>;
  byClient: (clienteId: number, dataInicio?: string, dataFim?: string, modo?: string) => Promise<string>;
  byEquipment: (equipamentoId: number, dataInicio?: string, dataFim?: string, modo?: string) => Promise<string>;
  osByStatus: (status: string, dataInicio: string, dataFim: string, modo?: string) => Promise<string>;
  servicosRealizados: (dataInicio: string, dataFim: string, modo?: string) => Promise<string>;
  pecasUtilizadas: (dataInicio: string, dataFim: string, modo?: string) => Promise<string>;
  clientesRecorrentes: (dataInicio: string, dataFim: string, modo?: string) => Promise<string>;
  save: (type: string, osId: number) => Promise<string | undefined>;
}

export interface LogAPI {
  list: (filtros?: LogFiltros) => Promise<unknown>;
  export: (formato: 'csv' | 'json', filtros?: LogFiltros) => Promise<string>;
}

export interface EmailAPI {
  list: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  checkMail: (usuarioId: number) => Promise<unknown>;
  linkClient: (data: unknown) => Promise<unknown>;
  convertToOS: (data: unknown) => Promise<unknown>;
  reject: (id: number, usuarioId: number, motivo?: string) => Promise<unknown>;
  revisar: (id: number, usuarioId: number) => Promise<unknown>;
  conciliar: (solicitacaoOrigemId: number, solicitacaoDestinoId: number, usuarioId: number) => Promise<unknown>;
  configGet: () => Promise<unknown>;
  configSave: (config: unknown) => Promise<unknown>;
  listByStatus: (status: string) => Promise<unknown>;
  countPending: () => Promise<unknown>;
  listContatos: (clienteId: number) => Promise<unknown>;
  listAllContatos: (clienteId: number) => Promise<unknown>;
  createContato: (data: unknown) => Promise<unknown>;
  updateContato: (id: number, data: unknown) => Promise<unknown>;
  deleteContato: (id: number) => Promise<unknown>;
  listAttachments: (emailSolicitacaoId: number) => Promise<unknown>;
  listAttachmentsByOs: (osId: number) => Promise<unknown>;
}

export interface ServicoAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

export interface CategoriaServicoAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

export interface SubcategoriaServicoAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  getByCategoria: (categoriaId: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

export interface EquipeAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
  addUsuario: (equipeId: number, usuarioId: number) => Promise<unknown>;
  removeUsuario: (equipeId: number, usuarioId: number) => Promise<unknown>;
  getByUsuario: (usuarioId: number) => Promise<unknown>;
}

export interface PecaAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

export interface EventAPI {
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
}

export interface ContratoAPI {
  list: () => Promise<unknown>;
  listAll: () => Promise<unknown>;
  get: (id: number) => Promise<unknown>;
  listByCliente: (clienteId: number) => Promise<unknown>;
  create: (data: unknown) => Promise<unknown>;
  update: (id: number, data: unknown) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
}

export interface AlertaAPI {
  list: () => Promise<unknown>;
  count: () => Promise<unknown>;
  configGet: () => Promise<unknown>;
  configSave: (config: unknown) => Promise<unknown>;
}

declare global {
  interface Window {
    osTech: {
      client: ClientAPI;
      equipment: EquipmentAPI;
      os: OSAPI;
      user: UserAPI;
      inventory: InventoryAPI;
      backup: BackupAPI;
      report: ReportAPI;
      log: LogAPI;
      servico: ServicoAPI;
      categoriaServico: CategoriaServicoAPI;
      subcategoriaServico: SubcategoriaServicoAPI;
      equipe: EquipeAPI;
      peca: PecaAPI;
      email: EmailAPI;
      contrato: ContratoAPI;
      alerta: AlertaAPI;
      events: EventAPI;
    };
  }
}

export {};
