import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    super();
    this.supabase = createClient(
      configService.getOrThrow('SUPABASE_URL'),
      configService.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async validate(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.split(' ')[1];

    // Valida o token diretamente pelo Supabase
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token inválido');
    }

    // Busca o usuário na tabela usuarios
    const { data: usuario, error: dbError } = await this.supabase
      .from('usuarios')
      .select('id, perfil, nome, email, condominio_id, apartamento_id, status')
      .eq('auth_id', user.id)
      .single();

    if (dbError || !usuario) throw new UnauthorizedException('Usuário não encontrado');
    if (usuario.status === 'inativo') throw new UnauthorizedException('Conta inativa');

    return {
      id:            usuario.id,
      authId:        user.id,
      email:         usuario.email,
      nome:          usuario.nome,
      perfil:        usuario.perfil,
      condominioId:  usuario.condominio_id,
      apartamentoId: usuario.apartamento_id,
    };
  }
}