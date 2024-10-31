-- Add sample video generations for testing
INSERT INTO public.video_generations (
    template_id,
    contact_id,
    status,
    video_url,
    metadata,
    created_at
)
SELECT 
    tr.id as template_id,
    'contact_' || generate_series(1, 3) as contact_id,
    CASE generate_series(1, 3)
        WHEN 1 THEN 'completed'
        WHEN 2 THEN 'processing'
        WHEN 3 THEN 'pending'
    END as status,
    CASE generate_series(1, 3)
        WHEN 1 THEN 'https://example.com/sample-video-1.mp4'
        ELSE null
    END as video_url,
    jsonb_build_object(
        'contact', jsonb_build_object(
            'firstName', CASE generate_series(1, 3)
                WHEN 1 THEN 'John'
                WHEN 2 THEN 'Jane'
                WHEN 3 THEN 'Mike'
            END,
            'lastName', CASE generate_series(1, 3)
                WHEN 1 THEN 'Doe'
                WHEN 2 THEN 'Smith'
                WHEN 3 THEN 'Johnson'
            END,
            'email', CASE generate_series(1, 3)
                WHEN 1 THEN 'john.doe@example.com'
                WHEN 2 THEN 'jane.smith@example.com'
                WHEN 3 THEN 'mike.johnson@example.com'
            END,
            'company', CASE generate_series(1, 3)
                WHEN 1 THEN 'Acme Corp'
                WHEN 2 THEN 'Tech Solutions'
                WHEN 3 THEN 'Global Industries'
            END
        )
    ),
    NOW() - (CASE generate_series(1, 3)
        WHEN 1 THEN INTERVAL '1 hour'
        WHEN 2 THEN INTERVAL '2 hours'
        WHEN 3 THEN INTERVAL '3 hours'
    END)
FROM template_requests tr
WHERE tr.status = 'completed'
AND tr.heygen_template_id IS NOT NULL
LIMIT 1;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';