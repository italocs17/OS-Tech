/**
 * OS.Tech - Servico de log de auditoria
 * Registra eventos do sistema com suporte a busca, exportacao e rotacao
 */

import { prisma } from '../database/connection';

type CategoriaLog = 'AUTH' | 'CLIENTE' | 'OS' | 'BACKUP' | 'SISTEMA' | 'RESTAURACAO';

// =============================================================================
// TIPOS
// =============================================================================

export interface LogEntry {
  nivel: 'INFO' | 'WARN' | 'ERROR';
  categoria: CategoriaLog;
  acao: string;
  descricao: string;
  usuarioId?: number;
  dadosContexto?: Record<string, unknown>;
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

// =============================================================================
// CONSTANTES
// =============================================================================

/** Numero maximo de registros mantidos no banco (rotacao automatica) */
const MAX_REGISTROS = 50_000;

// =============================================================================
// SERVICO
// =============================================================================

/**
 * Registra uma entrada de log no banco de dados.
 * Apos o registro, executa rotacao automatica para manter apenas os
 * MAX_REGISTROS mais recentes.
 */
export async function registrar(entry: LogEntry): Promise<void> {
  await prisma.log.create({
    data: {
      nivel: entry.nivel,
      categoria: entry.categoria,
      acao: entry.acao,
      descricao: entry.descricao,
      usuarioId: entry.usuarioId ?? null,
      dadosContexto: entry.dadosContexto
        ? JSON.stringify(entry.dadosContexto)
        : null,
    },
  });

  await rotacionar();
}

/**
 * Lista logs com filtros opaginados.
 * @param filtros - Objeto com filtros (nivel, categoria, datas, busca, paginacao)
 * @returns Array de logs encontrados
 */
export async function listar(filtros: LogFiltros): Promise<Log[]> {
  const limite = filtros.limite ?? 100;
  const pagina = filtros.pagina ?? 1;
  const skip = (pagina - 1) * limite;

  const where: Record<string, unknown> = {};

  if (filtros.nivel) {
    where.nivel = filtros.nivel;
  }

  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }

  if (filtros.dataInicio || filtros.dataFim) {
    const dataHora: Record<string, Date> = {};
    if (filtros.dataInicio) {
      dataHora.gte = filtros.dataInicio;
    }
    if (filtros.dataFim) {
      dataHora.lte = filtros.dataFim;
    }
    (where as Record<string, unknown>).dataHora = dataHora;
  }

  if (filtros.busca) {
    where.OR = [
      { descricao: { contains: filtros.busca } },
      { acao: { contains: filtros.busca } },
    ];
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: { dataHora: 'desc' },
    skip,
    take: limite,
  });

  return logs.map((log: any) => ({
    ...log,
    dadosContexto: log.dadosContexto,
  }));
}

/**
 * Exporta logs no formato especificado (csv ou json).
 * @param formato - Formato de exportacao ('csv' ou 'json')
 * @param filtros - Filtros aplicados antes da exportacao
 * @returns String com conteudo formatado
 */
export async function exportar(
  formato: 'csv' | 'json',
  filtros: LogFiltros
): Promise<string> {
  const logs = await listar({ ...filtros, limite: Number.MAX_SAFE_INTEGER, pagina: 1 });

  if (formato === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  // CSV
  const cabecalho = [
    'id',
    'dataHora',
    'nivel',
    'categoria',
    'acao',
    'descricao',
    'usuarioId',
    'dadosContexto',
    'maquinaId',
    'versaoApp',
  ].join(',');

  const linhas = logs.map((log) => {
    return [
      log.id,
      log.dataHora.toISOString(),
      log.nivel,
      log.categoria,
      log.acao,
      escaparCsv(log.descricao),
      log.usuarioId ?? '',
      log.dadosContexto ? escaparCsv(log.dadosContexto) : '',
      log.maquinaId ?? '',
      log.versaoApp ?? '',
    ].join(',');
  });

  return [cabecalho, ...linhas].join('\n');
}

// =============================================================================
// FUNCOES PRIVADAS
// =============================================================================

/**
 * Escapa valor para CSV (envolve em aspas se contem virgula, aspas ou quebra de linha).
 */
function escaparCsv(valor: string): string {
  if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/**
 * Remove registros excedentes, mantendo apenas os MAX_REGISTROS mais recentes.
 */
async function rotacionar(): Promise<void> {
  const total = await prisma.log.count();

  if (total <= MAX_REGISTROS) {
    return;
  }

  const excesso = total - MAX_REGISTROS;

  const registrosParaRemover = await prisma.log.findMany({
    orderBy: { dataHora: 'asc' },
    take: excesso,
    select: { id: true },
  });

  await prisma.log.deleteMany({
    where: {
      id: { in: registrosParaRemover.map((r: any) => r.id) },
    },
  });
}
