-- Check if columns exist in jobs table
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'jobs' 
    AND column_name IN (
        'property_size',
        'service_type',
        'lawn_condition',
        'service_frequency',
        'special_equipment',
        'existing_issues'
    ); 