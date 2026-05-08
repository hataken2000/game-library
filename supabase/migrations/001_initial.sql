-- ゲームライブラリ 初期テーブル作成

create table games (
  id uuid primary key default gen_random_uuid(),
  igdb_id integer unique,
  title text not null,
  slug text,
  cover_url text,
  genres text[] default '{}',
  release_year integer,
  metacritic_score integer,
  opencritic_score float,
  opencritic_percent_recommended float,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table platform_entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  platform text not null,
  platform_game_id text,
  acquired_year integer,
  acquired_date date,
  is_free boolean default false,
  price_paid numeric(10,2),
  playtime_hours float,
  last_played date,
  created_at timestamptz default now(),
  unique(game_id, platform, platform_game_id)
);

create table dlcs (
  id uuid primary key default gen_random_uuid(),
  platform_entry_id uuid references platform_entries(id) on delete cascade,
  title text not null,
  platform_dlc_id text,
  is_owned boolean default false,
  acquired_date date,
  created_at timestamptz default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text default '#6366f1',
  created_at timestamptz default now()
);

create table game_tags (
  game_id uuid references games(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (game_id, tag_id)
);

-- updated_at自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger games_updated_at
  before update on games
  for each row execute function update_updated_at();
