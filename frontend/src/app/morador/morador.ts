import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth/auth.service';

type EntregaStatus = 'aguardando' | 'notificado' | 'entregue_porteiro' | 'retirado' | 'expirado';

interface Entrega {
  id: string;
  trans: string;
  volumes: number;
  status: EntregaStatus;
  obs: string;
  apto: string;
  data: string;
  hora: string;
  retiradoEm?: string | null;
}

interface Stats {
  pendentes: number;
  retiradas: number;
  total: number;
}

const STATUS_CONFIG: Record<EntregaStatus, { label: string; bg: string; color: string; dot: string }> = {
  aguardando:        { label: 'Aguardando retirada', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  notificado:        { label: 'Notificado',           bg: '#EDE9FE', color: '#5B21B6', dot: '#A78BFA' },
  entregue_porteiro: { label: 'Confirmar retirada',  bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  retirado:          { label: 'Retirado',             bg: '#F0FDF4', color: '#166534', dot: '#34D399' },
  expirado:          { label: 'Expirado',             bg: '#FEF2F2', color: '#991B1B', dot: '#F87171' },
};

@Component({
  selector: 'app-morador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './morador.html',
  styleUrl: './morador.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MoradorComponent implements OnInit {
  tabAtiva: 'pendentes' | 'historico' = 'pendentes';

  entregas: Entrega[] = [];
  stats: Stats = { pendentes: 0, retiradas: 0, total: 0 };

  modalDetalheAberto = false;
  entregaDetalhe: Entrega | null = null;
  confirmandoRetirada = false;

  statusConfig = STATUS_CONFIG;
  private readonly API = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.carregarStats();
    this.carregarEntregas();
  }

  carregarStats() {
    this.http.get<Stats>(`${this.API}/morador/stats`)
      .subscribe(s => this.stats = s);
  }

  carregarEntregas() {
    const endpoint = this.tabAtiva === 'pendentes'
      ? `${this.API}/morador/pendentes`
      : `${this.API}/morador/entregas`;
    this.http.get<Entrega[]>(endpoint)
      .subscribe(e => this.entregas = e);
  }

  mudarTab(tab: typeof this.tabAtiva) {
    this.tabAtiva = tab;
    this.carregarEntregas();
  }

  abrirDetalhe(e: Entrega) {
    this.entregaDetalhe = e;
    this.modalDetalheAberto = true;
  }

  fecharDetalhe() {
    this.modalDetalheAberto = false;
    this.entregaDetalhe = null;
  }

  confirmarRetirada() {
    if (!this.entregaDetalhe) return;
    this.confirmandoRetirada = true;
    this.http.patch(`${this.API}/morador/entregas/${this.entregaDetalhe.id}/retirada`, {})
      .subscribe({
        next: () => {
          this.carregarStats();
          this.carregarEntregas();
          this.fecharDetalhe();
          this.confirmandoRetirada = false;
        },
        error: () => { this.confirmandoRetirada = false; }
      });
  }

  getStatusConfig(status: EntregaStatus) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.aguardando;
  }

  getSaudacao(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  getNomeUsuario(): string {
    return this.auth.usuario()?.nome ?? 'Morador';
  }

  logout() { this.auth.logout(); }
}