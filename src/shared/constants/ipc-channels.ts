/**
 * OS.Tech - Constantes dos canais IPC
 * Centraliza todos os canais de comunicacao entre processos
 * do renderer e do processo principal (main).
 */

export const IPC_CHANNELS = {
  CLIENT: {
    LIST: 'client:list',
    GET: 'client:get',
    CREATE: 'client:create',
    UPDATE: 'client:update',
    DELETE: 'client:delete',
  },
  EQUIPMENT: {
    LIST: 'equipment:list',
    GET: 'equipment:get',
    GET_BY_TAG: 'equipment:get-by-tag',
    CREATE: 'equipment:create',
    UPDATE: 'equipment:update',
    DELETE: 'equipment:delete',
    LIST_BY_CLIENT: 'equipment:list-by-client',
  },
  OS: {
    LIST: 'os:list',
    GET: 'os:get',
    CREATE: 'os:create',
    UPDATE: 'os:update',
    DELETE: 'os:delete',
    ADD_EVENT: 'os:add-event',
    CHANGE_STATUS: 'os:change-status',
    ADD_ITEM: 'os:add-item',
    REMOVE_ITEM: 'os:remove-item',
    GET_ITENS: 'os:get-itens',
    GET_EVENTOS: 'os:get-eventos',
    CALCULAR_TOTAL: 'os:calcular-total',
    COUNT_BY_STATUS: 'os:count-by-status',
    LIST_BY_CLIENT: 'os:list-by-client',
    LIST_BY_PERIOD: 'os:list-by-period',
    LIST_BY_EQUIPMENT: 'os:list-by-equipment',
  },
  USER: {
    LIST: 'user:list',
    GET: 'user:get',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    LOGIN: 'user:login',
    CHANGE_PASSWORD: 'user:change-password',
  },
  INVENTORY: {
    GET: 'inventory:get',
    LIST: 'inventory:list',
    DELETE: 'inventario:delete',
    SAVE_MANUAL: 'inventory:save-manual',
    LIST_BY_OS: 'inventory:list-by-os',
    LIST_BY_EQUIPAMENTO: 'inventory:list-by-equipamento',
  },
  BACKUP: {
    CREATE: 'backup:create',
    RESTORE: 'backup:restore',
    LIST: 'backup:list',
  },
  LOG: {
    LIST: 'log:list',
    EXPORT: 'log:export',
  },
  SERVICO: {
    LIST: 'servico:list',
    GET: 'servico:get',
    CREATE: 'servico:create',
    UPDATE: 'servico:update',
    DELETE: 'servico:delete',
  },
  PECA: {
    LIST: 'peca:list',
    GET: 'peca:get',
    CREATE: 'peca:create',
    UPDATE: 'peca:update',
    DELETE: 'peca:delete',
  },
  EMAIL: {
    LIST: 'email:list',
    GET: 'email:get',
    CHECK_MAIL: 'email:check-mail',
    LINK_CLIENT: 'email:link-client',
    CONVERT_TO_OS: 'email:convert-to-os',
    REJECT: 'email:reject',
    CONFIG_GET: 'email:config-get',
    CONFIG_SAVE: 'email:config-save',
    LIST_BY_STATUS: 'email:list-by-status',
    COUNT_PENDING: 'email:count-pending',
    LIST_CONTATOS: 'email:list-contatos',
    CREATE_CONTATO: 'email:create-contato',
    UPDATE_CONTATO: 'email:update-contato',
    DELETE_CONTATO: 'email:delete-contato',
  },
  REPORT: {
    PDF: 'report:pdf',
    OS_BY_PERIOD: 'report:os-by-period',
    OS_BY_CLIENT: 'report:by-client',
    OS_BY_EQUIPMENT: 'report:by-equipment',
    OS_BY_STATUS: 'report:os-by-status',
    SERVICOS_REALIZADOS: 'report:servicos-realizados',
    PECAS_UTILIZADAS: 'report:pecas-utilizadas',
    CLIENTES_RECORRENTES: 'report:clientes-recorrentes',
    FINANCIAL: 'report:financial',
    SAVE_PDF: 'report:save-pdf',
  },
} as const;

/**
 * Tipo que extrai os valores dos canais IPC.
 * Util para tipar handlers e invocacoes IPC.
 */
export type IpcChannelValues = {
  [K in keyof typeof IPC_CHANNELS]: (typeof IPC_CHANNELS)[K] extends {
    [key: string]: infer V;
  }
    ? V
    : never;
}[keyof typeof IPC_CHANNELS];
