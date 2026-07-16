-- RedefineIndex
DROP INDEX "cliente_cpf_key";
CREATE UNIQUE INDEX "cliente_cpfCnpj_key" ON "cliente"("cpfCnpj");
