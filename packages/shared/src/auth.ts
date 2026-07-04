// ─── NIP-42 Auth Types ───

export type AuthStatus =
  | 'anonymous'
  | 'auth_required'
  | 'authenticating'
  | 'authenticated'
  | 'auth_failed';

export interface AuthState {
  status: AuthStatus;
  challenge: string | null;
  error: string | null;
  pubkey: string | null;
}

export interface AuthEvent {
  kind: 22242;
  content: '';
  tags: ['relay', string][];
  created_at: number;
  pubkey: string;
  sig: string;
  id: string;
}
