export type EncomendaStatus = 'pendente' | 'retirada' | 'devolvida';

export interface Encomenda {
  id: string;
  moradorId: string;
  condominioId: string;
  transportadora: string;
  descricao?: string;
  fotoUrl?: string;
  status: EncomendaStatus;
  registradoPor: string;
  criadoEm: string;
  retiradoEm?: string;
}

export interface CreateEncomendaDto {
  moradorId: string;
  transportadora: string;
  descricao?: string;
  fotoUrl?: string;
}