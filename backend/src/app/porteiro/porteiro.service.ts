import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type EntregaStatus = 'aguardando' | 'notificado' | 'entregue_porteiro' | 'retirado' | 'expirado';

export interface Entrega {
  id: string;
  apto: string;
  morador: string;
  moradorId: string | null;
  trans: string;
  data: string;
  hora: string;
  volumes: number;
  status: EntregaStatus;
  obs: string;
}

export interface CreateEntregaDto {
  apartamentoId: string;
  moradorId: string;
  transportadora: string;
  volumes: number;
  obs?: string;
}

export interface HistoricoQuery {
  bloco: string;
  numero: string;
  condominioId: string;
}

@Injectable()
export class PorteiroService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async listarEntregas(condominioId: string): Promise<Entrega[]> {
    const { data, error } = await this.supabase
      .from('entregas')
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em, morador_id,
        apartamentos ( numero, bloco ),
        morador:usuarios!morador_id ( nome )
      `)
      .eq('condominio_id', condominioId)
      .order('recebido_em', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return (data || []).map(e => this.mapearEntrega(e));
  }

  async buscarEntregaPorId(id: string): Promise<Entrega> {
    const { data, error } = await this.supabase
      .from('entregas')
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em, morador_id,
        apartamentos ( numero, bloco ),
        morador:usuarios!morador_id ( nome )
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Entrega não encontrada');
    return this.mapearEntrega(data);
  }

  async registrarEntrega(porteiroId: string, condominioId: string, dto: CreateEntregaDto): Promise<Entrega> {
    const { data, error } = await this.supabase
      .from('entregas')
      .insert({
        condominio_id:   condominioId,
        apartamento_id:  dto.apartamentoId,
        morador_id:      dto.moradorId,
        transportadora:  dto.transportadora,
        volumes:         dto.volumes,
        obs:             dto.obs || '',
        status:          'aguardando',
        registrado_por:  porteiroId,
        recebido_em:     new Date().toISOString(),
      })
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em, morador_id,
        apartamentos ( numero, bloco ),
        morador:usuarios!morador_id ( nome )
      `)
      .single();

    if (error) {
      console.error('[registrarEntrega] erro:', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
    return this.mapearEntrega(data);
  }

  async registrarRetirada(id: string, porteiroId: string): Promise<Entrega> {
    const { data, error } = await this.supabase
      .from('entregas')
      .update({
        status:       'retirado',
        retirado_em:  new Date().toISOString(),
        retirado_por: porteiroId,
      })
      .eq('id', id)
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em, morador_id,
        apartamentos ( numero, bloco ),
        morador:usuarios!morador_id ( nome )
      `)
      .single();

    if (error) throw new BadRequestException(error.message);
    return this.mapearEntrega(data);
  }

  async atualizarStatus(id: string, status: EntregaStatus): Promise<Entrega> {
    const { data, error } = await this.supabase
      .from('entregas')
      .update({ status })
      .eq('id', id)
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em, morador_id,
        apartamentos ( numero, bloco ),
        morador:usuarios!morador_id ( nome )
      `)
      .single();

    if (error) throw new BadRequestException(error.message);
    return this.mapearEntrega(data);
  }

  async getStats(condominioId: string) {
    const entregas = await this.listarEntregas(condominioId);
    return {
      aguardando: entregas.filter(e =>
        ['aguardando', 'notificado', 'entregue_porteiro'].includes(e.status)
      ).length,
      retirado: entregas.filter(e => e.status === 'retirado').length,
      expirado: entregas.filter(e => e.status === 'expirado').length,
      total:    entregas.length,
    };
  }

  async buscarHistorico(query: HistoricoQuery) {
    const { data: apto, error: aptoError } = await this.supabase
      .from('apartamentos')
      .select('id, numero, bloco')
      .eq('condominio_id', query.condominioId)
      .eq('bloco', query.bloco.toUpperCase())
      .eq('numero', query.numero)
      .single();

    if (aptoError || !apto) throw new NotFoundException('Apartamento não encontrado');

    const { data, error } = await this.supabase
      .from('entregas')
      .select('id, transportadora, volumes, status, obs, recebido_em, retirado_em')
      .eq('apartamento_id', apto.id)
      .order('recebido_em', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return { apto: `${apto.bloco}-${apto.numero}`, entregas: data || [] };
  }

  async listarMoradores(condominioId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nome, status, apartamentos(numero, bloco)')
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

  async buscarMoradorPorNome(nome: string, condominioId: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nome, apartamento_id, apartamentos(id, numero, bloco)')
      .eq('condominio_id', condominioId)
      .ilike('nome', `%${nome}%`)
      .eq('perfil', 'morador')
      .limit(10);

    if (error) throw new BadRequestException(error.message);

    return (data || []).map(m => ({
      ...m,
      apto: (m.apartamentos as any)
        ? `${(m.apartamentos as any).bloco}-${(m.apartamentos as any).numero}`
        : '—',
    }));
  }

  private mapearEntrega(e: any): Entrega {
    return {
      id:        e.id,
      apto:      e.apartamentos ? `${e.apartamentos.bloco}-${e.apartamentos.numero}` : '—',
      morador:   e.morador?.nome || '—',
      moradorId: e.morador_id ?? null,
      trans:     e.transportadora,
      data:      new Date(e.recebido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      hora:      new Date(e.recebido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      volumes:   e.volumes,
      status:    e.status,
      obs:       e.obs || '',
    };
  }
}