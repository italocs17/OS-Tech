-- CreateTable
CREATE TABLE "contrato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "contrato_clienteId_idx" ON "contrato"("clienteId");

-- CreateIndex
CREATE INDEX "contrato_dataFim_idx" ON "contrato"("dataFim");

-- CreateIndex
CREATE INDEX "contrato_status_idx" ON "contrato"("status");
