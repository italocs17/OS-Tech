/**
 * OS.Tech - Tipos compartilhados das entidades do banco de dados
 * Interfaces DTO e de entidades para uso em todo o sistema
 */

// =============================================================================
// CLIENTE
// =============================================================================

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  rg: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  dataCadastro: Date;
  ativo: boolean;
}

export interface CreateClienteDTO {
  nome: string;
  cpf: string;
  rg?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  rg?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  ativo?: boolean;
}

// =============================================================================
// EQUIPAMENTO
// =============================================================================

export interface Equipamento {
  id: number;
  clienteId: number;
  etiqueta: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string | null;
  observacoes: string | null;
  dataCadastro: Date;
  ativo: boolean;
}

export interface CreateEquipamentoDTO {
  clienteId: number;
  etiqueta?: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  observacoes?: string;
}

export interface UpdateEquipamentoDTO {
  tipo?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  observacoes?: string;
  ativo?: boolean;
}

// =============================================================================
// ORDEM DE SERVICO
// =============================================================================

export type StatusOS =
  | 'ABERTA'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_APROVACAO'
  | 'AGUARDANDO_PECA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'ENTREGUE'
  | 'CANCELADA';

export type TipoDesconto = 'ABSOLUTO' | 'PERCENTUAL';
export type FormaPagamento = 'PIX' | 'ESPECIE' | 'DEBITO' | 'CREDITO';
export type TipoAtendimento = 'INTERNO' | 'EXTERNO';

export interface OrdemServico {
  id: number;
  numeroOS: string;
  clienteId: number;
  equipamentoId: number | null;
  tipoAtendimento: TipoAtendimento;
  status: StatusOS;
  dataEntrada: Date;
  dataPrevisao: Date | null;
  dataConclusao: Date | null;
  observacoes: string | null;
  desconto: number | null;
  descontoTipo: TipoDesconto | null;
  formaPagamento: FormaPagamento | null;
}

export interface CreateOrdemServicoDTO {
  clienteId: number;
  equipamentoId?: number;
  tipoAtendimento?: TipoAtendimento;
  observacoes?: string;
  dataPrevisao?: Date;
}

export interface UpdateOrdemServicoDTO {
  observacoes?: string;
  dataPrevisao?: Date;
  dataConclusao?: Date;
  tipoAtendimento?: TipoAtendimento;
  desconto?: number | null;
  descontoTipo?: TipoDesconto;
  formaPagamento?: FormaPagamento;
}

// =============================================================================
// EVENTO OS
// =============================================================================

export interface EventoOS {
  id: number;
  osId: number;
  usuarioId: number;
  dataHora: Date;
  descricao: string;
}

export interface CreateEventoOSDTO {
  osId: number;
  usuarioId: number;
  descricao: string;
}

// =============================================================================
// SERVICO
// =============================================================================

export interface Servico {
  id: number;
  descricao: string;
  valorPadrao: number;
  ativo: boolean;
}

export interface CreateServicoDTO {
  descricao: string;
  valorPadrao?: number;
}

export interface UpdateServicoDTO {
  descricao?: string;
  valorPadrao?: number;
  ativo?: boolean;
}

// =============================================================================
// PECA
// =============================================================================

export interface Peca {
  id: number;
  descricao: string;
  fabricante: string | null;
  valorReferencia: number;
  ativo: boolean;
}

export interface CreatePecaDTO {
  descricao: string;
  fabricante?: string;
  valorReferencia?: number;
}

export interface UpdatePecaDTO {
  descricao?: string;
  fabricante?: string;
  valorReferencia?: number;
  ativo?: boolean;
}

// =============================================================================
// ITEM OS
// =============================================================================

export type TipoItem = 'SERVICO' | 'PECA';

