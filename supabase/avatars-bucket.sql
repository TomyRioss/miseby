-- Bucket público "avatars" para fotos de perfil de MiseLink.
-- Ejecutar una vez en Supabase Dashboard → SQL Editor.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Lectura pública (avatares visibles en la página pública).
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

-- Subidas/borrado solo vía service_role (server action). Sin policies de
-- insert/update/delete para anon/authenticated: el server usa service_role
-- que bypasea RLS.
