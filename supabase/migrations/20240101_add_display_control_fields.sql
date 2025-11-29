-- Add display control fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS show_course_info BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_championship_format BOOLEAN DEFAULT true;

-- Update existing events to have default values
UPDATE events
SET show_course_info = true,
    show_championship_format = true
WHERE show_course_info IS NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN events.show_course_info IS 'Controls whether to display course/percurso section on event page';
COMMENT ON COLUMN events.show_championship_format IS 'Controls whether to display championship format section on event page';