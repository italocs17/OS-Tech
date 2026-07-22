const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const mdPath = path.join(__dirname, '..', 'docs', 'MapaLogico.md');
const outPath = path.join(__dirname, '..', 'docs', 'MapaLogico.pdf');
const md = fs.readFileSync(mdPath, 'utf-8');

const doc = new PDFDocument({
  size: 'A4',
  margin: 50,
  bufferPages: true,
  info: {
    Title: 'OS.Tech v2.3.3 — Mapa de Lógica e Regras de Negócio',
    Author: 'OS.Tech',
  },
});

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
const fontBold = 'C:\\Windows\\Fonts\\arialbd.ttf';
const fontMono = 'C:\\Windows\\Fonts\\consola.ttf';

doc.registerFont(' regular', fontPath);
doc.registerFont('Bold', fontBold);
doc.registerFont('Mono', fontMono);

const PAGE_W = doc.page.width - 100;
let y = 50;

function newPage() {
  doc.addPage();
  y = 50;
}

function ensureSpace(needed) {
  if (y + needed > doc.page.height - 60) newPage();
}

function drawFooter() {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font(' regular').fontSize(8).fillColor('#888');
    doc.text(`OS.Tech — Mapa de Lógico v2.3.3  |  Página ${i + 1}`, 50, doc.page.height - 40, { width: PAGE_W, align: 'center' });
  }
}

const lines = md.split('\n');
let i = 0;
let inCodeBlock = false;
let codeBuffer = [];

while (i < lines.length) {
  const line = lines[i];

  if (line.startsWith('```')) {
    if (inCodeBlock) {
      const codeText = codeBuffer.join('\n');
      ensureSpace(Math.min(codeBuffer.length * 14 + 20, 400));
      doc.font('Mono').fontSize(8).fillColor('#1a1a1a');
      doc.rect(doc.x - 5, y - 3, PAGE_W + 10, codeBuffer.length * 13 + 10).fill('#f5f5f5');
      doc.fillColor('#1a1a1a');
      for (const cl of codeBuffer) {
        doc.font('Mono').fontSize(8).text(cl, 55, y, { width: PAGE_W - 10, lineGap: 2 });
        y += 13;
      }
      y += 8;
      inCodeBlock = false;
      codeBuffer = [];
    } else {
      inCodeBlock = true;
      codeBuffer = [];
    }
    i++;
    continue;
  }

  if (inCodeBlock) {
    codeBuffer.push(line);
    i++;
    continue;
  }

  const trimmed = line.trim();

  if (trimmed === '') {
    y += 6;
    i++;
    continue;
  }

  if (trimmed.startsWith('# ')) {
    ensureSpace(40);
    y += 10;
    doc.font('Bold').fontSize(20).fillColor('#1a1a1a');
    doc.text(trimmed.replace(/^# /, ''), 50, y, { width: PAGE_W });
    y += doc.heightOfString(trimmed.replace(/^# /, ''), { width: PAGE_W }) + 12;
    doc.moveTo(50, y).lineTo(50 + PAGE_W, y).lineWidth(1.5).strokeColor('#333').stroke();
    y += 10;
    i++;
    continue;
  }

  if (trimmed.startsWith('## ')) {
    ensureSpace(35);
    y += 8;
    doc.font('Bold').fontSize(15).fillColor('#1a1a1a');
    doc.text(trimmed.replace(/^## /, ''), 50, y, { width: PAGE_W });
    y += doc.heightOfString(trimmed.replace(/^## /, ''), { width: PAGE_W }) + 6;
    doc.moveTo(50, y).lineTo(50 + PAGE_W, y).lineWidth(0.8).strokeColor('#999').stroke();
    y += 8;
    i++;
    continue;
  }

  if (trimmed.startsWith('### ')) {
    ensureSpace(25);
    y += 6;
    doc.font('Bold').fontSize(12).fillColor('#333');
    doc.text(trimmed.replace(/^### /, ''), 50, y, { width: PAGE_W });
    y += doc.heightOfString(trimmed.replace(/^### /, ''), { width: PAGE_W }) + 6;
    i++;
    continue;
  }

  if (trimmed.startsWith('---')) {
    ensureSpace(15);
    y += 5;
    doc.moveTo(50, y).lineTo(50 + PAGE_W, y).lineWidth(0.5).strokeColor('#ccc').stroke();
    y += 10;
    i++;
    continue;
  }

  if (trimmed.startsWith('| ') && trimmed.includes('|')) {
    const cells = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
    if (cells.every(c => /^[-:]+$/.test(c))) {
      i++;
      continue;
    }

    const isHeader = i === 0 || (i > 0 && lines[i - 1].trim().startsWith('|'));
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const isFirstRow = !prevLine.startsWith('|');

    if (isFirstRow) {
      ensureSpace(25);
    } else {
      ensureSpace(18);
    }

    const colCount = cells.length;
    const colWidth = Math.floor(PAGE_W / colCount);

    if (isFirstRow) {
      doc.rect(50, y, PAGE_W, 18).fill('#e8e8e8');
      doc.fillColor('#1a1a1a');
    }

    for (let c = 0; c < colCount; c++) {
      const cx = 55 + c * colWidth;
      if (isFirstRow) {
        doc.font('Bold').fontSize(8);
      } else {
        doc.font(' regular').fontSize(8);
      }
      doc.fillColor('#1a1a1a');
      doc.text(cells[c], cx, y + 4, { width: colWidth - 8, lineGap: 1 });
    }

    y += 18;
    i++;
    continue;
  }

  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    ensureSpace(18);
    const text = trimmed.replace(/^[-*] /, '');
    doc.font(' regular').fontSize(9).fillColor('#1a1a1a');
    doc.text('  •  ' + text, 55, y, { width: PAGE_W - 10, lineGap: 2 });
    y += doc.heightOfString('  •  ' + text, { width: PAGE_W - 10, lineGap: 2 }) + 3;
    i++;
    continue;
  }

  if (/^\d+\.\s/.test(trimmed)) {
    ensureSpace(18);
    doc.font(' regular').fontSize(9).fillColor('#1a1a1a');
    doc.text('  ' + trimmed, 55, y, { width: PAGE_W - 10, lineGap: 2 });
    y += doc.heightOfString('  ' + trimmed, { width: PAGE_W - 10, lineGap: 2 }) + 3;
    i++;
    continue;
  }

  if (trimmed.startsWith('> ')) {
    ensureSpace(18);
    const text = trimmed.replace(/^> /, '');
    doc.font(' regular').fontSize(9).fillColor('#555');
    doc.text('  "' + text + '"', 65, y, { width: PAGE_W - 20, lineGap: 2 });
    y += doc.heightOfString('  "' + text + '"', { width: PAGE_W - 20, lineGap: 2 }) + 4;
    i++;
    continue;
  }

  ensureSpace(18);
  doc.font(' regular').fontSize(9).fillColor('#1a1a1a');
  doc.text(trimmed, 50, y, { width: PAGE_W, lineGap: 2 });
  y += doc.heightOfString(trimmed, { width: PAGE_W, lineGap: 2 }) + 4;
  i++;
}

drawFooter();
doc.end();

stream.on('finish', () => {
  console.log('PDF gerado:', outPath);
});

stream.on('error', (err) => {
  console.error('Erro ao gerar PDF:', err);
  process.exit(1);
});
