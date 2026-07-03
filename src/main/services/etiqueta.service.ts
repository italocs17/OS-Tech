/**
 * OS.Tech - Servico de geracao de etiquetas unicas
 * Gera etiquetas de 5 caracteres alfanumericos [A-Z0-9]
 */

import { prisma } from '../database/connection';

const CARACTERES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TAMANHO = 5;
const MAX_TENTATIVAS = 10;

/**
 * Gera uma string aleatoria de 5 caracteres a partir do conjunto [A-Z0-9].
 */
function gerarStringAleatoria(): string {
  let resultado = '';
  for (let i = 0; i < TAMANHO; i++) {
    const indice = Math.floor(Math.random() * CARACTERES.length);
    resultado += CARACTERES[indice];
  }
  return resultado;
}

/**
 * Verifica se a etiqueta ja existe no banco de dados.
 * Retorna true se a etiqueta e unica (ainda nao existe).
 */
async function verificarUnicidade(etiqueta: string): Promise<boolean> {
  const existente = await prisma.equipamento.findUnique({
    where: { etiqueta },
    select: { id: true },
  });
  return existente === null;
}

/**
 * Gera uma etiqueta unica de 5 caracteres.
 * Em caso de colisao, tenta novamente ate MAX_TENTATIVAS vezes.
 * @throws Error se nao conseguir gerar etiqueta unica apos todas as tentativas
 */
export async function gerarEtiqueta(): Promise<string> {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const etiqueta = gerarStringAleatoria();
    const ehUnica = await verificarUnicidade(etiqueta);
    if (ehUnica) {
      return etiqueta;
    }
  }
  throw new Error(
    `Nao foi possivel gerar etiqueta unica apos ${MAX_TENTATIVAS} tentativas.`
  );
}
