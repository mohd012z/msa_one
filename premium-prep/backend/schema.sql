-- Preparation only: adapt to your production database and auth model.
create table if not exists msa_premium_purchases (
  purchase_token_hash text primary key,
  user_id text not null,
  product_id text not null,
  provider text not null default 'google-play',
  purchase_state text not null,
  acknowledgement_state text,
  expires_at timestamptz,
  verified_at timestamptz not null default now(),
  raw_reference text
);

create table if not exists msa_entitlements (
  user_id text primary key,
  plan text not null default 'free',
  status text not null default 'inactive',
  capabilities_json text not null default '[]',
  source text not null default 'backend',
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
