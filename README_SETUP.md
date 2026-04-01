# Database Setup Instructions

## Business Settings Table

To enable home base address persistence, you need to create the `business_settings` table in your Supabase database.

### Option 1: Using Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
-- Create business_settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  home_base_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own settings
CREATE POLICY "Users can manage their own business settings" ON business_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);
```

### Option 2: Using the SQL file
Run the SQL script that was created:
```bash
# The SQL commands are in create_business_settings_table.sql
```

## Features Added

### 1. Home Base Address Persistence
- Home base address is now saved to Supabase
- Persists after page refresh
- Automatically loads when you visit the schedule page

### 2. Smart Assignment Improvements
- Fixed MAX_ELEMENTS_EXCEEDED error
- Added fallback clustering for large customer lists
- Uses geographic clustering when Distance Matrix API limits are reached
- Properly assigns to the correct day format (Monday Week 1, etc.)

### 3. Proximity Data
- Distance and travel time are saved to customer records
- Shows on customer cards permanently
- Displays when proximity was last updated 