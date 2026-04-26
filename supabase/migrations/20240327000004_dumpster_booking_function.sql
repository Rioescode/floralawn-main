-- Create function to book a dumpster
CREATE OR REPLACE FUNCTION public.book_dumpster(
    p_dumpster_id UUID,
    p_renter_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_total_price DECIMAL(10,2)
) RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_dumpster_status TEXT;
    v_existing_booking_count INTEGER;
BEGIN
    -- Check if dumpster exists and is available
    SELECT availability_status 
    INTO v_dumpster_status
    FROM dumpster_rentals 
    WHERE id = p_dumpster_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dumpster not found';
    END IF;

    IF v_dumpster_status != 'available' THEN
        RAISE EXCEPTION 'Dumpster is not available for booking';
    END IF;

    -- Check for date validity
    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date must be before or equal to end date';
    END IF;

    IF p_start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Start date cannot be in the past';
    END IF;

    -- Check for overlapping bookings
    SELECT COUNT(*)
    INTO v_existing_booking_count
    FROM dumpster_bookings
    WHERE dumpster_id = p_dumpster_id
    AND status != 'cancelled'
    AND (
        (p_start_date BETWEEN start_date AND end_date)
        OR (p_end_date BETWEEN start_date AND end_date)
        OR (start_date BETWEEN p_start_date AND p_end_date)
    );

    IF v_existing_booking_count > 0 THEN
        RAISE EXCEPTION 'Dumpster is already booked for these dates';
    END IF;

    -- Create the booking
    INSERT INTO dumpster_bookings (
        dumpster_id,
        renter_id,
        start_date,
        end_date,
        total_price,
        status
    ) VALUES (
        p_dumpster_id,
        p_renter_id,
        p_start_date,
        p_end_date,
        p_total_price,
        'pending'
    ) RETURNING id INTO v_booking_id;

    -- Update dumpster status
    UPDATE dumpster_rentals
    SET availability_status = 'booked'
    WHERE id = p_dumpster_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 