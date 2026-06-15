export type UserRole = 'superadmin' | 'admin' | 'porteiro' | 'morador';

export interface UserPayload {
  sub: string;
  email: string;
  role: UserRole;
  condominioId: string;
}