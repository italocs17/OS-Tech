# Bloco C — Relatórios Restantes + Padronização

**Vinculado ao:** `README.md` (seção Roadmap)
**Blocos anteriores:** A (Etiqueta + Cliente), B (Simplificado/Analítico) — implementados
**Status:** ⬜ Pendente

---

## Objetivo

Implementar os 4 relatórios atualmente desabilitados na página de Relatórios,
seguindo o mesmo padrão de data range + modo simplificado/analítico
estabelecido no Bloco A+B.

---

## Visão Geral

| Relatório | Dados | Query |
|-----------|-------|-------|
| **OS por Status** | Lista de OS filtrada por status + período | `findMany` com `where: { status, dataEntrada }` |
| **Serviços Realizados** | Agregação de `ItemOS` (`tipoItem = SERVICO`) agrupado por `referenciaId` | `groupBy` + lookup em `Servico` |
| **Peças Utilizadas** | Agregação de `ItemOS` (`tipoItem = PECA`) agrupado por `referenciaId` | `groupBy` + lookup em `Peca` |
| **Clientes Recorrentes** | Agregação de `OrdemServico` agrupado por `clienteId` | `groupBy` + lookup em `Cliente` |

---

## 1. OS por Status

### Como funciona
Usuário seleciona um status (ex: `CONCLUIDA`) + data range + modo.
Gera PDF listando todas as OS naquele status no período.

### Implementação
- **Reaproveita** `queryOSListWithIncludes()` e `renderOSList()` do `pdf.service.ts`
- Handler IPC: `report:os-by-status` → `generateOSByStatusReport(status, inicio, fim, modo)`
- Query: `{ status, dataEntrada: { gte: inicio, lte: fim } }`
- Sem novo método no repository — o `queryOSListWithIncludes` aceita qualquer where
- UI: modal com `<select>` de status + data range + `ModoToggle`

### Arquivos
| Arquivo | Mudança |
|---------|---------|
| `shared/constants/ipc-channels.ts` | + `OS_BY_STATUS` |
| `main/ipc/report.ipc.ts` | + handler |
| `preload/report.preload.ts` | + `osByStatus` |
| `shared/types/electron.d.ts` | + prop na `ReportAPI` |
| `main/services/pdf.service.ts` | + `generateOSByStatusReport` |
| `renderer/pages/Reports/index.tsx` | novo card + modal |

---

## 2. Serviços Realizados

### Como funciona
Agrupa todos `ItemOS` com `tipoItem = 'SERVICO'` em um período.
**Simplificado**: ranking de serviços (nome, quantidade, valor total).
**Analítico**: ranking + para cada serviço, lista de OS onde foi executado.

### Query (`ItemOSRepository`)
```typescript
async groupServicosByPeriod(inicio: Date, fim: Date) {
  const items = await prisma.itemOS.groupBy({
    by: ['referenciaId'],
    where: {
      tipoItem: 'SERVICO',
      os: { dataEntrada: { gte: inicio, lte: fim } },
    },
    _count: { _all: true },
    _sum: { valorTotal: true, quantidade: true },
    orderBy: { _count: { _all: 'desc' } },
  });

  const servicoIds = items.map(i => i.referenciaId).filter(id => id > 0);
  const servicos = await prisma.servico.findMany({ where: { id: { in: servicoIds } } });
  const map = new Map(servicos.map(s => [s.id, s.descricao]));

  return items.map(item => ({
    descricao: map.get(item.referenciaId) || '(sem catalogo)',
    vezes: item._count._all,
    total: item._sum.valorTotal ?? 0,
    quantidade: item._sum.quantidade ?? 0,
  }));
}
```

Para o modo analítico, busca os `ItemOS` com `include: { os: { select: { numeroOS, dataEntrada } } }`.

### PDF — conteúdo
**Simplificado:**
```
RELATORIO: SERVICOS REALIZADOS
Periodo: 01/01/2026 a 30/06/2026

Ranking:
1. (10x) Formatacao e Instalacao de SO — R$ 1.500,00
2.  (8x) Troca de Tela — R$ 4.000,00
...
Total: 45 servicos — R$ 18.500,00
```

