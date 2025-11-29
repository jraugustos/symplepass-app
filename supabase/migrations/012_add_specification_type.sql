-- Add specification_type to event_course_info
ALTER TABLE event_course_info 
ADD COLUMN specification_type text DEFAULT 'course' CHECK (specification_type IN ('course', 'championship_format'));

-- Update existing records to have 'course' as default
UPDATE event_course_info SET specification_type = 'course' WHERE specification_type IS NULL;
