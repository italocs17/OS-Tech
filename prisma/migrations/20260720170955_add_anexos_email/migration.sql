-- CreateTable
CREATE TABLE "anexo_email" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailSolicitacaoId" INTEGER NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT,
    "dataUpload" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "anexo_email_emailSolicitacaoId_fkey" FOREIGN KEY ("emailSolicitacaoId") REFERENCES "email_solicitacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "anexo_email_emailSolicitacaoId_idx" ON "anexo_email"("emailSolicitacaoId");
