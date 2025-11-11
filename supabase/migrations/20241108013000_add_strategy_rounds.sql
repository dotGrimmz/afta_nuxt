-- Strategy Bingo automation schema additions

do
$$
begin
  if not exists (
    select 1 from pg_type where typname = 'bingo_round_status'
  ) then
    create type public.bingo_round_status as enum ('pending', 'active', 'cooldown', 'completed');
  end if;
end;
$$;

create table if not exists public.bingo_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.bingo_games (id) on delete cascade,
  round_number integer not null,
  status public.bingo_round_status not null default 'pending',
  draws_per_round integer not null default 25,
  draw_interval_seconds integer not null default 5,
  started_at timestamptz,
  ended_at timestamptz,
  intermission_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bingo_rounds_game_round_idx
  on public.bingo_rounds (game_id, round_number);

-- Strategy config on games
alter table public.bingo_games
  add column if not exists total_rounds integer not null default 1,
  add column if not exists strategy_draws_per_round integer not null default 25,
  add column if not exists strategy_draw_interval_seconds integer not null default 5,
  add column if not exists strategy_intermission_seconds integer not null default 10,
  add column if not exists strategy_first_place_points integer not null default 50,
  add column if not exists strategy_second_place_points integer not null default 30,
  add column if not exists strategy_third_place_points integer not null default 10,
  add column if not exists strategy_required_winners integer not null default 1;

do
$$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'bingo_scores'
  ) then
    alter table public.bingo_scores
      alter column round_id type uuid using nullif(round_id, '')::uuid,
      add column if not exists award_order integer,
      add column if not exists is_bonus boolean not null default false;

    if not exists (
      select 1
      from information_schema.table_constraints
      where constraint_schema = 'public'
        and constraint_name = 'bingo_scores_round_id_fkey'
    ) then
      alter table public.bingo_scores
        add constraint bingo_scores_round_id_fkey
        foreign key (round_id) references public.bingo_rounds (id) on delete set null;
    end if;
  end if;
end;
$$;
