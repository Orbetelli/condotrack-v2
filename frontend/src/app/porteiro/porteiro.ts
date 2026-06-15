import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth/auth.service';

type EntregaStatus = 'aguardando' | 'notificado' | 'entregue_porteiro' | 'retirado' | 'expirado';

interface Entrega {
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

interface Stats {
  aguardando: number;
  retirado: number;
  expirado: number;
  total: number;
}

const STATUS_CONFIG: Record<EntregaStatus, { label: string; bg: string; color: string; dot: string }> = {
  aguardando:        { label: 'Aguardando',           bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  notificado:        { label: 'Notificado',            bg: '#EDE9FE', color: '#5B21B6', dot: '#A78BFA' },
  entregue_porteiro: { label: 'Entregue — Confirmar', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  retirado:          { label: 'Retirado',              bg: '#F0FDF4', color: '#166534', dot: '#34D399' },
  expirado:          { label: 'Expirado',              bg: '#FEF2F2', color: '#991B1B', dot: '#F87171' },
};

@Component({
  selector: 'app-porteiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './porteiro.html',
  styleUrl: './porteiro.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PorteiroComponent implements OnInit, OnDestroy {
  tabAtiva: 'dashboard' | 'entregas' | 'moradores' | 'historico' | 'chat' = 'dashboard';
  filtroAtivo = 'todos';
  filtroEntregasAtivo = 'todos';
  busca = '';
  buscaEntregas = '';

  todasEntregas: Entrega[] = [];
  moradores: any[] = [];
  stats: Stats = { aguardando: 0, retirado: 0, expirado: 0, total: 0 };

  modalNovaAberto = false;
  novaEntrega = { apartamentoId: '', moradorId: '', transportadora: '', volumes: 1, obs: '' };
  buscaMorador = '';
  resultadosMorador: any[] = [];
  moradorSelecionado: any = null;
  erroNovaEntrega = '';
  salvandoEntrega = false;
  private buscaTimer: any;

  modalDetalheAberto = false;
  entregaDetalhe: Entrega | null = null;

  modalTurnoAberto = false;
  turnoAtivo = false;

  statusConfig = STATUS_CONFIG;

  private readonly API = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const usuario = this.auth.usuario();
    if (usuario) {
      this.carregarStats();
      this.carregarEntregas();
    }
  }

  ngOnDestroy() {
    clearTimeout(this.buscaTimer);
  }

  mudarTab(tab: typeof this.tabAtiva) {
    this.tabAtiva = tab;
    if (tab === 'moradores') this.carregarMoradores();
  }

  carregarStats() {
    this.http.get<Stats>(`${this.API}/porteiro/stats`)
      .subscribe(s => this.stats = s);
  }

  carregarEntregas() {
    this.http.get<Entrega[]>(`${this.API}/porteiro/entregas`)
      .subscribe(e => this.todasEntregas = e);
  }

  carregarMoradores() {
    this.http.get<any[]>(`${this.API}/porteiro/moradores`)
      .subscribe(m => this.moradores = m);
  }

  get entregasFiltradas(): Entrega[] {
    return this.todasEntregas.filter(e => {
      const matchFiltro = this.filtroAtivo === 'todos' || e.status === this.filtroAtivo;
      const termo = this.busca.toLowerCase();
      const matchBusca = !termo || e.apto.toLowerCase().includes(termo) || e.trans.toLowerCase().includes(termo);
      return matchFiltro && matchBusca;
    });
  }

  get pendentes(): Entrega[] {
    return this.entregasFiltradas.filter(e =>
      ['aguardando', 'notificado', 'expirado', 'entregue_porteiro'].includes(e.status)
    );
  }

  get retiradas(): Entrega[] {
    return this.entregasFiltradas.filter(e => e.status === 'retirado');
  }

  get entregasListaFiltradas(): Entrega[] {
    return this.todasEntregas.filter(e => {
      const matchFiltro = this.filtroEntregasAtivo === 'todos' || e.status === this.filtroEntregasAtivo;
      const termo = this.buscaEntregas.toLowerCase();
      const matchBusca = !termo || e.apto.toLowerCase().includes(termo) || e.trans.toLowerCase().includes(termo);
      return matchFiltro && matchBusca;
    });
  }

  abrirModalNova() {
    this.modalNovaAberto = true;
    this.buscaMorador = '';
    this.resultadosMorador = [];
    this.moradorSelecionado = null;
    this.erroNovaEntrega = '';
    this.novaEntrega = { apartamentoId: '', moradorId: '', transportadora: '', volumes: 1, obs: '' };
  }

  fecharModalNova() { this.modalNovaAberto = false; }

  onBuscaMorador() {
    clearTimeout(this.buscaTimer);
    this.moradorSelecionado = null;
    if (this.buscaMorador.length < 2) { this.resultadosMorador = []; return; }
    this.buscaTimer = setTimeout(() => {
      this.http.get<any[]>(`${this.API}/porteiro/moradores/buscar?nome=${encodeURIComponent(this.buscaMorador)}`)
        .subscribe(r => this.resultadosMorador = r);
    }, 300);
  }

  selecionarMorador(m: any) {
    this.moradorSelecionado = m;
    this.novaEntrega.moradorId    = m.id;
    this.novaEntrega.apartamentoId = m.apartamento_id;
    this.resultadosMorador = [];
    this.buscaMorador = '';
  }

  limparMorador() {
    this.moradorSelecionado = null;
    this.novaEntrega.moradorId = '';
    this.novaEntrega.apartamentoId = '';
  }

  decrementarVolumes() {
    if (this.novaEntrega.volumes > 1) this.novaEntrega.volumes--;
  }

  incrementarVolumes() {
    this.novaEntrega.volumes++;
  }

  salvarEntrega() {
    this.erroNovaEntrega = '';
    if (!this.moradorSelecionado)        { this.erroNovaEntrega = 'Selecione o morador.';        return; }
    if (!this.novaEntrega.transportadora) { this.erroNovaEntrega = 'Selecione a transportadora.'; return; }
    if (!this.novaEntrega.apartamentoId) { this.erroNovaEntrega = 'Apartamento do morador não identificado.'; return; }

    this.salvandoEntrega = true;
    this.http.post<any>(`${this.API}/porteiro/entregas`, this.novaEntrega)
      .subscribe({
        next: e => {
          this.todasEntregas.unshift(e);
          this.carregarStats();
          this.fecharModalNova();
          this.salvandoEntrega = false;
        },
        error: err => {
          this.erroNovaEntrega = err?.error?.message || 'Erro ao registrar entrega. Tente novamente.';
          this.salvandoEntrega = false;
        }
      });
  }

  abrirDetalhe(id: string) {
    this.entregaDetalhe = this.todasEntregas.find(e => e.id === id) || null;
    this.modalDetalheAberto = true;
  }

  fecharDetalhe() { this.modalDetalheAberto = false; this.entregaDetalhe = null; }

  confirmarRetirada() {
    if (!this.entregaDetalhe) return;
    this.http.patch<Entrega>(`${this.API}/porteiro/entregas/${this.entregaDetalhe.id}/retirada`, {})
      .subscribe({
        next: e => {
          const idx = this.todasEntregas.findIndex(x => x.id === e.id);
          if (idx >= 0) this.todasEntregas[idx] = e;
          this.carregarStats();
          this.fecharDetalhe();
        },
        error: err => {
          console.error('Erro ao confirmar retirada:', err);
        }
      });
  }

  getStatusConfig(status: EntregaStatus) { return STATUS_CONFIG[status] || STATUS_CONFIG.aguardando; }

  getIniciais(nome: string): string {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getSaudacao(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  getNomeUsuario(): string {
    return this.auth.usuario()?.nome ?? 'Porteiro';
  }
}