export interface ItemOS {
  id: number;
  osId: number;
  tipoItem: TipoItem;
  referenciaId: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface CreateItemOSDTO {
  osId: number;
  tipoItem: TipoItem;
  referenciaId?: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

// =============================================================================
// INVENTARIO
// =============================================================================

/**
 * Estrutura tipada do JSON armazenado no campo jsonCompleto da tabela inventario.
 * Reflete a saida do script scripts/inventory.ps1.
 */
export interface InventarioHardware {
  sistema_operacional?: {
    nome?: string;
    versao?: string;
    build?: string;
    arquitetura?: string;
    serial?: string;
    erro?: string;
  };
  processador?: {
    modelo?: string;
    nucleos?: number;
    threads?: number;
    frequencia_ghz?: number;
    socket?: string;
    erro?: string;
  };
  memoria_ram?: {
    total_gb?: number;
    tipo?: string;
    velocidade_mhz?: number;
    slots_usados?: number;
    slots_total?: number;
    erro?: string;
  };
  discos?: Array<{
    modelo?: string;
    tipo?: string;
    capacidade_gb?: number;
    serial?: string;
    saude?: string;
  }> | { erro: string };
  rede?: Array<{
    nome?: string;
    ip_local?: string;
    mac_address?: string;
    tipo_conexao?: string;
  }> | { erro: string };
  placa_mae?: {
    fabricante?: string;
    modelo?: string;
    serial?: string;
    erro?: string;
  };
  placa_de_video?: {
    modelo?: string;
    vram_gb?: number;
    driver?: string;
    erro?: string;
  };
  fonte?: Record<string, unknown>;
  gabinete?: Record<string, unknown>;
  programas_instalados?: Array<{
    nome?: string;
    versao?: string;
    fabricante?: string;
  }> | { erro: string };
  impressoras?: Array<{
    nome?: string;
    driver?: string;
    porta?: string;
    padrao?: boolean;
  }> | { erro: string };
  descricao_livre?: string;
  data_captura: string;
}

export interface Inventario {
  id: number;
  osId: number;
  tipo: string;
  dataCaptura: Date;
  jsonCompleto: string;
}

export interface CreateInventarioDTO {
  osId: number;
  tipo?: string;
  jsonCompleto: InventarioHardware;
}

export interface InventarioComDados extends Omit<Inventario, 'jsonCompleto'> {
  jsonCompleto: InventarioHardware;
  os?: {
    id: number;
    numeroOS: string;
    status: string;
  };
}

// =============================================================================
// USUARIO
// =============================================================================

export type PerfilUsuario = 'TECNICO' | 'RECEPCIONISTA' | 'PROPRIETARIO' | 'GESTOR';

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface CreateUsuarioDTO {
  nome: string;
  login: string;
  senhaHash: string;
  perfil: PerfilUsuario;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  senha?: string;
  perfil?: PerfilUsuario;
  ativo?: boolean;
}

export interface LoginDTO {
  login: string;
  senha: string;
}

// =============================================================================
// LOG
// =============================================================================

export interface Log {
  id: number;
  dataHora: Date;
  nivel: string;
  categoria: string;
  acao: string;
  descricao: string;
  usuarioId: number | null;
  dadosContexto: string | null;
  maquinaId: string | null;
  versaoApp: string | null;
}

export interface LogEntry {
  nivel: 'INFO' | 'WARN' | 'ERROR';
  categoria: string;
  acao: string;
  descricao: string;
  usuarioId?: number;
  dadosContexto?: Record<string, unknown>;
}

// =============================================================================
// CLIENTE CONTATO
// =============================================================================

export interface ClienteContato {
  id: number;
  clienteId: number;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
}

export interface CreateClienteContatoDTO {
  clienteId: number;
  nome: string;
  email: string;
  telefone?: string;
}

export interface UpdateClienteContatoDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}

// =============================================================================
// EMAIL SOLICITACAO
// =============================================================================

export type StatusEmail =
  | 'NAO_CADASTRADO'
  | 'AGUARDANDO_ATENDIMENTO'
  | 'CONVERTIDO'
  | 'REJEITADO';

export interface EmailSolicitacao {
  id: number;
  emailRemetente: string;
  assunto: string;
  corpoTexto: string;
  dataRecebimento: Date;
  mensagemId: string;
  status: StatusEmail;
  clienteId: number | null;
  contatoId: number | null;
  osId: number | null;
  usuarioAprovadorId: number | null;
  dataProcessamento: Date | null;
  observacoes: string | null;
}

export interface EmailSolicitacaoComVinculos extends EmailSolicitacao {
  cliente?: { id: number; nome: string } | null;
  contato?: ClienteContato | null;
  os?: { id: number; numeroOS: string } | null;
}

export interface CreateEmailSolicitacaoDTO {
  emailRemetente: string;
  assunto: string;
  corpoTexto: string;
  mensagemId: string;
  status: StatusEmail;
  clienteId?: number;
  contatoId?: number;
}

export interface UpdateEmailSolicitacaoDTO {
  status?: StatusEmail;
  clienteId?: number;
  contatoId?: number;
  osId?: number;
  usuarioAprovadorId?: number;
  dataProcessamento?: Date;
  observacoes?: string | null;
}

export interface EmailConfig {
  email: string;
  appPassword: string;
}

export interface LinkClientDTO {
  solicitacaoId: number;
  clienteId: number;
  contatoId: number;
  usuarioId: number;
}

export interface ConvertToOSDTO {
  solicitacaoId: number;
  usuarioId: number;
  observacoes?: string;
  tipoAtendimento?: string;
}

export interface LogFiltros {
  nivel?: string;
  categoria?: string;
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
  limite?: number;
  pagina?: number;
}
