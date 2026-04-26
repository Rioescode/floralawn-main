-- Modify the date_needed column to use DATE type instead of TIMESTAMP
ALTER TABLE jobs 
ALTER COLUMN date_needed TYPE DATE USING date_needed::DATE; 