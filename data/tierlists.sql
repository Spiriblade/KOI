create table if not exists public.tierlists (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    name text not null default 'Neue Tierlist',
    tiers jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.tierlists enable row level security;

create policy "Team members can view tierlists"
on public.tierlists for select
using (
    exists (
        select 1 from public.user_teams
        where user_teams.team_id = tierlists.team_id
        and user_teams.user_id = auth.uid()
    )
);

create policy "Team members can create tierlists"
on public.tierlists for insert
with check (
    exists (
        select 1 from public.user_teams
        where user_teams.team_id = tierlists.team_id
        and user_teams.user_id = auth.uid()
    )
);

create policy "Team members can update tierlists"
on public.tierlists for update
using (
    exists (
        select 1 from public.user_teams
        where user_teams.team_id = tierlists.team_id
        and user_teams.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.user_teams
        where user_teams.team_id = tierlists.team_id
        and user_teams.user_id = auth.uid()
    )
);

create policy "Team members can delete tierlists"
on public.tierlists for delete
using (
    exists (
        select 1 from public.user_teams
        where user_teams.team_id = tierlists.team_id
        and user_teams.user_id = auth.uid()
    )
);

create index if not exists tierlists_team_id_idx on public.tierlists(team_id);
