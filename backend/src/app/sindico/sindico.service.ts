import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SindicoService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async getStats(condominioId: string) {
    const [entregas, usuarios, apartamentos] = await Promise.all([
      this.supabase.from('entregas').select('id, status').eq('condominio_id', condominioId),
      this.supabase.from('usuarios').select('id, perfil, status').eq('condominio_id', condominioId),
      this.supabase.from('apartamentos').select('id, status').eq('condominio_id', condominioId),
    ]);

    const e = entregas.data || [];
    const u = usuarios.data || [];
    const a = apartamentos.data || [];

    return {
      entregas: {
        total:     e.length,
        pendentes: e.filter(x => ['aguardando', 'notificado'].includes(x.status)).length,
        retiradas: e.filter(x => x.status === 'retirado').length,
        expiradas: e.filter(x => x.status === 'expirado').length,
      },
      moradores: {
        total:  u.filter(x => x.perfil === 'morador').length,
        ativos: u.filter(x => x.perfil === 'morador' && x.status === 'ativo').length,
      },
      porteiros: {
        total:  u.filter(x => x.perfil === 'porteiro').length,
        ativos: u.filter(x => x.perfil === 'porteiro' && x.status === 'ativo').length,
      },
      apartamentos: {
        total:       a.length,
        ocupados:    a.filter(x => x.status === 'ocupado').length,
        disponiveis: a.filter(x => x.status === 'disponivel').length,
      },
    };
  }

  async getEntregas(condominioId: string, status?: string) {
    let query = this.supabase
      .from('entregas')
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em, morador_id,
        apartamentos ( numero, bloco ),
        morador:usuarios!morador_id ( nome )
      `)
      .eq('condominio_id', condominioId)
      .order('recebido_em', { ascending: false });

    if (status && status !== 'todos') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    return (data || []).map(e => ({
      id:      e.id,
      apto:    e.apartamentos ? `${(e.apartamentos as any).bloco}-${(e.apartamentos as any).numero}` : '—',
      morador: (e.morador as any)?.nome || '—',
      trans:   e.transportadora,
      volumes: e.volumes,
      status:  e.status,
      obs:     e.obs || '',
      data:    new Date(e.recebido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora:    new Date(e.recebido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      retiradoEm: e.retirado_em
        ? new Date(e.retirado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null,
    }));
  }

  async getMoradores(condominioId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nome, email, telefone, status, apartamentos(numero, bloco)')
      .eq('condominio_id', condominioId)
      .eq('perfil', 'morador')
      .order('nome');

    if (error) throw new BadRequestException(error.message);

    return (data || []).map(m => ({
      ...m,
      apto: m.apartamentos
        ? `${(m.apartamentos as any).bloco}-${(m.apartamentos as any).numero}`
        : '—',
    }));
  }

  async atualizarStatusMorador(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update({ status })
      .eq('id', id)
      .select('id, nome, status')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPorteiros(condominioId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nome, email, telefone, status, turno')
      .eq('condominio_id', condominioId)
      .eq('perfil', 'porteiro')
      .order('nome');

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async atualizarStatusPorteiro(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update({ status })
      .eq('id', id)
      .select('id, nome, status')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getApartamentos(condominioId: string) {
    const { data, error } = await this.supabase
      .from('apartamentos')
      .select('id, numero, bloco, status')
      .eq('condominio_id', condominioId)
      .order('bloco')
      .order('numero');

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }
}