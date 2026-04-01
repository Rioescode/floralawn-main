-- Drop existing type if exists
drop type if exists user_role cascade;

-- Create roles enum
create type user_role as enum ('admin', 'customer');

-- Drop existing tables if they exist
drop table if exists appointments cascade;
drop table if exists profiles cascade;

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role user_role default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create appointments table
create table appointments (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users on delete cascade not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  service_type text not null,
  city text not null,
  appointment_date timestamp with time zone not null,
  notes text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drop existing function if exists
drop function if exists public.handle_new_user() cascade;

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  admin_emails text[] := array['esckoofficial@gmail.com']; -- Add your admin emails here
begin
  insert into public.profiles (id, email, role)
  values (
    new.id, 
    new.email, 
    CASE 
      WHEN new.email = ANY(admin_emails) THEN 'admin'::user_role 
      ELSE 'customer'::user_role 
    END
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update existing users to admin if they exist
DO $$
BEGIN
  UPDATE profiles 
  SET role = 'admin'
  WHERE email IN ('esckoofficial@gmail.com');
END $$;

-- Set up RLS (Row Level Security)
alter table profiles enable row level security;
alter table appointments enable row level security;

-- Drop existing policies
drop policy if exists "Profiles are viewable by users who created them" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Only admins can update roles" on profiles;
drop policy if exists "View appointments" on appointments;
drop policy if exists "Update appointments" on appointments;
drop policy if exists "Create appointments" on appointments;
drop policy if exists "Delete appointments" on appointments;

-- Profile policies
create policy "Profiles are viewable by users who created them"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Only admins can update roles"
  on profiles for update
  using ( auth.uid() in (
    select id from profiles where role = 'admin'
  ));

-- Appointment policies
create policy "View appointments"
  on appointments for select
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    ) OR customer_id = auth.uid()
  );

create policy "Update appointments"
  on appointments for update
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    ) OR customer_id = auth.uid()
  );

create policy "Create appointments"
  on appointments for insert
  with check (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    ) OR customer_id = auth.uid()
  );

create policy "Delete appointments"
  on appointments for delete
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create indexes for better performance
create index idx_appointments_customer_id on appointments(customer_id);
create index idx_appointments_appointment_date on appointments(appointment_date);
create index idx_appointments_status on appointments(status);
create index idx_profiles_role on profiles(role); 