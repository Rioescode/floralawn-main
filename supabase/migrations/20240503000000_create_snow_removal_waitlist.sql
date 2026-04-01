-- Create the moddatetime extension if it doesn't exist
create extension if not exists moddatetime schema extensions;

-- Create snow removal waitlist table
create table public.snow_removal_waitlist (
    id uuid default uuid_generate_v4() primary key,
    customer_id uuid references auth.users(id),
    name text not null,
    email text not null,
    phone text not null,
    address text not null,
    city text not null,
    property_type text not null,
    driveway_size text not null,
    sidewalks boolean default false,
    walkways boolean default false,
    salting boolean default false,
    service_type text not null,
    booking_type text not null,
    discount_tier text not null,
    discount_percentage integer not null,
    status text not null default 'waitlist',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.snow_removal_waitlist enable row level security;

-- Create policies
create policy "Users can view their own waitlist entries"
    on public.snow_removal_waitlist for select
    using (auth.uid() = customer_id);

create policy "Users can insert their own waitlist entries"
    on public.snow_removal_waitlist for insert
    with check (true);  -- Allow all inserts, we handle validation in the application

create policy "Users can update their own waitlist entries"
    on public.snow_removal_waitlist for update
    using (auth.uid() = customer_id);

-- Create updated_at trigger
create trigger handle_updated_at before update
    on public.snow_removal_waitlist
    for each row
    execute function moddatetime(updated_at);

-- Grant access to authenticated users
grant usage on schema public to authenticated;
grant all on public.snow_removal_waitlist to authenticated;

-- Grant access to anon users for insert only
grant usage on schema public to anon;
grant insert on public.snow_removal_waitlist to anon; 