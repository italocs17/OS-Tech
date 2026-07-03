/**
 * OS.Tech - Servico de Inventario
 * Regras de negocio para a entidade Inventario.
 */

import { InventarioRepository } from '../database/repositories/inventario.repository';
import { registrar } from './log.service';
import type { InventarioHardware, InventarioComDados } from '@shared/types/entities.types';

export class InventarioService {
  private repository = new InventarioRepository();

  async getByOSId(osId: number) {
    const inventario = await this.repository.findLatestByOSId(osId);
    if (!inventario) throw new Error('Inventario nao encontrado');
    return {
      ...inventario,
      jsonCompleto: JSON.parse(inventario.jsonCompleto) as InventarioHardware,
    };
  }

  async getAllByOSId(osId: number) {
    const inventarios = await this.repository.findByOSId(osId);
    return inventarios.map((inv: any) => ({
      ...inv,
      jsonCompleto: JSON.parse(inv.jsonCompleto) as InventarioHardware,
    }));
  }

  async getByEquipamento(equipamentoId: number) {
    return this.repository.findByEquipamento(equipamentoId) as Promise<InventarioComDados[]>;
  }

  async saveManual(osId: number, data: InventarioHardware, usuarioId: number) {
    const inventario = await this.repository.create({
      osId,
      tipo: 'MANUAL',
      jsonCompleto: data,
    });

    await registrar({
      nivel: 'INFO',
      categoria: 'SISTEMA',
      acao: 'INVENTARIO_SALVO',
      descricao: `Inventario registrado para OS ${osId}`,
      usuarioId,
      dadosContexto: { osId },
    });

    return {
      ...inventario,
      jsonCompleto: JSON.parse(inventario.jsonCompleto) as InventarioHardware,
    };
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }

  async count() {
    return this.repository.count();
  }
}
