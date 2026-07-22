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
  cpfCnpj: string;
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
  cpfCnpj: string;
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
  | 'AGUARDANDO_ATENDIMENTO'
  | 'EM_ATENDIMENTO'
  | 'PAUSADO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type StatusLogistico =
  | 'PENDENTE'
  | 'RECEBIDO'
  | 'ENTREGUE';

export type TipoDesconto = 'ABSOLUTO' | 'PERCENTUAL';
export type FormaPagamento = 'CONTRATO' | 'PIX' | 'ESPECIE' | 'DEBITO' | 'CREDITO_A_VISTA' | 'CREDITO_PARCELADO';
export type TipoAtendimento = 'INTERNO' | 'EXTERNO';

export interface OrdemServico {
  id: number;
  numeroOS: string;
  clienteId: number;
  equipamentoId: number | null;
  categoriaServicoId: number | null;
  tipoAtendimento: TipoAtendimento;
  status: StatusOS;
  statusLogistico: StatusLogistico;
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
  contatoId?: number;
  categoriaServicoId?: number;
  tipoAtendimento?: TipoAtendimento;
  observacoes?: string;
  dataPrevisao?: Date;
  statusLogistico?: StatusLogistico;
}

export interface UpdateOrdemServicoDTO {
  observacoes?: string;
  dataPrevisao?: Date;
  dataConclusao?: Date;
  tipoAtendimento?: TipoAtendimento;
  equipamentoId?: number | null;
  contatoId?: number | null;
  categoriaServicoId?: number | null;
  desconto?: number | null;
  descontoTipo?: TipoDesconto;
  formaPagamento?: FormaPagamento;
  statusLogistico?: StatusLogistico;
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
  categoriaId: number | null;
  subcategoriaId: number | null;
  categoria?: CategoriaServico | null;
  subcategoria?: SubcategoriaServico | null;
}

export interface CreateServicoDTO {
  descricao: string;
  valorPadrao?: number;
  categoriaId?: number | null;
  subcategoriaId?: number | null;
}

export interface UpdateServicoDTO {
  descricao?: string;
  valorPadrao?: number;
  ativo?: boolean;
  categoriaId?: number | null;
  subcategoriaId?: number | null;
}

// =============================================================================
// CATEGORIA SERVICO
// =============================================================================

export interface CategoriaServico {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface CreateCategoriaServicoDTO {
  nome: string;
  descricao?: string;
}

export interface UpdateCategoriaServicoDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

// =============================================================================
// SUBCATEGORIA SERVICO
// =============================================================================

export interface SubcategoriaServico {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  categoriaId: number;
  categoria?: CategoriaServico;
}

export interface CreateSubcategoriaServicoDTO {
  nome: string;
  descricao?: string;
  categoriaId: number;
}

export interface UpdateSubcategoriaServicoDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
  categoriaId?: number;
}

// =============================================================================
// EQUIPE
// =============================================================================

export interface Equipe {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface EquipeCategoria {
  id: number;
  equipeId: number;
  categoriaId: number;
  categoria?: CategoriaServico;
}

export interface UsuarioEquipe {
  id: number;
  usuarioId: number;
  equipeId: number;
  usuario?: Usuario;
  equipe?: Equipe;
}

export interface CreateEquipeDTO {
  nome: string;
  descricao?: string;
  categoriaIds?: number[];
}

export interface UpdateEquipeDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
  categoriaIds?: number[];
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
  isPadrao: boolean;
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
  corpoTexto?: string;
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

// =============================================================================
// ANEXO EMAIL
// =============================================================================

export interface AnexoEmail {
  id: number;
  emailSolicitacaoId: number;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number;
  mimeType: string | null;
  dataUpload: Date;
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
