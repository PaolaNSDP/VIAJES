-- Tabla de viajes. Pegar en Supabase → SQL Editor → Run (solo una vez).
-- Cada viaje se guarda entero en `datos` (transporte, hoteles, itinerario, gastos...).

create table if not exists public.viajes (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);

-- Cada persona solo ve y cambia sus propios viajes.
alter table public.viajes enable row level security;

drop policy if exists "Ver mis viajes" on public.viajes;
create policy "Ver mis viajes" on public.viajes
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Crear mis viajes" on public.viajes;
create policy "Crear mis viajes" on public.viajes
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "Cambiar mis viajes" on public.viajes;
create policy "Cambiar mis viajes" on public.viajes
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Borrar mis viajes" on public.viajes;
create policy "Borrar mis viajes" on public.viajes
  for delete using ((select auth.uid()) = user_id);
