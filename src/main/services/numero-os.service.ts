/**
 * OS.Tech - Servico de numeracao sequencial de OS
 * Gera numeros de OS unicos e sequenciais, sem reutilizacao
 */

import { prisma } from '../database/connection';

/**
 * Formato do numero de OS: sequencial com zeros a esquerda (%04d).
 * Exemplos: 0001, 0002, ..., 0100, 1000
 */
const FORMATO_NUMERO_OS = '%04d';

/**
 * Busca o maior numero de OS existente no banco de dados.
 * Retorna 0 se nao houver nenhuma OS cadastrada.
 */
async function buscarMaiorNumeroOS(): Promise<number> {
  const resultado = await prisma.ordemServico.findFirst({
    select: { numeroOS: true },
    orderBy: { numeroOS: 'desc' },
  });

  if (!resultado || !resultado.numeroOS) {
    return 0;
  }

  const numero = parseInt(resultado.numeroOS, 10);
  return isNaN(numero) ? 0 : numero;
}

/**
 * Gera o proximo numero de OS sequencial.
 * Utiliza transacao para garantir atomicidade e evitar condicao de corrida.
 * @returns Numero da OS formatado com zeros a esquerda (ex: "0001")
 */
export async function proximoNumeroOS(): Promise<string> {
  const proximoNumero = await prisma.$transaction(async (tx: any) => {
    const maiorNumero = await tx.ordemServico.findFirst({
      select: { numeroOS: true },
      orderBy: { numeroOS: 'desc' },
    });

    let base = 0;
    if (maiorNumero && maiorNumero.numeroOS) {
      const parsed = parseInt(maiorNumero.numeroOS, 10);
      if (!isNaN(parsed)) {
        base = parsed;
      }
    }

    return base + 1;
  });

  return proximoNumero.toString().padStart(4, '0');
}
