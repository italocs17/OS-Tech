import { prisma } from '../database/connection';

export interface Alerta {
  id: string;
  tipo: 'CONTRATO_VENCENDO' | 'CONTRATO_VENCIDO';
  titulo: string;
  descricao: string;
  dataRef: Date;
  contratoId: number;
  clienteNome: string;
}

export interface AlertaConfig {
  contratoVencendoDias: number;
  contratoVencendoAtivo: boolean;
  contratoVencidoAtivo: boolean;
}

const DEFAULT_CONFIG: AlertaConfig = {
  contratoVencendoDias: 30,
  contratoVencendoAtivo: true,
  contratoVencidoAtivo: true,
};

export class AlertaService {
  async getConfig(): Promise<AlertaConfig> {
    const rows = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: ['alerta_contrato_vencendo_dias', 'alerta_contrato_vencendo_ativo', 'alerta_contrato_vencido_ativo'],
        },
      },
    });

    const config = { ...DEFAULT_CONFIG };
    for (const row of rows) {
      if (row.chave === 'alerta_contrato_vencendo_dias') config.contratoVencendoDias = parseInt(row.valor) || 30;
      if (row.chave === 'alerta_contrato_vencendo_ativo') config.contratoVencendoAtivo = row.valor === 'true';
      if (row.chave === 'alerta_contrato_vencido_ativo') config.contratoVencidoAtivo = row.valor === 'true';
    }
    return config;
  }

  async saveConfig(config: AlertaConfig): Promise<void> {
    const upserts = [
      prisma.configuracao.upsert({
        where: { chave: 'alerta_contrato_vencendo_dias' },
        update: { valor: String(config.contratoVencendoDias) },
        create: { chave: 'alerta_contrato_vencendo_dias', valor: String(config.contratoVencendoDias) },
      }),
      prisma.configuracao.upsert({
        where: { chave: 'alerta_contrato_vencendo_ativo' },
        update: { valor: String(config.contratoVencendoAtivo) },
        create: { chave: 'alerta_contrato_vencendo_ativo', valor: String(config.contratoVencendoAtivo) },
      }),
      prisma.configuracao.upsert({
        where: { chave: 'alerta_contrato_vencido_ativo' },
        update: { valor: String(config.contratoVencidoAtivo) },
        create: { chave: 'alerta_contrato_vencido_ativo', valor: String(config.contratoVencidoAtivo) },
      }),
    ];
    await prisma.$transaction(upserts);
  }

  async getAlertas(): Promise<Alerta[]> {
    const config = await this.getConfig();
    const alertas: Alerta[] = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const contratos = await prisma.contrato.findMany({
      where: { ativo: true, status: { not: 'ENCERRADO' } },
      include: { cliente: true },
    });

    for (const contrato of contratos) {
      const dataFim = new Date(contrato.dataFim);
      dataFim.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (config.contratoVencidoAtivo && diasRestantes < 0) {
        alertas.push({
          id: `contrato_vencido_${contrato.id}`,
          tipo: 'CONTRATO_VENCIDO',
          titulo: `Contrato #${contrato.numero} vencido`,
          descricao: `Contrato do cliente ${contrato.cliente.nome} vencido há ${Math.abs(diasRestantes)} dias`,
          dataRef: dataFim,
          contratoId: contrato.id,
          clienteNome: contrato.cliente.nome,
        });
      } else if (config.contratoVencendoAtivo && diasRestantes >= 0 && diasRestantes <= config.contratoVencendoDias) {
        alertas.push({
          id: `contrato_vencendo_${contrato.id}`,
          tipo: 'CONTRATO_VENCENDO',
          titulo: `Contrato #${contrato.numero} vence em ${diasRestantes} dias`,
          descricao: `Contrato do cliente ${contrato.cliente.nome} vence em ${diasRestantes} dias`,
          dataRef: dataFim,
          contratoId: contrato.id,
          clienteNome: contrato.cliente.nome,
        });
      }
    }

    return alertas.sort((a, b) => a.dataRef.getTime() - b.dataRef.getTime());
  }

  async countAlertas(): Promise<number> {
    const alertas = await this.getAlertas();
    return alertas.length;
  }
}
