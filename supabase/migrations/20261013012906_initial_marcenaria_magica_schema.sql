-- Initial isolated schema for Marcenaria Mágica.
-- This migration was applied to Supabase project aefpztbvttfuyvvrbejp.
-- No Marcenapp rows or credentials are copied here.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  style text not null default '',
  original_path text,
  render_path text,
  render_model text,
  render_status text not null default 'idle'
    check (render_status in ('idle','queued','processing','completed','failed')),
  render_error text,
  analysis jsonb,
  analysis_status text not null default 'idle'
    check (analysis_status in ('idle','queued','processing','completed','failed')),
  analysis_error text,
  upper_cabinets jsonb not null default '[]'::jsonb,
  lower_cabinets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_created_idx
  on public.projects(user_id, created_at desc);

alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on public.projects for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obras', 'obras', false, 20971520, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "Users can upload their own project files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'obras' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own project files"
  on storage.objects for select to authenticated
  using (bucket_id = 'obras' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own project files"
  on storage.objects for update to authenticated
  using (bucket_id = 'obras' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'obras' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own project files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'obras' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
