-- Create function to unbook/cancel a dumpster rental
CREATE OR REPLACE FUNCTION public.unbook_dumpster(
    p_dumpster_id UUID,
    p_owner_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_dumpster_owner_id UUID;
    v_active_booking_id UUID;
BEGIN
    -- Check if dumpster exists and belongs to owner
    SELECT owner_id
    INTO v_dumpster_owner_id
    FROM dumpster_rentals
    WHERE id = p_dumpster_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dumpster not found';
    END IF;

    IF v_dumpster_owner_id != p_owner_id THEN
        RAISE EXCEPTION 'Not authorized to unbook this dumpster';
    END IF;

    -- Get the active booking if exists
    SELECT id
    INTO v_active_booking_id
    FROM dumpster_bookings
    WHERE dumpster_id = p_dumpster_id
    AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    -- If there's an active booking, cancel it
    IF v_active_booking_id IS NOT NULL THEN
        UPDATE dumpster_bookings
        SET 
            status = 'cancelled',
            updated_at = NOW()
        WHERE id = v_active_booking_id;
    END IF;

    -- Update dumpster status back to available
    UPDATE dumpster_rentals
    SET 
        availability_status = 'available',
        updated_at = NOW()
    WHERE id = p_dumpster_id;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (in a real application)
        RAISE NOTICE 'Error in unbook_dumpster: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 