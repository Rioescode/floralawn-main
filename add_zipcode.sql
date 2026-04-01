-- Add zipcode column to existing table
ALTER TABLE dump_locations
ADD COLUMN zipcode TEXT NOT NULL DEFAULT '02888';

-- After adding data, you can remove the default
ALTER TABLE dump_locations
ALTER COLUMN zipcode DROP DEFAULT; 