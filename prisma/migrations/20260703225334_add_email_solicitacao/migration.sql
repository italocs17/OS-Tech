-- CreateTable
CREATE TABLE "cliente_contato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cliente_contato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_solicitacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailRemetente" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpoTexto" TEXT NOT NULL,
    "dataRecebimento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensagemId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clienteId" INTEGER,
    "contatoId" INTEGER,
    "osId" INTEGER,
    "usuarioAprovadorId" INTEGER,
    "dataProcessamento" DATETIME,
    "observacoes" TEXT,
    CONSTRAINT "email_solicitacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_solicitacao_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "cliente_contato" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_solicitacao_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordem_servico" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_solicitacao_usuarioAprovadorId_fkey" FOREIGN KEY ("usuarioAprovadorId") REFERENCES "usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_contato_email_key" ON "cliente_contato"("email");

-- CreateIndex
CREATE INDEX "cliente_contato_email_idx" ON "cliente_contato"("email");

-- CreateIndex
CREATE INDEX "cliente_contato_clienteId_idx" ON "cliente_contato"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "email_solicitacao_mensagemId_key" ON "email_solicitacao"("mensagemId");

-- CreateIndex
CREATE INDEX "email_solicitacao_status_idx" ON "email_solicitacao"("status");

-- CreateIndex
CREATE INDEX "email_solicitacao_emailRemetente_idx" ON "email_solicitacao"("emailRemetente");

-- CreateIndex
CREATE INDEX "email_solicitacao_dataRecebimento_idx" ON "email_solicitacao"("dataRecebimento");
