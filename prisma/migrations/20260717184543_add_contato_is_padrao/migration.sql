-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cliente_contato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "isPadrao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cliente_contato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cliente_contato" ("ativo", "clienteId", "email", "id", "nome", "telefone") SELECT "ativo", "clienteId", "email", "id", "nome", "telefone" FROM "cliente_contato";
DROP TABLE "cliente_contato";
ALTER TABLE "new_cliente_contato" RENAME TO "cliente_contato";
CREATE UNIQUE INDEX "cliente_contato_email_key" ON "cliente_contato"("email");
CREATE INDEX "cliente_contato_email_idx" ON "cliente_contato"("email");
CREATE INDEX "cliente_contato_clienteId_idx" ON "cliente_contato"("clienteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
