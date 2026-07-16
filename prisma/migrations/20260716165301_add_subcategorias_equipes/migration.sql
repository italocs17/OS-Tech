-- CreateTable
CREATE TABLE "subcategoria_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" INTEGER NOT NULL,
    CONSTRAINT "subcategoria_servico_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_servico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "equipe_categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "equipeId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    CONSTRAINT "equipe_categoria_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "equipe_categoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuario_equipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "equipeId" INTEGER NOT NULL,
    CONSTRAINT "usuario_equipe_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usuario_equipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ordem_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroOS" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "equipamentoId" INTEGER,
    "tecnicoId" INTEGER,
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
    CONSTRAINT "ordem_servico_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ordem_servico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ordem_servico" ("clienteId", "dataConclusao", "dataEntrada", "dataPrevisao", "desconto", "descontoTipo", "equipamentoId", "formaPagamento", "id", "numeroOS", "observacoes", "status", "tipoAtendimento") SELECT "clienteId", "dataConclusao", "dataEntrada", "dataPrevisao", "desconto", "descontoTipo", "equipamentoId", "formaPagamento", "id", "numeroOS", "observacoes", "status", "tipoAtendimento" FROM "ordem_servico";
DROP TABLE "ordem_servico";
ALTER TABLE "new_ordem_servico" RENAME TO "ordem_servico";
CREATE UNIQUE INDEX "ordem_servico_numeroOS_key" ON "ordem_servico"("numeroOS");
CREATE INDEX "ordem_servico_clienteId_idx" ON "ordem_servico"("clienteId");
CREATE INDEX "ordem_servico_equipamentoId_idx" ON "ordem_servico"("equipamentoId");
CREATE INDEX "ordem_servico_tecnicoId_idx" ON "ordem_servico"("tecnicoId");
CREATE INDEX "ordem_servico_status_idx" ON "ordem_servico"("status");
CREATE INDEX "ordem_servico_dataEntrada_idx" ON "ordem_servico"("dataEntrada");
CREATE TABLE "new_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "valorPadrao" REAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" INTEGER,
    "subcategoriaId" INTEGER,
    CONSTRAINT "servico_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_servico" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "servico_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "subcategoria_servico" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_servico" ("ativo", "categoriaId", "descricao", "id", "valorPadrao") SELECT "ativo", "categoriaId", "descricao", "id", "valorPadrao" FROM "servico";
DROP TABLE "servico";
ALTER TABLE "new_servico" RENAME TO "servico";
CREATE INDEX "servico_descricao_idx" ON "servico"("descricao");
CREATE INDEX "servico_categoriaId_idx" ON "servico"("categoriaId");
CREATE INDEX "servico_subcategoriaId_idx" ON "servico"("subcategoriaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "subcategoria_servico_categoriaId_idx" ON "subcategoria_servico"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "subcategoria_servico_nome_categoriaId_key" ON "subcategoria_servico"("nome", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "equipe_nome_key" ON "equipe"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "equipe_categoria_equipeId_categoriaId_key" ON "equipe_categoria"("equipeId", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_equipe_usuarioId_equipeId_key" ON "usuario_equipe"("usuarioId", "equipeId");
