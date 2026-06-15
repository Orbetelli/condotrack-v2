import { SetMetadata } from '@nestjs/common';

export type UserRole = 'admin' | 'sindico' | 'porteiro' | 'morador';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);