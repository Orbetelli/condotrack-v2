import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AdminService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────

  async getStats() {
    const [condominios, usuarios, entregas] = await Promise.all([
      this.supabase.from('condominios').select('id, status'),
      this.supabase.from('usuarios').select('id, perfil, status'),
      this.supabase.from('entregas').select('id, status'),
    ]);

    const c = condominios.data || [];
    const u = usuarios.data || [];
    const e = entregas.data || [];

    return {
      condominios: {
        total:  c.length,
        ativos: c.filter(x => x.status === 'ativo').length,
      },
      usuarios: {
        total:    u.length,
        sindicos: u.filter(x => x.perfil === 'sindico').length,
        porteiros: u.filter(x => x.perfil === 'porteiro').length,
        moradores: u.filter(x => x.perfil === 'morador').length,
      },
      entregas: {
        total:     e.length,
        pendentes: e.filter(x => ['aguardando', 'notificado'].includes(x.status)).length,
      },
    };
  }

  // ── Condomínios ───────────────────────────────────────────────

  async getCondominios() {
    const { data, error } = await this.supabase
      .from('condominios')
      .select('id, nome, endereco, cidade, uf, status, criado_em')
      .order('criado_em', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async criarCondominio(dto: {
    nome: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    cnpj?: string;
  }) {
    const { data, error } = await this.supabase
      .from('condominios')
      .insert({ ...dto, status: 'ativo' })
      .select('id, nome, status')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async atualizarStatusCondominio(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('condominios')
      .update({ status })
      .eq('id', id)
      .select('id, nome, status')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ── Usuários ──────────────────────────────────────────────────

  async getUsuarios() {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, auth_id, nome, email, perfil, status, condominios(nome)')
      .order('nome');

    if (error) throw new BadRequestException(error.message);

    return (data || []).map(u => ({
      ...u,
      condominio: (u.condominios as any)?.nome || '—',
    }));
  }

  async resetarSenha(authId: string, novaSenha: string) {
    const { error } = await this.supabase.auth.admin.updateUserById(authId, {
      password: novaSenha,
    });

    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  async atualizarStatusUsuario(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update({ status })
      .eq('id', id)
      .select('id, nome, status')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ── Criar Síndico ─────────────────────────────────────────────

  async criarSindico(dto: {
    nome: string;
    email: string;
    senha: string;
    condominioId: string;
  }) {
    // 1. Cria no Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email:         dto.email,
      password:      dto.senha,
      email_confirm: true,
    });

    if (authError) throw new BadRequestException(authError.message);

    // 2. Insere na tabela usuarios
    const { error: dbError } = await this.supabase.from('usuarios').insert({
      auth_id:       authData.user.id,
      condominio_id: dto.condominioId,
      perfil:        'sindico',
      nome:          dto.nome,
      email:         dto.email,
      status:        'ativo',
    });

    if (dbError) {
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException(dbError.message);
    }

    // 3. Ativa o condomínio
    await this.supabase.from('condominios')
      .update({ status: 'ativo' })
      .eq('id', dto.condominioId);

    return { ok: true, userId: authData.user.id };
  }
}