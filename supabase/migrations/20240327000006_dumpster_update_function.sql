-- Create function to update dumpster information
CREATE OR REPLACE FUNCTION public.update_dumpster(
    p_dumpster_id UUID,
    p_owner_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_size TEXT DEFAULT NULL,
    p_daily_rate DECIMAL(10,2) DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_features TEXT[] DEFAULT NULL,
    p_images TEXT[] DEFAULT NULL,
    p_availability_status TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_dumpster_owner_id UUID;
    v_updated_dumpster JSONB;
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
        RAISE EXCEPTION 'Not authorized to update this dumpster';
    END IF;

    -- Update only the provided fields
    UPDATE dumpster_rentals
    SET
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        size = COALESCE(p_size, size),
        daily_rate = COALESCE(p_daily_rate, daily_rate),
        location = COALESCE(p_location, location),
        features = COALESCE(p_features, features),
        images = COALESCE(p_images, images),
        availability_status = COALESCE(p_availability_status, availability_status),
        updated_at = NOW()
    WHERE id = p_dumpster_id
    RETURNING jsonb_build_object(
        'id', id,
        'title', title,
        'description', description,
        'size', size,
        'daily_rate', daily_rate,
        'location', location,
        'features', features,
        'images', images,
        'availability_status', availability_status,
        'updated_at', updated_at
    ) INTO v_updated_dumpster;

    RETURN v_updated_dumpster;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating dumpster: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 