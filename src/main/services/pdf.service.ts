import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { prisma } from '../database/connection';
import type { InventarioHardware } from '@shared/types/entities.types';

type ModoRelatorio = 'simplificado' | 'analitico';

export class PDFService {
  private toLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getOutputPath(filename: string): string {
    const outputDir =
      process.env.PDF_OUTPUT_DIR ||
      (app?.isPackaged
        ? path.join(app.getPath('documents'), 'OS.Tech', 'pdfs')
        : path.join(process.cwd(), 'prisma', 'pdfs'));

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return path.join(outputDir, filename);
  }

  private addHeader(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);
  }

  private setupFooter(doc: PDFKit.PDFDocument) {
    let pageNum = 1;
    let drawing = false;
    const draw = () => {
      if (drawing) return;
      drawing = true;
      const prevY = doc.y;
      const bottom = doc.page.maxY();
      const x = (doc.page.width - 350) / 2;
      doc.fontSize(8).fillColor('#999999');
      doc.text('OS.Tech - Sistema de Gestao para Assistencia Tecnica', x, bottom - 30);
      doc.text(`Pagina ${pageNum}`, x, bottom - 15);
      doc.fillColor('#000000');
      doc.y = prevY;
      drawing = false;
    };
    (doc as any).__footerDraw = draw;
    doc.on('pageAdded', () => { pageNum++; draw(); });
  }

  private finalizeFooter(doc: PDFKit.PDFDocument) {
    const draw = (doc as any).__footerDraw;
    if (draw) draw();
  }

  private setupFont(doc: PDFKit.PDFDocument) {
    const arialPath = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arial.ttf');
    if (fs.existsSync(arialPath)) {
      doc.registerFont('Arial', arialPath);
      doc.font('Arial');
    }
  }

  // ===========================================================================
  // HELPERS DE RENDERIZACAO
  // ===========================================================================

  private renderOSSimplified(doc: PDFKit.PDFDocument, os: any, index: number) {
    const status = os.status.replace(/_/g, ' ');
    const cliente = os.cliente?.nome || '-';
    const eq = os.equipamento;
    const equipamento = eq ? `${eq.marca} ${eq.modelo} (${eq.etiqueta})` : '-';
    const total = this.calcularTotalComDesconto(os);
    const data = os.dataEntrada
      ? new Date(os.dataEntrada).toLocaleDateString('pt-BR')
      : '-';
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(
      `${index + 1}. [${status}] OS ${os.numeroOS}`
    );
    doc.text(
      `   Cliente: ${cliente}  |  Eq.: ${equipamento}  |  Total: R$ ${this.formatBRL(total)}  |  Data: ${data}`
    );
  }

  private renderOSAnalytical(doc: PDFKit.PDFDocument, os: any) {
    doc.moveDown(0.5);
    const separator = '='.repeat(70);
    doc.fontSize(9).fillColor('#999999').text(separator);
    doc.fillColor('#000000');
    doc.moveDown(0.3);

    const status = os.status.replace(/_/g, ' ');
    doc.fontSize(14).text(`OS ${os.numeroOS} \u2014 ${status}`);
    doc.moveDown(0.5);

    doc.fontSize(14).text('DADOS DO CLIENTE', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Nome: ${os.cliente?.nome || '-'}`);
    doc.text(`CPF/CNPJ: ${os.cliente?.cpfCnpj || '-'}`);
    doc.text(`Telefone: ${os.cliente?.telefone || '-'}`);
    doc.text(`E-mail: ${os.cliente?.email || '-'}`);
    doc.moveDown(0.5);

    doc.fontSize(14).text('DADOS DO EQUIPAMENTO', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Etiqueta: ${os.equipamento?.etiqueta || '-'}`);
    doc.text(`Tipo: ${os.equipamento?.tipo || '-'}`);
    doc.text(`Marca: ${os.equipamento?.marca || '-'}`);
    doc.text(`Modelo: ${os.equipamento?.modelo || '-'}`);
    doc.text(`N Serie: ${os.equipamento?.numeroSerie || '-'}`);
    doc.moveDown(0.5);

    doc.fontSize(14).text('STATUS', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Status: ${status}`);
    doc.text(`Data de Entrada: ${new Date(os.dataEntrada).toLocaleDateString('pt-BR')}`);
    if (os.dataPrevisao)
      doc.text(`Previsao: ${new Date(os.dataPrevisao).toLocaleDateString('pt-BR')}`);
    if (os.dataConclusao)
      doc.text(`Conclusao: ${new Date(os.dataConclusao).toLocaleDateString('pt-BR')}`);
    doc.moveDown(0.5);

    if (os.observacoes) {
      doc.fontSize(14).text('OBSERVACOES', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).text(os.observacoes);
      doc.moveDown(0.5);
    }

    if (os.itens && os.itens.length > 0) {
      doc.fontSize(14).text('ITENS', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11);
      os.itens.forEach((item: any, idx: number) => {
        doc.text(
          `${idx + 1}. ${item.descricao} (${item.tipoItem}) - Qtd: ${item.quantidade} - R$ ${this.formatBRL(item.valorTotal)}`
        );
      });
      doc.moveDown(0.3);
      const subtotal = os.itens.reduce((s: number, item: any) => s + item.valorTotal, 0);
      doc.text(`Subtotal: R$ ${this.formatBRL(subtotal)}`);

      let total = subtotal;
      if (os.desconto != null && os.descontoTipo) {
        if (os.descontoTipo === 'PERCENTUAL') {
          const valorDesconto = subtotal * os.desconto / 100;
          doc.text(`Desconto: ${os.desconto}% (-R$ ${this.formatBRL(valorDesconto)})`);
          total = subtotal - valorDesconto;
        } else {
          doc.text(`Desconto: -R$ ${this.formatBRL(os.desconto)}`);
          total = subtotal - os.desconto;
        }
      }

      doc.fontSize(12).text(`TOTAL: R$ ${this.formatBRL(total)}`, { align: 'right' });

      if (os.formaPagamento) {
        doc.moveDown(0.3);
        doc.fontSize(11).text(`Forma de Pagamento: ${os.formaPagamento}`);
      }
      doc.moveDown(0.5);
    }

    if (os.eventos && os.eventos.length > 0) {
      doc.fontSize(14).text('HISTORICO DE EVENTOS', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10);
      os.eventos.forEach((evento: any) => {
        const data = new Date(evento.dataHora).toLocaleString('pt-BR');
        doc.text(`[${data}] ${evento.descricao}`);
      });
      doc.moveDown(0.5);
    }
  }

  private renderOSList(doc: PDFKit.PDFDocument, osList: any[], modo: ModoRelatorio) {
    if (osList.length === 0) {
      doc.fontSize(11).text('Nenhuma OS encontrada.');
      return;
    }

    doc.fontSize(14).text(`Total de OS: ${osList.length}`, { underline: true });
    doc.moveDown(0.5);

    if (modo === 'simplificado') {
      doc.fontSize(10);
      osList.forEach((os, index) => this.renderOSSimplified(doc, os, index));
    } else {
      osList.forEach((os) => this.renderOSAnalytical(doc, os));
    }
  }

  private async queryOSListWithIncludes(
    where: any,
    modo: ModoRelatorio,
    orderBy: any = { dataEntrada: 'desc' as const }
  ) {
    const include: any = {
      cliente: true,
      equipamento: true,
    };
    if (modo === 'analitico') {
      include.itens = true;
      include.eventos = { orderBy: { dataHora: 'asc' as const } };
    }
    return prisma.ordemServico.findMany({ where, include, orderBy });
  }

  // ===========================================================================
  // RELATORIOS DE OS UNICA
  // ===========================================================================

  async generateOS(osId: number, outputPathOverride?: string): Promise<string> {
    const os = await prisma.ordemServico.findUnique({
      where: { id: osId },
      include: {
        cliente: true,
        equipamento: true,
        eventos: { orderBy: { dataHora: 'asc' } },
        itens: true,
        inventarios: true,
      },
    });

    if (!os) throw new Error('OS nao encontrada');

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(`OS_${os.numeroOS}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);

    this.setupFooter(doc);

    this.addHeader(doc, `ORDEM DE SERVICO - N ${os.numeroOS}`);

    doc.fontSize(14).text('DADOS DO CLIENTE', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Nome: ${os.cliente.nome}`);
    doc.text(`CPF/CNPJ: ${os.cliente.cpfCnpj}`);
    doc.text(`Telefone: ${os.cliente.telefone || '-'}`);
    doc.text(`E-mail: ${os.cliente.email || '-'}`);
    doc.text(`Endereco: ${os.cliente.endereco || '-'}`);
    doc.moveDown(1);

    doc.fontSize(14).text('DADOS DO EQUIPAMENTO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    if (os.equipamento) {
      doc.text(`Etiqueta: ${os.equipamento.etiqueta}`);
      doc.text(`Tipo: ${os.equipamento.tipo}`);
      doc.text(`Marca: ${os.equipamento.marca}`);
      doc.text(`Modelo: ${os.equipamento.modelo}`);
      doc.text(`N Serie: ${os.equipamento.numeroSerie || '-'}`);
    } else {
      doc.text('Equipamento: Nao vinculado');
    }
    doc.moveDown(1);

    doc.fontSize(14).text('STATUS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Status: ${os.status.replace(/_/g, ' ')}`);
    doc.text(`Data de Entrada: ${new Date(os.dataEntrada).toLocaleDateString('pt-BR')}`);
    if (os.dataPrevisao)
      doc.text(`Previsao: ${new Date(os.dataPrevisao).toLocaleDateString('pt-BR')}`);
    if (os.dataConclusao)
      doc.text(`Conclusao: ${new Date(os.dataConclusao).toLocaleDateString('pt-BR')}`);
    doc.moveDown(1);

    if (os.observacoes) {
      doc.fontSize(14).text('OBSERVACOES', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(os.observacoes);
      doc.moveDown(1);
    }

    if (os.itens.length > 0) {
      doc.fontSize(14).text('ITENS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      os.itens.forEach((item: any, index: number) => {
        doc.text(
          `${index + 1}. ${item.descricao} (${item.tipoItem}) - Qtd: ${item.quantidade} - R$ ${this.formatBRL(item.valorTotal)}`
        );
      });
      doc.moveDown(0.5);
      const subtotal = os.itens.reduce((sum: number, item: any) => sum + item.valorTotal, 0);
      doc.fontSize(11).text(`Subtotal: R$ ${this.formatBRL(subtotal)}`);

      let total = subtotal;
      if (os.desconto != null && os.descontoTipo) {
        if (os.descontoTipo === 'PERCENTUAL') {
          const valorDesconto = subtotal * os.desconto / 100;
          doc.text(`Desconto: ${os.desconto}% (-R$ ${this.formatBRL(valorDesconto)})`);
          total = subtotal - valorDesconto;
        } else {
          doc.text(`Desconto: -R$ ${this.formatBRL(os.desconto)}`);
          total = subtotal - os.desconto;
        }
      }

      doc.fontSize(12).text(`TOTAL: R$ ${this.formatBRL(total)}`, { align: 'right' });

      if (os.formaPagamento) {
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Forma de Pagamento: ${os.formaPagamento}`);
      }
      doc.moveDown(1);
    }

    if (os.eventos.length > 0) {
      doc.fontSize(14).text('HISTORICO DE EVENTOS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      os.eventos.forEach((evento: any) => {
        const data = new Date(evento.dataHora).toLocaleString('pt-BR');
        doc.text(`[${data}] ${evento.descricao}`);
      });
      doc.moveDown(1);
    }

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateLaudo(osId: number, outputPathOverride?: string): Promise<string> {
    const os = await prisma.ordemServico.findUnique({
      where: { id: osId },
      include: {
        cliente: true,
        equipamento: true,
        eventos: { orderBy: { dataHora: 'asc' } },
        inventarios: true,
      },
    });

    if (!os) throw new Error('OS nao encontrada');

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(`Laudo_${os.numeroOS}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);

    this.setupFooter(doc);

    this.addHeader(doc, `LAUDO TECNICO - N ${os.numeroOS}`);

    doc.fontSize(14).text('CLIENTE', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Nome: ${os.cliente.nome}`);
    doc.text(`CPF/CNPJ: ${os.cliente.cpfCnpj}`);
    doc.moveDown(1);

    doc.fontSize(14).text('EQUIPAMENTO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    if (os.equipamento) {
      doc.text(`Etiqueta: ${os.equipamento.etiqueta}`);
      doc.text(`Tipo: ${os.equipamento.tipo}`);
      doc.text(`Marca: ${os.equipamento.marca}`);
      doc.text(`Modelo: ${os.equipamento.modelo}`);
      doc.text(`N Serie: ${os.equipamento.numeroSerie || '-'}`);
    } else {
      doc.text('Equipamento: Nao vinculado');
    }
    doc.moveDown(1);

    if (os.inventario) {
      const inventario = JSON.parse(os.inventario.jsonCompleto) as InventarioHardware;
      doc.fontSize(14).text('INVENTARIO TECNICO', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);

      if (inventario.sistema_operacional) {
        doc.text(
          `SO: ${inventario.sistema_operacional.nome || ''} ${inventario.sistema_operacional.versao || ''}`
        );
      }
      if (inventario.processador) {
        doc.text(
          `CPU: ${inventario.processador.modelo || ''} (${inventario.processador.nucleos || 0} nucleos)`
        );
      }
      if (inventario.memoria_ram) {
        doc.text(`RAM: ${inventario.memoria_ram.total_gb || 0} GB`);
      }
      if (Array.isArray(inventario.discos)) {
        inventario.discos.forEach((disco) => {
          doc.text(`Disco: ${disco.modelo || ''} - ${disco.capacidade_gb || 0} GB`);
        });
      }
      doc.moveDown(1);
    }

    if (os.eventos.length > 0) {
      doc.fontSize(14).text('DIAGNOSTICO E SOLUCAO', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      os.eventos.forEach((evento: any) => {
        const data = new Date(evento.dataHora).toLocaleString('pt-BR');
        doc.text(`[${data}] ${evento.descricao}`);
      });
      doc.moveDown(1);
    }

    if (os.observacoes) {
      doc.fontSize(14).text('OBSERVACOES', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(os.observacoes);
      doc.moveDown(1);
    }

    doc.moveDown(3);
    doc.fontSize(11).text('_________________________________', { align: 'center' });
    doc.text('Tecnico Responsavel', { align: 'center' });

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateInventoryReport(osId: number, outputPathOverride?: string): Promise<string> {
    const inventarios = await prisma.inventario.findMany({
      where: { osId },
      orderBy: { dataCaptura: 'asc' },
      include: {
        os: { include: { cliente: true, equipamento: true } },
      },
    });

    if (inventarios.length === 0) throw new Error('Nenhum inventario encontrado para esta OS');

    const os = inventarios[0].os;

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(`Inventario_OS${os.numeroOS}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);

    this.setupFooter(doc);

    this.addHeader(doc, `INVENTARIO TECNICO - OS ${os.numeroOS}`);

    doc.fontSize(14).text('EQUIPAMENTO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Cliente: ${os.cliente.nome}`);
    if (os.equipamento) {
      doc.text(`Equipamento: ${os.equipamento.marca} ${os.equipamento.modelo}`);
      doc.text(`Etiqueta: ${os.equipamento.etiqueta}`);
    } else {
      doc.text('Equipamento: Nao vinculado');
    }
    doc.moveDown(1);

    for (let i = 0; i < inventarios.length; i++) {
      const data = JSON.parse(inventarios[i].jsonCompleto) as InventarioHardware;

      doc.fontSize(16).fillColor('#333333').text(
        `Captura ${i + 1} - ${new Date(inventarios[i].dataCaptura).toLocaleString('pt-BR')}`,
        { underline: true }
      );
      doc.fillColor('#000000');
      doc.moveDown(0.5);

      if (data.sistema_operacional && !data.sistema_operacional.erro) {
        doc.fontSize(14).text('SISTEMA OPERACIONAL', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Nome: ${data.sistema_operacional.nome || '-'}`);
        doc.text(`Versao: ${data.sistema_operacional.versao || '-'}`);
        doc.text(`Build: ${data.sistema_operacional.build || '-'}`);
        doc.text(`Arquitetura: ${data.sistema_operacional.arquitetura || '-'}`);
        doc.moveDown(1);
      }

      if (data.processador && !data.processador.erro) {
        doc.fontSize(14).text('PROCESSADOR', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Modelo: ${data.processador.modelo || '-'}`);
        doc.text(`Nucleos: ${data.processador.nucleos || 0}`);
        doc.text(`Threads: ${data.processador.threads || 0}`);
        doc.text(`Frequencia: ${data.processador.frequencia_ghz || 0} GHz`);
        doc.moveDown(1);
      }

      if (data.memoria_ram && !data.memoria_ram.erro) {
        doc.fontSize(14).text('MEMORIA RAM', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Total: ${data.memoria_ram.total_gb || 0} GB`);
        doc.text(`Tipo: ${data.memoria_ram.tipo || '-'}`);
        doc.text(`Velocidade: ${data.memoria_ram.velocidade_mhz || 0} MHz`);
        doc.text(`Slots: ${data.memoria_ram.slots_usados || 0}/${data.memoria_ram.slots_total || 0}`);
        doc.moveDown(1);
      }

      if (Array.isArray(data.discos) && data.discos.length > 0) {
        doc.fontSize(14).text('ARMAZENAMENTO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        data.discos.forEach((disco, index) => {
          doc.text(
            `Disco ${index + 1}: ${disco.modelo || ''} - ${disco.capacidade_gb || 0} GB (${disco.tipo || ''}) - Saude: ${disco.saude || 'OK'}`
          );
        });
        doc.moveDown(1);
      }

      if (Array.isArray(data.rede) && data.rede.length > 0) {
        doc.fontSize(14).text('REDE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        data.rede.forEach((adapter) => {
          doc.text(
            `Adaptador: ${adapter.nome || ''} - IP: ${adapter.ip_local || ''} - MAC: ${adapter.mac_address || ''} - ${adapter.tipo_conexao || ''}`
          );
        });
        doc.moveDown(1);
      }

      if (data.placa_mae && !data.placa_mae.erro) {
        doc.fontSize(14).text('PLACA-MAE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Fabricante: ${data.placa_mae.fabricante || '-'}`);
        doc.text(`Modelo: ${data.placa_mae.modelo || '-'}`);
        doc.moveDown(1);
      }

      if (data.placa_de_video && !data.placa_de_video.erro) {
        doc.fontSize(14).text('PLACA DE VIDEO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Modelo: ${data.placa_de_video.modelo || '-'}`);
        doc.text(`VRAM: ${data.placa_de_video.vram_gb || 0} GB`);
        doc.text(`Driver: ${data.placa_de_video.driver || '-'}`);
        doc.moveDown(1);
      }

      if (Array.isArray(data.programas_instalados) && data.programas_instalados.length > 0) {
        doc.fontSize(14).text('PROGRAMAS INSTALADOS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);
        data.programas_instalados.forEach((prog, index) => {
          doc.text(`${index + 1}. ${prog.nome || ''} ${prog.versao || ''} (${prog.fabricante || ''})`);
        });
        doc.moveDown(1);
      }

      if (Array.isArray(data.impressoras) && data.impressoras.length > 0) {
        doc.fontSize(14).text('IMPRESSORAS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        data.impressoras.forEach((printer) => {
          doc.text(
            `${printer.nome || ''} - Driver: ${printer.driver || ''} - Porta: ${printer.porta || ''}${printer.padrao ? ' (Padrao)' : ''}`
          );
        });
        doc.moveDown(1);
      }

      if (data.descricao_livre) {
        doc.fontSize(14).text('DESCRICAO DO HARDWARE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        const linhas = data.descricao_livre.split('\n');
        linhas.forEach((linha) => doc.text(linha));
        doc.moveDown(1);
      }

      if (i < inventarios.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
        doc.moveDown(1);
      }
    }

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateRecibo(osId: number, outputPathOverride?: string): Promise<string> {
    const os = await prisma.ordemServico.findUnique({
      where: { id: osId },
      include: { cliente: true, equipamento: true, itens: true },
    });

    if (!os) throw new Error('OS nao encontrada');

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(`Recibo_${os.numeroOS}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, `RECIBO DE ENTREGA - N ${os.numeroOS}`);

    doc.fontSize(14).text('DADOS DO CLIENTE', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Nome: ${os.cliente.nome}`);
    doc.text(`CPF/CNPJ: ${os.cliente.cpfCnpj}`);
    doc.moveDown(1);

    doc.fontSize(14).text('EQUIPAMENTO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    if (os.equipamento) {
      doc.text(`Tipo: ${os.equipamento.tipo}`);
      doc.text(`Marca: ${os.equipamento.marca}`);
      doc.text(`Modelo: ${os.equipamento.modelo}`);
      doc.text(`Etiqueta: ${os.equipamento.etiqueta}`);
    } else {
      doc.text('Equipamento: Nao vinculado');
    }
    doc.moveDown(1);

    if (os.itens.length > 0) {
      doc.fontSize(14).text('SERVICOS REALIZADOS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      os.itens.forEach((item: any, index: number) => {
        doc.text(`${index + 1}. ${item.descricao} - R$ ${this.formatBRL(item.valorTotal)}`);
      });
      doc.moveDown(0.5);
      const subtotal = os.itens.reduce((sum: number, item: any) => sum + item.valorTotal, 0);
      doc.text(`Subtotal: R$ ${this.formatBRL(subtotal)}`);

      let total = subtotal;
      if (os.desconto != null && os.descontoTipo) {
        if (os.descontoTipo === 'PERCENTUAL') {
          const valorDesconto = subtotal * os.desconto / 100;
          doc.text(`Desconto: ${os.desconto}% (-R$ ${this.formatBRL(valorDesconto)})`);
          total = subtotal - valorDesconto;
        } else {
          doc.text(`Desconto: -R$ ${this.formatBRL(os.desconto)}`);
          total = subtotal - os.desconto;
        }
      }
      doc.fontSize(13).text(`TOTAL: R$ ${this.formatBRL(total)}`, { align: 'right' });
      doc.moveDown(1);

      if (os.formaPagamento) {
        doc.text(`Forma de Pagamento: ${os.formaPagamento}`);
        doc.moveDown(1);
      }
    }

    doc.moveDown(3);
    doc.fontSize(11).text('_________________________________', { align: 'center' });
    doc.text('Assinatura do Cliente', { align: 'center' });
    doc.moveDown(1);
    doc.text('_________________________________', { align: 'center' });
    doc.text('Assinatura do Tecnico', { align: 'center' });

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  // ===========================================================================
  // RELATORIOS DE LISTA COM MODO
  // ===========================================================================

  async generateOSByPeriodReport(
    dataInicio: string,
    dataFim: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59.999`);

    const osList = await this.queryOSListWithIncludes(
      { dataEntrada: { gte: inicio, lte: fim } },
      modo,
      { dataEntrada: 'desc' }
    );

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(
      `OS_por_Periodo_${this.toLocalDateStr(inicio)}_${this.toLocalDateStr(fim)}.pdf`
    );
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'OS POR PERIODO');

    doc.fontSize(12).text(
      `Periodo: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`
    );
    doc.moveDown(1);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    this.renderOSList(doc, osList, modo);

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateFinancialReport(
    dataInicio: string,
    dataFim: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59.999`);

    const osList = await this.queryOSListWithIncludes(
      {
        dataConclusao: { gte: inicio, lte: fim },
        status: { in: ['CONCLUIDA', 'ENTREGUE'] },
      },
      modo,
      { dataConclusao: 'desc' }
    );

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(
      `Relatorio_Financeiro_${this.toLocalDateStr(inicio)}_${this.toLocalDateStr(fim)}.pdf`
    );
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'RELATORIO FINANCEIRO');

    doc.fontSize(12).text(
      `Periodo: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`
    );
    doc.moveDown(1);

    doc.fontSize(14).text('RESUMO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total de OS concluidas: ${osList.length}`);
    const faturamento = osList.reduce((sum: number, os: any) => sum + this.calcularTotalComDesconto(os), 0);
    doc.text(`Faturamento Total: R$ ${this.formatBRL(faturamento)}`);
    const ticketMedio = osList.length > 0 ? faturamento / osList.length : 0;
    doc.text(`Ticket Medio: R$ ${this.formatBRL(ticketMedio)}`);

    const pagamentoMap: Record<string, { count: number; total: number }> = {};
    osList.forEach((os: any) => {
      const fp = os.formaPagamento || 'NAO_INFORMADO';
      if (!pagamentoMap[fp]) pagamentoMap[fp] = { count: 0, total: 0 };
      pagamentoMap[fp].count++;
      pagamentoMap[fp].total += this.calcularTotalComDesconto(os);
    });

    if (Object.keys(pagamentoMap).length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text('Por Forma de Pagamento:', { underline: true });
      Object.entries(pagamentoMap).forEach(([fp, data]) => {
        const label = fp === 'NAO_INFORMADO' ? 'Nao informado' : (this.FORMA_PAGAMENTO_LABEL[fp] || fp);
        doc.text(`  ${label}: ${data.count} OS - R$ ${this.formatBRL(data.total)}`);
      });
    }
    doc.moveDown(1);

    if (modo === 'analitico' && osList.length > 0) {
      this.renderOSList(doc, osList, 'analitico');
    }

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateOSByClientReport(
    clienteId: number,
    dataInicio?: string,
    dataFim?: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) throw new Error('Cliente nao encontrado');

    const where: any = { clienteId };
    if (dataInicio && dataFim) {
      where.dataEntrada = {
        gte: new Date(`${dataInicio}T00:00:00`),
        lte: new Date(`${dataFim}T23:59:59.999`),
      };
    }

    const osList = await this.queryOSListWithIncludes(where, modo, { dataEntrada: 'desc' });

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const label = cliente.nome.replace(/[^a-zA-Z0-9]/g, '_');
    const outputPath = outputPathOverride ?? this.getOutputPath(`OS_por_Cliente_${label}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'OS POR CLIENTE');

    doc.fontSize(14).text('CLIENTE', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Nome: ${cliente.nome}`);
    doc.text(`CPF/CNPJ: ${cliente.cpfCnpj}`);
    doc.text(`Telefone: ${cliente.telefone || '-'}`);
    doc.text(`E-mail: ${cliente.email || '-'}`);

    if (dataInicio && dataFim) {
      doc.moveDown(0.5);
      doc.fontSize(11).text(
        `Periodo: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`
      );
    }
    doc.moveDown(1);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    this.renderOSList(doc, osList, modo);

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateEquipmentHistoryReport(
    equipamentoId: number,
    dataInicio?: string,
    dataFim?: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const equipamento = await prisma.equipamento.findUnique({
      where: { id: equipamentoId },
      include: { cliente: true },
    });
    if (!equipamento) throw new Error('Equipamento nao encontrado');

    const where: any = { equipamentoId };
    if (dataInicio && dataFim) {
      where.dataEntrada = {
        gte: new Date(`${dataInicio}T00:00:00`),
        lte: new Date(`${dataFim}T23:59:59.999`),
      };
    }

    const osList = await this.queryOSListWithIncludes(where, modo, { dataEntrada: 'desc' });

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const label = `${equipamento.marca}_${equipamento.modelo}_${equipamento.etiqueta}`.replace(/[^a-zA-Z0-9]/g, '_');
    const outputPath = outputPathOverride ?? this.getOutputPath(`Historico_Equipamento_${label}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'HISTORICO DO EQUIPAMENTO');

    doc.fontSize(14).text('EQUIPAMENTO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Etiqueta: ${equipamento.etiqueta}`);
    doc.text(`Tipo: ${equipamento.tipo}`);
    doc.text(`Marca: ${equipamento.marca}`);
    doc.text(`Modelo: ${equipamento.modelo}`);
    doc.text(`N Serie: ${equipamento.numeroSerie || '-'}`);
    doc.moveDown(0.5);
    doc.text(`Cliente: ${equipamento.cliente?.nome || '-'}`);
    doc.text(`CPF/CNPJ: ${equipamento.cliente?.cpfCnpj || '-'}`);

    if (dataInicio && dataFim) {
      doc.moveDown(0.5);
      doc.fontSize(11).text(
        `Periodo: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`
      );
    }
    doc.moveDown(1);

    doc.fontSize(11).text(`Total de intervencoes: ${osList.length}`);
    doc.moveDown(0.3);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    this.renderOSList(doc, osList, modo);

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateOSByStatusReport(
    status: string,
    dataInicio: string,
    dataFim: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59.999`);

    const osList = await this.queryOSListWithIncludes(
      { status, dataEntrada: { gte: inicio, lte: fim } },
      modo,
      { dataEntrada: 'desc' }
    );

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const statusLabel = status.replace(/_/g, ' ');
    const outputPath = outputPathOverride ?? this.getOutputPath(
      `OS_por_Status_${status}_${this.toLocalDateStr(inicio)}_${this.toLocalDateStr(fim)}.pdf`
    );
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'OS POR STATUS');

    doc.fontSize(12).text(
      `Status: ${statusLabel}  |  Periodo: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`
    );
    doc.moveDown(1);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    this.renderOSList(doc, osList, modo);

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateServicosRealizadosReport(
    dataInicio: string,
    dataFim: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59.999`);

    const itens = await prisma.itemOS.findMany({
      where: {
        tipoItem: 'SERVICO',
        os: { dataEntrada: { gte: inicio, lte: fim } },
      },
      include: {
        os: { include: { cliente: true, equipamento: true } },
      },
    });

    const servicoIds = [...new Set(itens.map((i: any) => i.referenciaId).filter(Boolean))] as number[];
    const catalogo = servicoIds.length > 0
      ? await prisma.servico.findMany({ where: { id: { in: servicoIds } } })
      : [];
    const catalogoMap = new Map(catalogo.map((s: any) => [s.id, s.nome]));

    const groupMap = new Map<number, { nome: string; count: number; total: number; itens: typeof itens }>();
    for (const item of itens) {
      const g = groupMap.get(item.referenciaId) || {
        nome: catalogoMap.get(item.referenciaId) || item.descricao,
        count: 0,
        total: 0,
        itens: [],
      };
      g.count += item.quantidade;
      g.total += item.valorTotal;
      g.itens.push(item);
      groupMap.set(item.referenciaId, g);
    }

    const sorted = [...groupMap.values()].sort((a, b) => b.total - a.total);

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(
      `Servicos_Realizados_${this.toLocalDateStr(inicio)}_${this.toLocalDateStr(fim)}.pdf`
    );
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'SERVICOS REALIZADOS');

    doc.fontSize(12).text(
      `Periodo: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`
    );
    doc.moveDown(1);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    if (sorted.length === 0) {
      doc.fontSize(11).text('Nenhum servico encontrado no periodo.');
    } else {
      doc.fontSize(14).text(`Total de servicos distintos: ${sorted.length}`, { underline: true });
      doc.moveDown(0.5);

      if (modo === 'simplificado') {
        doc.fontSize(11);
        sorted.forEach((g, i) => {
          doc.text(
            `${i + 1}. ${g.nome} - ${g.count}x - R$ ${this.formatBRL(g.total)}`
          );
        });
      } else {
        doc.fontSize(11);
        sorted.forEach((g) => {
          doc.text(`Servico: ${g.nome}`, { underline: true });
          doc.text(`  Quantidade total: ${g.count}`);
          doc.text(`  Valor total: R$ ${this.formatBRL(g.total)}`);
          doc.moveDown(0.3);
          doc.text('  OS relacionadas:');
          const osLabels = g.itens.map((i: any) => `OS ${i.os.numeroOS} - ${i.os.cliente?.nome || '-'}`);
          const osSet = new Set(osLabels);
          osSet.forEach((label: any) => doc.text(`    - ${label}`));
          doc.moveDown(0.5);
        });
      }
    }

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generatePecasUtilizadasReport(
    dataInicio: string,
    dataFim: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59.999`);

    const itens = await prisma.itemOS.findMany({
      where: {
        tipoItem: 'PECA',
        os: { dataEntrada: { gte: inicio, lte: fim } },
      },
      include: {
        os: { include: { cliente: true, equipamento: true } },
      },
    });

    const pecaIds = [...new Set(itens.map((i: any) => i.referenciaId).filter(Boolean))] as number[];
    const catalogo = pecaIds.length > 0
      ? await prisma.peca.findMany({ where: { id: { in: pecaIds } } })
      : [];
    const catalogoMap = new Map(catalogo.map((p: any) => [p.id, p.nome]));

    const groupMap = new Map<number, { nome: string; count: number; total: number; itens: typeof itens }>();
    for (const item of itens) {
      const g = groupMap.get(item.referenciaId) || {
        nome: catalogoMap.get(item.referenciaId) || item.descricao,
        count: 0,
        total: 0,
        itens: [],
      };
      g.count += item.quantidade;
      g.total += item.valorTotal;
      g.itens.push(item);
      groupMap.set(item.referenciaId, g);
    }

    const sorted = [...groupMap.values()].sort((a, b) => b.total - a.total);

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(
      `Pecas_Utilizadas_${this.toLocalDateStr(inicio)}_${this.toLocalDateStr(fim)}.pdf`
    );
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'PECAS UTILIZADAS');

    doc.fontSize(12).text(
      `Periodo: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`
    );
    doc.moveDown(1);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    if (sorted.length === 0) {
      doc.fontSize(11).text('Nenhuma peca encontrada no periodo.');
    } else {
      doc.fontSize(14).text(`Total de pecas distintas: ${sorted.length}`, { underline: true });
      doc.moveDown(0.5);

      if (modo === 'simplificado') {
        doc.fontSize(11);
        sorted.forEach((g, i) => {
          doc.text(
            `${i + 1}. ${g.nome} - ${g.count}x - R$ ${this.formatBRL(g.total)}`
          );
        });
      } else {
        doc.fontSize(11);
        sorted.forEach((g) => {
          doc.text(`Peca: ${g.nome}`, { underline: true });
          doc.text(`  Quantidade total: ${g.count}`);
          doc.text(`  Valor total: R$ ${this.formatBRL(g.total)}`);
          doc.moveDown(0.3);
          doc.text('  OS relacionadas:');
          const osLabels = g.itens.map((i: any) => `OS ${i.os.numeroOS} - ${i.os.cliente?.nome || '-'}`);
          const osSet = new Set(osLabels);
          osSet.forEach((label: any) => doc.text(`    - ${label}`));
          doc.moveDown(0.5);
        });
      }
    }

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateClientesRecorrentesReport(
    dataInicio: string,
    dataFim: string,
    modo: ModoRelatorio = 'analitico',
    outputPathOverride?: string
  ): Promise<string> {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59.999`);

    const osList = await this.queryOSListWithIncludes(
      { dataEntrada: { gte: inicio, lte: fim } },
      modo,
      { dataEntrada: 'desc' }
    );

    const clienteMap = new Map<number, { cliente: any; osList: any[]; total: number }>();
    for (const os of osList) {
      const c = clienteMap.get(os.clienteId) || {
        cliente: os.cliente,
        osList: [],
        total: 0,
      };
      c.osList.push(os);
      c.total += this.calcularTotalComDesconto(os);
      clienteMap.set(os.clienteId, c);
    }

    const sorted = [...clienteMap.values()].sort((a, b) => b.osList.length - a.osList.length);

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 50 });
    const outputPath = outputPathOverride ?? this.getOutputPath(
      `Clientes_Recorrentes_${this.toLocalDateStr(inicio)}_${this.toLocalDateStr(fim)}.pdf`
    );
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);
    this.setupFont(doc);
    this.setupFooter(doc);

    this.addHeader(doc, 'CLIENTES RECORRENTES');

    doc.fontSize(12).text(
      `Periodo: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`
    );
    doc.moveDown(1);

    doc.fontSize(11).text(`Modo: ${modo === 'simplificado' ? 'Simplificado' : 'Analitico'}`);
    doc.moveDown(0.5);

    if (sorted.length === 0) {
      doc.fontSize(11).text('Nenhum cliente encontrado no periodo.');
    } else {
      doc.fontSize(14).text(`Total de clientes: ${sorted.length}`, { underline: true });
      doc.moveDown(0.5);

      if (modo === 'simplificado') {
        doc.fontSize(11);
        sorted.forEach((g, i) => {
          const label = g.cliente?.nome || 'Desconhecido';
          const cpf = g.cliente?.cpfCnpj || '-';
          doc.text(
            `${i + 1}. ${label} (${cpf}) - ${g.osList.length} OS - R$ ${this.formatBRL(g.total)}`
          );
        });
      } else {
        sorted.forEach((g) => {
          const label = g.cliente?.nome || 'Desconhecido';
          doc.fontSize(12).text(`Cliente: ${label}`, { underline: true });
          doc.fontSize(11);
          doc.text(`  CPF/CNPJ: ${g.cliente?.cpfCnpj || '-'}`);
          doc.text(`  Total de OS: ${g.osList.length}`);
          doc.text(`  Valor total: R$ ${this.formatBRL(g.total)}`);
          doc.moveDown(0.3);
          doc.text('  OS realizadas:');
          g.osList.forEach((os: any) => {
            const status = os.status.replace(/_/g, ' ');
            const data = new Date(os.dataEntrada).toLocaleDateString('pt-BR');
            doc.text(`    - OS ${os.numeroOS} [${status}] - ${data} - R$ ${this.formatBRL(this.calcularTotalComDesconto(os))}`);
          });
          doc.moveDown(0.5);
        });
      }
    }

    this.finalizeFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  // ===========================================================================
  // UTILITARIOS
  // ===========================================================================

  private calcularTotalComDesconto(os: any): number {
    const subtotal = (os.itens || []).reduce((s: number, item: any) => s + item.valorTotal, 0);
    if (os.desconto && os.descontoTipo) {
      if (os.descontoTipo === 'PERCENTUAL') {
        return subtotal * (1 - os.desconto / 100);
      }
      return subtotal - os.desconto;
    }
    return subtotal;
  }

  private formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private readonly FORMA_PAGAMENTO_LABEL: Record<string, string> = {
    PIX: 'Pix',
    ESPECIE: 'Especie',
    DEBITO: 'Debito',
    CREDITO: 'Credito',
  };
}

export const pdfService = new PDFService();
