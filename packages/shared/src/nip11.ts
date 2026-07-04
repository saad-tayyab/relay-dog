// ─── Relay NIP-11 Types ───

export interface RelayNip11 {
  name?: string;
  description?: string;
  banner?: string;
  icon?: string;
  pubkey?: string;
  self?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
  terms_of_service?: string;
  limitation?: RelayLimitation;
  payments_url?: string;
  fees?: RelayFees;
  tags?: string[][];
  [key: string]: unknown;
}

export interface RelayLimitation {
  max_message_length?: number;
  max_subscriptions?: number;
  max_filters?: number;
  max_limit?: number;
  max_subid_length?: number;
  max_event_tags?: number;
  max_content_length?: number;
  min_pow_difficulty?: number;
  auth_required?: boolean;
  payment_required?: boolean;
  restricted_writes?: boolean;
  created_at_lower_limit?: number;
  created_at_upper_limit?: number;
  default_limit?: number;
  [key: string]: unknown;
}

export interface RelayFeeEntry {
  kinds?: number[];
  amount: number;
  unit: string;
  period?: number;
}

export interface RelayFees {
  admission?: RelayFeeEntry[];
  subscription?: RelayFeeEntry[];
  publication?: RelayFeeEntry[];
}
