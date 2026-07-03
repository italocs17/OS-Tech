/**
 * OS.Tech - Servico de Usuario
 * Regras de negocio para a entidade Usuario.
 */

import { UsuarioRepository } from '../database/repositories/usuario.repository';
import { createUsuarioSchema, updateUsuarioSchema, loginSchema } from '../validators/usuario.validator';
import { hashPassword, verifyPassword } from './password.service';
import { registrar } from './log.service';
import type { CreateUsuarioDTO, UpdateUsuarioDTO } from '@shared/types/entities.types';

export class UsuarioService {
  private repository = new UsuarioRepository();

  async list() {
    return this.repository.findMany();
  }

  async getById(id: number) {
    const usuario = await this.repository.findById(id);
    if (!usuario) throw new Error('Usuario nao encontrado');
    return usuario;
  }

  async create(data: Omit<CreateUsuarioDTO, 'senhaHash'> & { senha: string }) {
    const validated = createUsuarioSchema.parse(data);
    const existing = await this.repository.findByLogin(validated.login);
    if (existing) throw new Error('Login ja cadastrado');

    const senhaHash = hashPassword(validated.senha);
    return this.repository.create({
      nome: validated.nome,
      login: validated.login,
      senhaHash,
      perfil: validated.perfil,
    });
  }

  async update(id: number, data: UpdateUsuarioDTO) {
    await this.getById(id);
    const validated = updateUsuarioSchema.parse(data);

    const updateData: Record<string, unknown> = {};
    if (validated.nome) updateData.nome = validated.nome;
    if (validated.perfil) updateData.perfil = validated.perfil;
    if (validated.ativo !== undefined) updateData.ativo = validated.ativo;
    if (validated.senha) updateData.senhaHash = hashPassword(validated.senha);

    return this.repository.update(id, updateData);
  }

  async delete(id: number) {
    await this.getById(id);
    return this.repository.update(id, { ativo: false });
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const usuario = await this.getById(id);
    if (!verifyPassword(currentPassword, usuario.senhaHash)) {
      throw new Error('Senha atual incorreta');
    }
    const senhaHash = hashPassword(newPassword);
    await this.repository.update(id, { senhaHash });
    await registrar({
      nivel: 'INFO',
      categoria: 'AUTH',
      acao: 'CHANGE_PASSWORD',
      descricao: `Senha alterada para usuario ${usuario.login}`,
      usuarioId: id,
    });
  }

  async login(login: string, senha: string) {
    const validated = loginSchema.parse({ login, senha });
    const usuario = await this.repository.findByLogin(validated.login);

    if (!usuario || !usuario.ativo) {
      throw new Error('Credenciais invalidas');
    }

    if (!verifyPassword(validated.senha, usuario.senhaHash)) {
      throw new Error('Credenciais invalidas');
    }

    return usuario;
  }

  async count() {
    return this.repository.count();
  }
}
