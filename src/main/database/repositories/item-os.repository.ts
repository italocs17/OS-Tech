/**
 * OS.Tech - Repositorio de Item de OS
 * Operacoes de acesso a dados para a entidade ItemOS.
 */

import { prisma } from '../connection';
import type { CreateItemOSDTO } from '@shared/types/entities.types';
import type { TipoDesconto } from '@shared/types/entities.types';

export class ItemOSRepository {
  async findByOSId(osId: number) {
    return prisma.itemOS.findMany({
      where: { osId },
      orderBy: { id: 'asc' },
    });
  }

  async create(data: CreateItemOSDTO) {
    return prisma.itemOS.create({ data: this.ensureDefaults(data) });
  }

  async createMany(data: CreateItemOSDTO[]) {
    return prisma.itemOS.createMany({ data: data.map(this.ensureDefaults) });
  }

  private ensureDefaults(data: CreateItemOSDTO): Required<CreateItemOSDTO> {
    return { ...data, referenciaId: data.referenciaId ?? 0 };
  }

  async delete(id: number) {
    return prisma.itemOS.delete({ where: { id } });
  }

  async deleteByOSId(osId: number) {
    return prisma.itemOS.deleteMany({ where: { osId } });
  }

  async calcularTotalOS(osId: number): Promise<number> {
    const resultado = await prisma.itemOS.aggregate({
      where: { osId },
      _sum: { valorTotal: true },
    });
    const subtotal = resultado._sum.valorTotal ?? 0;

    const osData = await prisma.ordemServico.findUnique({
      where: { id: osId },
      select: { desconto: true, descontoTipo: true },
    });

    if (!osData?.desconto || !osData.descontoTipo) return subtotal;

    if (osData.descontoTipo === 'PERCENTUAL') {
      return subtotal * (1 - osData.desconto / 100);
    }

    return subtotal - osData.desconto;
  }
}
