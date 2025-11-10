-- Create table to persist strategy bingo round points
create table if not exists public.bingo_scores (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bingo_events (id) on delete cascade,
  game_id uuid references public.bingo_games (id) on delete set null,
  round_id uuid,
  contestant_id uuid not null references public.bingo_contestants (id) on delete cascade,
  points_awarded integer not null default 0,
  total_after_round integer not null default 0,
  position integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bingo_scores_event_id_idx
  on public.bingo_scores (event_id);

create index if not exists bingo_scores_contestant_id_idx
  on public.bingo_scores (contestant_id);

create index if not exists bingo_scores_round_id_idx
  on public.bingo_scores (round_id);

create unique index if not exists bingo_scores_unique_round_contestant_idx
  on public.bingo_scores (event_id, round_id, contestant_id);
