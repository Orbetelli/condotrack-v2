import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-sindico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sindico.html',
  styleUrl: './sindico.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SindicoComponent implements OnInit {
  tabAtiva: 'dashboard' | 'entregas' | 'moradores' | 'porteiros' = 'dashboard';
  filtroStatus = 'todos';

  stats: any = null;
  entregas: any[] = [];
  moradores: any[] = [];
  porteiros: any[] = [];

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
    if (tab === 'dashboard') this.carregarStats();
    if (tab === 'entregas')  this.carregarEntregas();
    if (tab === 'moradores') this.carregarMoradores();
    if (tab === 'porteiros') this.carregarPorteiros();
  }

  carregarStats() {
    this.http.get<any>(`${this.API}/sindico/stats`)
      .subscribe(s => this.stats = s);
  }

  carregarEntregas() {
    const url = this.filtroStatus === 'todos'
      ? `${this.API}/sindico/entregas`
      : `${this.API}/sindico/entregas?status=${this.filtroStatus}`;
    this.http.get<any[]>(url).subscribe(e => this.entregas = e);
  }

  carregarMoradores() {
    this.http.get<any[]>(`${this.API}/sindico/moradores`)
      .subscribe(m => this.moradores = m);
  }

  carregarPorteiros() {
    this.http.get<any[]>(`${this.API}/sindico/porteiros`)
      .subscribe(p => this.porteiros = p);
  }

  aplicarFiltro() {
    this.carregarEntregas();
  }

  toggleStatusMorador(m: any) {
    const novoStatus = m.status === 'ativo' ? 'inativo' : 'ativo';
    this.http.patch(`${this.API}/sindico/moradores/${m.id}/status`, { status: novoStatus })
      .subscribe(() => { m.status = novoStatus; });
  }

  toggleStatusPorteiro(p: any) {
    const novoStatus = p.status === 'ativo' ? 'inativo' : 'ativo';
    this.http.patch(`${this.API}/sindico/porteiros/${p.id}/status`, { status: novoStatus })
      .subscribe(() => { p.status = novoStatus; });
  }

  getStatusBadge(status: string) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      aguardando: { bg: '#FEF3C7', color: '#92400E', label: 'Aguardando' },
      notificado: { bg: '#EDE9FE', color: '#5B21B6', label: 'Notificado' },
      retirado:   { bg: '#F0FDF4', color: '#166534', label: 'Retirado'   },
      expirado:   { bg: '#FEF2F2', color: '#991B1B', label: 'Expirado'   },
      entregue_porteiro: { bg: '#ECFDF5', color: '#065F46', label: 'Confirmar' },
    };
    return map[status] || { bg: '#F4F4F5', color: '#71717A', label: status };
  }

  getSaudacao(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  getNomeUsuario(): string {
    return this.auth.usuario()?.nome ?? 'Síndico';
  }

  getIniciais(nome: string): string {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  logout() { this.auth.logout(); }
}