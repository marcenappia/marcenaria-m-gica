-- Align the independent Marcenaria Magica database with the current app code.
-- Keep the existing "obras" bucket; the app uses "ambientes".
alter table public.projects drop constraint if exists projects_render_status_check;
alter table public.projects add constraint projects_render_status_check
  check (render_status = any (array['idle','running','done','error']::text[]));

alter table public.projects drop constraint if exists projects_analysis_status_check;
alter table public.projects add constraint projects_analysis_status_check
  check (analysis_status = any (array['idle','running','done','error']::text[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ambientes', 'ambientes', false, 20971520, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "User can read own ambientes objects" on storage.objects;
create policy "User can read own ambientes objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'ambientes' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "User can upload own ambientes objects" on storage.objects;
create policy "User can upload own ambientes objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ambientes' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "User can update own ambientes objects" on storage.objects;
create policy "User can update own ambientes objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'ambientes' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'ambientes' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "User can delete own ambientes objects" on storage.objects;
create policy "User can delete own ambientes objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ambientes' and (storage.foldername(name))[1] = (select auth.uid())::text);
