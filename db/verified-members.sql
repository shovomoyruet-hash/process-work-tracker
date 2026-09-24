create schema if not exists pwt_private;
revoke all on schema pwt_private from public, anon;
grant usage on schema pwt_private to authenticated;
create function pwt_private.verified_email() returns text language plpgsql stable security definer set search_path='' as $$
declare caller uuid := auth.uid(); result text;
begin
 if caller is null then return null; end if;
 select lower(email) into result from auth.users where id=caller and email_confirmed_at is not null;
 return result;
end; $$;
revoke all on function pwt_private.verified_email() from public, anon;
grant execute on function pwt_private.verified_email() to authenticated;
alter policy pwt_read on public.pwt_workspaces using ((select auth.uid())=owner_id or (select pwt_private.verified_email())=any(member_emails));
alter policy pwt_edit on public.pwt_workspaces using ((select auth.uid())=owner_id or (select pwt_private.verified_email())=any(member_emails))
with check ((select auth.uid())=owner_id or (select pwt_private.verified_email())=any(member_emails));
