export interface Turno {
  id: string;
  porteiroId: string;
  condominioId: string;
  inicioTurno: string;
  fimTurno?: string;
  ativo: boolean;
}

export interface CreateTurnoDto {
  condominioId: string;
}