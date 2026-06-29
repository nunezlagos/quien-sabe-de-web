import type * as schema from '../../database/schema';

export type Database = ReturnType<typeof import('../db/compat').d1>;

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'provider' | 'admin';
  roles: ('user' | 'provider' | 'admin')[];
  activeRole: string;
  status: 'active' | 'banned';
  onboardedAt: Date | null;
}

export interface AppContext {
  locals: {
    user?: AuthUser;
    DB?: Database;
    container?: import('./container').Container;
  };
  cookies?: {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
  };
}
