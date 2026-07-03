-- CreateTable
CREATE TABLE "cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "dataCadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "equipamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "observacoes" TEXT,
    "dataCadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "equipamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ordem_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroOS" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "equipamentoId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "dataEntrada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevisao" DATETIME,
    "dataConclusao" DATETIME,
    "observacoes" TEXT,
    CONSTRAINT "ordem_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ordem_servico_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evento_os" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "osId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "dataHora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    CONSTRAINT "evento_os_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordem_servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evento_os_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "valorPadrao" REAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "peca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "fabricante" TEXT,
    "valorReferencia" REAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "item_os" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "osId" INTEGER NOT NULL,
    "tipoItem" TEXT NOT NULL,
    "referenciaId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "valorUnitario" REAL NOT NULL,
    "valorTotal" REAL NOT NULL,
    CONSTRAINT "item_os_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordem_servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "osId" INTEGER NOT NULL,
    "dataCaptura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jsonCompleto" TEXT NOT NULL,
    CONSTRAINT "inventario_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordem_servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataHora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nivel" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuarioId" INTEGER,
    "dadosContexto" TEXT,
    "maquinaId" TEXT,
    "versaoApp" TEXT,
    CONSTRAINT "log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_cpf_key" ON "cliente"("cpf");

-- CreateIndex
CREATE INDEX "cliente_nome_idx" ON "cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "equipamento_etiqueta_key" ON "equipamento"("etiqueta");

-- CreateIndex
CREATE INDEX "equipamento_clienteId_idx" ON "equipamento"("clienteId");

-- CreateIndex
CREATE INDEX "equipamento_tipo_idx" ON "equipamento"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ordem_servico_numeroOS_key" ON "ordem_servico"("numeroOS");

-- CreateIndex
CREATE INDEX "ordem_servico_clienteId_idx" ON "ordem_servico"("clienteId");

-- CreateIndex
CREATE INDEX "ordem_servico_equipamentoId_idx" ON "ordem_servico"("equipamentoId");

-- CreateIndex
CREATE INDEX "ordem_servico_status_idx" ON "ordem_servico"("status");

-- CreateIndex
CREATE INDEX "ordem_servico_dataEntrada_idx" ON "ordem_servico"("dataEntrada");

-- CreateIndex
CREATE INDEX "evento_os_osId_idx" ON "evento_os"("osId");

-- CreateIndex
CREATE INDEX "evento_os_usuarioId_idx" ON "evento_os"("usuarioId");

-- CreateIndex
CREATE INDEX "evento_os_dataHora_idx" ON "evento_os"("dataHora");

-- CreateIndex
CREATE INDEX "servico_descricao_idx" ON "servico"("descricao");

-- CreateIndex
CREATE INDEX "peca_descricao_idx" ON "peca"("descricao");

-- CreateIndex
CREATE INDEX "item_os_osId_idx" ON "item_os"("osId");

-- CreateIndex
CREATE INDEX "item_os_tipoItem_referenciaId_idx" ON "item_os"("tipoItem", "referenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_osId_key" ON "inventario"("osId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE INDEX "usuario_perfil_idx" ON "usuario"("perfil");

-- CreateIndex
CREATE INDEX "log_dataHora_idx" ON "log"("dataHora");

-- CreateIndex
CREATE INDEX "log_nivel_idx" ON "log"("nivel");

-- CreateIndex
CREATE INDEX "log_categoria_idx" ON "log"("categoria");

-- CreateIndex
CREATE INDEX "log_usuarioId_idx" ON "log"("usuarioId");