**Analítico:** mesmo ranking + abaixo de cada serviço, a lista de OS:
```
1. (10x) Formatacao — R$ 1.500,00
   OS 2026/06/001 (10/01), OS 2026/06/005 (15/01), ...
```

---

## 3. Peças Utilizadas

### Como funciona
Idêntico a Serviços Realizados, mas com `tipoItem = 'PECA'` e lookup em `Peca`.

### Implementação
- Mesmo padrão de `groupBy` + lookup
- Pode compartilhar um método parametrizado: `groupItensByTipo(tipo, inicio, fim)`
- PDF: mesmo layout, adaptado para peças (fabricante, unidade vs serviço)

### PDF — conteúdo
**Simplificado:**
```
RELATORIO: PECAS UTILIZADAS
Periodo: 01/01/2026 a 30/06/2026

Ranking:
1. (15 unid.) SSD 480GB Kingston — R$ 2.250,00
2. (10 unid.) Fonte 500W Corsair — R$ 1.500,00
...
Total: 120 unidades — R$ 15.300,00
```

---

## 4. Clientes Recorrentes

### Como funciona
Agrupa `OrdemServico` por `clienteId` no período.
**Simplificado**: ranking de clientes (nome, CPF, total de OS).
**Analítico**: ranking + para cada cliente, lista de OS.

### Query
```typescript
async groupByClientInPeriod(inicio: Date, fim: Date) {
  const grouped = await prisma.ordemServico.groupBy({
    by: ['clienteId'],
    where: { dataEntrada: { gte: inicio, lte: fim } },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
  });

  const ids = grouped.map(g => g.clienteId);
  const clientes = await prisma.cliente.findMany({ where: { id: { in: ids } } });
  const map = new Map(clientes.map(c => [c.id, c]));

  return grouped.map(g => ({
    cliente: map.get(g.clienteId),
    totalOS: g._count._all,
  }));
}
```

### PDF — conteúdo
**Simplificado:**
```
RELATORIO: CLIENTES RECORRENTES
Periodo: 01/01/2026 a 30/06/2026

1. (12 OS) Joao Silva — 123.456.789-00 — (11) 99999-8888
2.  (8 OS) Maria Souza — 987.654.321-00 — (11) 88888-7777
...
Total de clientes no periodo: 50
```

**Analítico:** ranking + abaixo de cada cliente, a lista de OS.

---

## 5. Correção visual — Reports page

Os ícones emoji dos cards foram substituídos pelo primeiro caractere do título
no Bloco A+B. Reverter para os emojis originais:

| Card | Ícone |
|------|-------|
| PDF da OS | 📄 |
| OS por Período | 📅 |
| OS por Cliente | 👤 |
| Histórico do Equipamento | 🔧 |
| Faturamento | 💰 |
| OS por Status | 📊 |
| Serviços Realizados | 🔧 |
| Peças Utilizadas | 🔩 |
| Clientes Recorrentes | 👥 |

---

## Arquivos afetados (resumo)

| Arquivo | Mudança |
|---------|---------|
| `shared/constants/ipc-channels.ts` | +4 constantes (`OS_BY_STATUS`, `SERVICOS_REALIZADOS`, `PECAS_UTILIZADAS`, `CLIENTES_RECORRENTES`) |
| `main/ipc/report.ipc.ts` | +4 handlers |
| `preload/report.preload.ts` | +4 métodos |
| `shared/types/electron.d.ts` | +4 props na `ReportAPI` |
| `main/database/repositories/item-os.repository.ts` | +2 métodos (`groupServicosByPeriod`, `groupPecasByPeriod`) |
| `main/services/pdf.service.ts` | +4 métodos PDF + 2 helpers de renderização agregada |
| `renderer/pages/Reports/index.tsx` | +4 modais + reverter ícones |
| `README.md` | menção ao arquivo de planejamento |

---

## Ordem de implementação sugerida

1. **OS por Status** — menor risco, reaproveita `queryOSListWithIncludes` + `renderOSList`
2. **Clientes Recorrentes** — groupBy simples, reforça padrão de query agregada
3. **Serviços Realizados + Peças Utilizadas** — juntos, compartilham helper de groupBy parametrizado
4. **Correção dos ícones** na Reports page
