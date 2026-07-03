/**
 * OS.Tech - Repositorio de Evento de OS
 * Operacoes de acesso a dados para a entidade EventoOS.
 * Eventos sao imutaveis: sem update/delete, apenas create.
 */

import { prisma } from '../connection';
import type { CreateEventoOSDTO } from '@shared/types/entities.types';

export class EventoOSRepository {
  async findByOSId(osId: number) {
    return prisma.eventoOS.findMany({
      where: { osId },
      include: {
        usuario: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { dataHora: 'asc' },
    });
  }

  async create(data: CreateEventoOSDTO) {
    return prisma.eventoOS.create({ data });
  }
}
