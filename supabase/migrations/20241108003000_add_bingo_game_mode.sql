alter table public.bingo_games
  add column if not exists mode text not null default 'classic';
