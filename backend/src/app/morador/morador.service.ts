import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class MoradorService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async getEntregas(moradorId: string, apartamentoId: string) {
    const { data, error } = await this.supabase
      .from('entregas')
      .select(`
        id, transportadora, volumes, status, obs,
        recebido_em, retirado_em,
        apartamentos ( numero, bloco )
      `)
      .eq('apartamento_id', apartamentoId)
      .order('recebido_em', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return (data || []).map(e => ({
      id:        e.id,
      trans:     e.transportadora,
      volumes:   e.volumes,
      status:    e.status,
      obs:       e.obs || '',
      apto:      e.apartamentos ? `${(e.apartamentos as any).bloco}-${(e.apartamentos as any).numero}` : '—',
      data:      new Date(e.recebido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      hora:      new Date(e.recebido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      retiradoEm: e.retirado_em
        ? new Date(e.retirado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null,
    }));
  }

  async getPendentes(apartamentoId: string) {
    const { data, error } = await this.supabase
      .from('entregas')
      .select(`id, transportadora, volumes, status, obs, recebido_em, apartamentos(numero, bloco)`)
      .eq('apartamento_id', apartamentoId)
      .in('status', ['aguardando', 'notificado'])
      .order('recebido_em', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return (data || []).map(e => ({
      id:      e.id,
      trans:   e.transportadora,
      volumes: e.volumes,
      status:  e.status,
      obs:     e.obs || '',
      apto:    e.apartamentos ? `${(e.apartamentos as any).bloco}-${(e.apartamentos as any).numero}` : '—',
      data:    new Date(e.recebido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      hora:    new Date(e.recebido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  async getStats(apartamentoId: string) {
    const { data, error } = await this.supabase
      .from('entregas')
      .select('id, status')
      .eq('apartamento_id', apartamentoId);

    if (error) throw new BadRequestException(error.message);
    const entregas = data || [];
    return {
      pendentes: entregas.filter(e => ['aguardando', 'notificado'].includes(e.status)).length,
      retiradas: entregas.filter(e => e.status === 'retirado').length,
      total:     entregas.length,
    };
  }

  async confirmarRetirada(entregaId: string) {
    const { data, error } = await this.supabase
      .from('entregas')
      .update({ status: 'retirado', retirado_em: new Date().toISOString() })
      .eq('id', entregaId)
      .select('id, status, retirado_em')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}