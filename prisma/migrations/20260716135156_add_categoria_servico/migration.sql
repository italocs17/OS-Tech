-- CreateTable
CREATE TABLE "categoria_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "valorPadrao" REAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" INTEGER,
    CONSTRAINT "servico_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_servico" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_servico" ("ativo", "descricao", "id", "valorPadrao") SELECT "ativo", "descricao", "id", "valorPadrao" FROM "servico";
DROP TABLE "servico";
ALTER TABLE "new_servico" RENAME TO "servico";
CREATE INDEX "servico_descricao_idx" ON "servico"("descricao");
CREATE INDEX "servico_categoriaId_idx" ON "servico"("categoriaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "categoria_servico_nome_key" ON "categoria_servico"("nome");
