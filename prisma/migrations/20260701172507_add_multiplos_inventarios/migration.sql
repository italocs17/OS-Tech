-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_inventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "osId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'MANUAL',
    "dataCaptura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jsonCompleto" TEXT NOT NULL,
    CONSTRAINT "inventario_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordem_servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_inventario" ("dataCaptura", "id", "jsonCompleto", "osId") SELECT "dataCaptura", "id", "jsonCompleto", "osId" FROM "inventario";
DROP TABLE "inventario";
ALTER TABLE "new_inventario" RENAME TO "inventario";
CREATE INDEX "inventario_osId_idx" ON "inventario"("osId");
CREATE INDEX "inventario_dataCaptura_idx" ON "inventario"("dataCaptura");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
