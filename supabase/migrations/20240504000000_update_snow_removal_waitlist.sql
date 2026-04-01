-- Add missing columns to snow_removal_waitlist table
alter table public.snow_removal_waitlist
    add column if not exists property_type text,
    add column if not exists driveway_size text,
    add column if not exists sidewalks boolean default false,
    add column if not exists walkways boolean default false,
    add column if not exists salting boolean default false;

-- Update RLS policies to include new columns
drop policy if exists "Users can view their own waitlist entries" on public.snow_removal_waitlist;
drop policy if exists "Users can insert their own waitlist entries" on public.snow_removal_waitlist;
drop policy if exists "Users can update their own waitlist entries" on public.snow_removal_waitlist;

create policy "Users can view their own waitlist entries"
    on public.snow_removal_waitlist for select
    using (auth.uid() = customer_id);

create policy "Users can insert their own waitlist entries"
    on public.snow_removal_waitlist for insert
    with check (true);

create policy "Users can update their own waitlist entries"
    on public.snow_removal_waitlist for update
    using (auth.uid() = customer_id); 