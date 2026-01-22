-- Supabase Schema for CineTracker
-- Run this in your Supabase SQL Editor

-- Helper to create document-store style tables
create or replace function create_entity_table(table_name text) returns void as $$
begin
    execute format('create table if not exists %I (
        id text primary key,
        data jsonb not null,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
    )', table_name);

    execute format('alter table %I enable row level security', table_name);
    
    -- For dev simplicity, creating open policy. 
    -- PRODUCTION WARNING: You should restrict this later!
    execute format('create policy "Public Access" on %I for all using (true) with check (true)', table_name);
end;
$$ language plpgsql;

-- Create tables for all entities
select create_entity_table('media');
select create_entity_table('watchschedule');
select create_entity_table('watchparty');
select create_entity_table('user');  -- key collision with postgres 'user' keyword? 'user' is reserved.
select create_entity_table('userpermissions');
select create_entity_table('userrequest');
select create_entity_table('subscription');
select create_entity_table('platformsubscription');
select create_entity_table('plan');
select create_entity_table('payment');
select create_entity_table('paymentrequest');
select create_entity_table('invoice');
select create_entity_table('configurableoption');
select create_entity_table('appconfig');
select create_entity_table('upiconfig');
select create_entity_table('logo');
select create_entity_table('option');
select create_entity_table('universe');
select create_entity_table('adminnotification');
select create_entity_table('schedulednotification');
select create_entity_table('notification');
select create_entity_table('emailtemplate');
select create_entity_table('usageanalytics');
select create_entity_table('request');
select create_entity_table('cancellation');
select create_entity_table('weeklyrelease');

-- Rename 'user' table if issues arise, usually Supabase handles 'public.user' fine vs 'auth.users', 
-- but calling it 'app_users' might be safer. For now keeping 'user' to match app entity name.
-- Note: You might need to quote "user" when querying.

-- Seed default plans (optional but helpful)
insert into plan (id, data) values 
('plan_trial', '{"id": "plan_trial", "name": "Trial", "price": 0, "is_active": true, "billing_cycle": "trial"}'),
('plan_monthly', '{"id": "plan_monthly", "name": "Pro Monthly", "price": 29900, "is_active": true, "billing_cycle": "monthly"}'),
('plan_yearly', '{"id": "plan_yearly", "name": "Pro Yearly", "price": 299900, "is_active": true, "billing_cycle": "yearly"}')
on conflict (id) do nothing;
