/**
 * OS.Tech - Handlers IPC de Relatorios PDF
 * Registra os canais de comunicacao para geracao de documentos PDF.
 */

import { ipcMain, shell, dialog } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { pdfService } from '../services/pdf.service';

export function registerReportIpcHandlers() {
  // ---------------------------------------------------------------------------
  // GENERATE PDF (gera e abre com programa padrao)
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.PDF,
    async (_, type: string, osId: number) => {
      let filePath: string;

      switch (type) {
        case 'os':
          filePath = await pdfService.generateOS(osId);
          break;
        case 'laudo':
          filePath = await pdfService.generateLaudo(osId);
          break;
        case 'inventario':
          filePath = await pdfService.generateInventoryReport(osId);
          break;
        case 'recibo':
          filePath = await pdfService.generateRecibo(osId);
          break;
        default:
          throw new Error(`Tipo de PDF desconhecido: ${type}`);
      }

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // OS BY PERIOD REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.OS_BY_PERIOD,
    async (_, dataInicio: string, dataFim: string, modo?: string) => {
      const filePath = await pdfService.generateOSByPeriodReport(
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // FINANCIAL REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.FINANCIAL,
    async (_, dataInicio: string, dataFim: string, modo?: string) => {
      const filePath = await pdfService.generateFinancialReport(
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // OS BY CLIENT REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.OS_BY_CLIENT,
    async (_, clienteId: number, dataInicio?: string, dataFim?: string, modo?: string) => {
      const filePath = await pdfService.generateOSByClientReport(
        clienteId,
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // OS BY EQUIPMENT REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.OS_BY_EQUIPMENT,
    async (_, equipamentoId: number, dataInicio?: string, dataFim?: string, modo?: string) => {
      const filePath = await pdfService.generateEquipmentHistoryReport(
        equipamentoId,
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // OS BY STATUS REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.OS_BY_STATUS,
    async (_, status: string, dataInicio: string, dataFim: string, modo?: string) => {
      const filePath = await pdfService.generateOSByStatusReport(
        status,
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // SERVICOS REALIZADOS REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.SERVICOS_REALIZADOS,
    async (_, dataInicio: string, dataFim: string, modo?: string) => {
      const filePath = await pdfService.generateServicosRealizadosReport(
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // PECAS UTILIZADAS REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.PECAS_UTILIZADAS,
    async (_, dataInicio: string, dataFim: string, modo?: string) => {
      const filePath = await pdfService.generatePecasUtilizadasReport(
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // CLIENTES RECORRENTES REPORT
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.CLIENTES_RECORRENTES,
    async (_, dataInicio: string, dataFim: string, modo?: string) => {
      const filePath = await pdfService.generateClientesRecorrentesReport(
        dataInicio,
        dataFim,
        modo as 'simplificado' | 'analitico' | undefined
      );

      await shell.openPath(filePath);
      return filePath;
    }
  );

  // ---------------------------------------------------------------------------
  // SAVE PDF (dialogo de salvar)
  // ---------------------------------------------------------------------------
  ipcMain.handle(
    IPC_CHANNELS.REPORT.SAVE_PDF,
    async (_, type: string, osId: number) => {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: `${type}_${osId}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (filePath) {
        switch (type) {
          case 'os':
            await pdfService.generateOS(osId, filePath);
            break;
          case 'laudo':
            await pdfService.generateLaudo(osId, filePath);
            break;
          case 'inventario':
            await pdfService.generateInventoryReport(osId, filePath);
            break;
          case 'recibo':
            await pdfService.generateRecibo(osId, filePath);
            break;
        }
      }

      return filePath;
    }
  );
}
