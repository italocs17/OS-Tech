-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ordem_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroOS" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "equipamentoId" INTEGER,
    "tipoAtendimento" TEXT NOT NULL DEFAULT 'INTERNO',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "dataEntrada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevisao" DATETIME,
    "dataConclusao" DATETIME,
    "observacoes" TEXT,
    "desconto" REAL,
    "descontoTipo" TEXT,
    "formaPagamento" TEXT,
    CONSTRAINT "ordem_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ordem_servico_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ordem_servico" ("clienteId", "dataConclusao", "dataEntrada", "dataPrevisao", "desconto", "descontoTipo", "equipamentoId", "formaPagamento", "id", "numeroOS", "observacoes", "status") SELECT "clienteId", "dataConclusao", "dataEntrada", "dataPrevisao", "desconto", "descontoTipo", "equipamentoId", "formaPagamento", "id", "numeroOS", "observacoes", "status" FROM "ordem_servico";
DROP TABLE "ordem_servico";
ALTER TABLE "new_ordem_servico" RENAME TO "ordem_servico";
CREATE UNIQUE INDEX "ordem_servico_numeroOS_key" ON "ordem_servico"("numeroOS");
CREATE INDEX "ordem_servico_clienteId_idx" ON "ordem_servico"("clienteId");
CREATE INDEX "ordem_servico_equipamentoId_idx" ON "ordem_servico"("equipamentoId");
CREATE INDEX "ordem_servico_status_idx" ON "ordem_servico"("status");
CREATE INDEX "ordem_servico_dataEntrada_idx" ON "ordem_servico"("dataEntrada");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
