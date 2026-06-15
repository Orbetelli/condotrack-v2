import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AdminComponent implements OnInit {
  tabAtiva: 'dashboard' | 'condominios' | 'usuarios' | 'novo-sindico' = 'dashboard';

  stats: any = null;
  condominios: any[] = [];
  usuarios: any[] = [];

  // Modal novo condomínio
  modalCondoAberto = false;
  novoCondo = { nome: '', endereco: '', cidade: '', uf: '', cnpj: '' };
  salvandoCondo = false;
  erroCondo = '';

  // Modal novo síndico
  novoSindico = { nome: '', email: '', senha: '', condominioId: '' };
  salvandoSindico = false;
  erroSindico = '';
  sucessoSindico = '';

  // Modal reset senha
  modalResetAberto = false;
  usuarioReset: any = null;
  novaSenha = '';
  erroReset = '';
  salvandoReset = false;

  private readonly API = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.carregarStats();
  }

  mudarTab(tab: typeof this.tabAtiva) {
    this.tabAtiva = tab;
    if (tab === 'dashboard')   this.carregarStats();
    if (tab === 'condominios') this.carregarCondominios();
    if (tab === 'usuarios')    this.carregarUsuarios();
  }

  carregarStats() {
    this.http.get<any>(`${this.API}/admin/stats`)
      .subscribe(s => this.stats = s);
  }

  carregarCondominios() {
    this.http.get<any[]>(`${this.API}/admin/condominios`)
      .subscribe(c => this.condominios = c);
  }

  carregarUsuarios() {
    this.http.get<any[]>(`${this.API}/admin/usuarios`)
      .subscribe(u => this.usuarios = u);
  }

  // ── Condomínios ───────────────────────────────────────────────

  abrirModalCondo() {
    this.modalCondoAberto = true;
    this.novoCondo = { nome: '', endereco: '', cidade: '', uf: '', cnpj: '' };
    this.erroCondo = '';
  }

  fecharModalCondo() { this.modalCondoAberto = false; }

  salvarCondo() {
    if (!this.novoCondo.nome) { this.erroCondo = 'Nome é obrigatório.'; return; }
    this.salvandoCondo = true;
    this.http.post<any>(`${this.API}/admin/condominios`, this.novoCondo)
      .subscribe({
        next: c => {
          this.condominios.unshift(c);
          this.fecharModalCondo();
          this.salvandoCondo = false;
        },
        error: () => { this.erroCondo = 'Erro ao criar condomínio.'; this.salvandoCondo = false; }
      });
  }

  toggleStatusCondo(c: any) {
    const novoStatus = c.status === 'ativo' ? 'inativo' : 'ativo';
    this.http.patch(`${this.API}/admin/condominios/${c.id}/status`, { status: novoStatus })
      .subscribe(() => c.status = novoStatus);
  }

  // ── Usuários ──────────────────────────────────────────────────

  toggleStatusUsuario(u: any) {
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    this.http.patch(`${this.API}/admin/usuarios/${u.id}/status`, { status: novoStatus })
      .subscribe(() => u.status = novoStatus);
  }

  abrirResetSenha(u: any) {
    this.usuarioReset = u;
    this.novaSenha = '';
    this.erroReset = '';
    this.modalResetAberto = true;
  }

  fecharResetSenha() { this.modalResetAberto = false; this.usuarioReset = null; }

  confirmarReset() {
    if (this.novaSenha.length < 6) { this.erroReset = 'Mínimo 6 caracteres.'; return; }
    this.salvandoReset = true;
    this.http.post(`${this.API}/admin/usuarios/${this.usuarioReset.auth_id}/reset-senha`, { senha: this.novaSenha })
      .subscribe({
        next: () => { this.fecharResetSenha(); this.salvandoReset = false; },
        error: () => { this.erroReset = 'Erro ao resetar senha.'; this.salvandoReset = false; }
      });
  }

  // ── Novo Síndico ──────────────────────────────────────────────

  salvarSindico() {
    this.erroSindico = '';
    this.sucessoSindico = '';
    if (!this.novoSindico.nome || !this.novoSindico.email || !this.novoSindico.senha || !this.novoSindico.condominioId) {
      this.erroSindico = 'Preencha todos os campos.';
      return;
    }
    this.salvandoSindico = true;
    this.http.post(`${this.API}/admin/sindico`, this.novoSindico)
      .subscribe({
        next: () => {
          this.sucessoSindico = 'Síndico criado com sucesso!';
          this.novoSindico = { nome: '', email: '', senha: '', condominioId: '' };
          this.salvandoSindico = false;
        },
        error: err => {
          this.erroSindico = err?.error?.message || 'Erro ao criar síndico.';
          this.salvandoSindico = false;
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────

  getSaudacao(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  getNomeUsuario(): string {
    return this.auth.usuario()?.nome ?? 'Admin';
  }

  getIniciais(nome: string): string {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getPerfillabel(perfil: string): string {
    const map: Record<string, string> = {
      admin:    'Admin',
      sindico:  'Síndico',
      porteiro: 'Porteiro',
      morador:  'Morador',
    };
    return map[perfil] || perfil;
  }

  logout() { this.auth.logout(); }
}