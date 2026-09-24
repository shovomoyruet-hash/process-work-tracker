create table public.pwt_workspaces (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 name text not null default 'Process Work Tracker',
 member_emails text[] not null default '{}',
 data jsonb not null check (jsonb_typeof(data) = 'object' and jsonb_typeof(data->'tasks')='array' and jsonb_typeof(data->'people')='array' and jsonb_typeof(data->'departments')='array'),
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.pwt_workspaces enable row level security;
revoke all on public.pwt_workspaces from anon, authenticated;
grant select, insert, update on public.pwt_workspaces to authenticated;
create policy pwt_read on public.pwt_workspaces for select to authenticated using
 ((select auth.uid()) = owner_id or lower((select auth.jwt()->>'email')) = any(member_emails));
create policy pwt_create on public.pwt_workspaces for insert to authenticated with check
 ((select auth.uid()) = owner_id and cardinality(member_emails)=0 and revision=0);
create policy pwt_edit on public.pwt_workspaces for update to authenticated using
 ((select auth.uid()) = owner_id or lower((select auth.jwt()->>'email')) = any(member_emails))
 with check ((select auth.uid()) = owner_id or lower((select auth.jwt()->>'email')) = any(member_emails));
create function public.pwt_guard_update() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.owner_id is distinct from old.owner_id then raise exception 'Workspace ownership cannot change'; end if;
 if (new.member_emails is distinct from old.member_emails or new.name is distinct from old.name)
 and (select auth.uid()) is distinct from old.owner_id then raise exception 'Only the owner can manage access'; end if;
 if new.revision <> old.revision+1 then raise exception 'Revision must increase by one'; end if;
 new.updated_at=now(); return new;
end; $$;
revoke all on function public.pwt_guard_update() from public, anon, authenticated;
create trigger pwt_guard before update on public.pwt_workspaces for each row execute function public.pwt_guard_update();
create index pwt_members_idx on public.pwt_workspaces using gin(member_emails);
