-- Force schema cache refresh
COMMENT ON COLUMN appointments.date IS 'Appointment date';
ALTER TABLE appointments ALTER COLUMN date SET NOT NULL; 