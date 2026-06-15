import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

export interface UsuarioLogado {
  id: string;
  authId: string;
  email: string;
  nome: string;
  perfil: 'admin' | 'sindico' | 'porteiro' | 'morador';
  condominioId: string;
  apartamentoId?: string;
}

const ROTAS_PERFIL: Record<string, string> = {
  admin:    '/admin',
  sindico:  '/sindico',
  porteiro: '/porteiro',
  morador:  '/morador',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;
  private readonly API = 'http://localhost:3000/api';

  usuario = signal<UsuarioLogado | null>(null);
  carregando = signal(true);

  constructor(private router: Router) {
    this.supabase = createClient(
      'https://qlrkqeoqqvcudqscfhxl.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscmtxZW9xcXZjdWRxc2NmaHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzcyNjksImV4cCI6MjA5Njc1MzI2OX0.x2IUaSf_-J93MF9L3v55B7e_MdFj6KZyESR2Uka6fqE',
    );
    this.inicializar();
  }

  private async inicializar() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) await this.carregarUsuario(session);
    this.carregando.set(false);

    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await this.carregarUsuario(session);
      else this.usuario.set(null);
    });
  }

  private async carregarUsuario(session: Session) {
    try {
      const { data: usuario, error } = await this.supabase
        .from('usuarios')
        .select('id, perfil, nome, email, condominio_id, apartamento_id, status')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !usuario) return;

      this.usuario.set({
        id:            usuario.id,
        authId:        session.user.id,
        email:         usuario.email,
        nome:          usuario.nome,
        perfil:        usuario.perfil,
        condominioId:  usuario.condominio_id,
        apartamentoId: usuario.apartamento_id,
      });
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
    }
  }

  async login(email: string, senha: string): Promise<{ erro?: string }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      const msg = error.message?.includes('Email not confirmed')
        ? 'Confirme seu e-mail antes de entrar.'
        : 'E-mail ou senha incorretos.';
      return { erro: msg };
    }

    await this.carregarUsuario(data.session!);
    const perfil = this.usuario()?.perfil;
    if (perfil) this.router.navigate([ROTAS_PERFIL[perfil] ?? '/']);
    return {};
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): Promise<string | null> {
    return this.supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null);
  }

  get perfil() { return this.usuario()?.perfil; }
  get estaLogado() { return !!this.usuario(); }
}