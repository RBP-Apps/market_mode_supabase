-- Migration: Add survey_stage column to assign_survey table

ALTER TABLE public.assign_survey 
ADD COLUMN IF NOT EXISTS survey_stage TEXT DEFAULT 'Survey 1';

-- Update existing records to 'Survey 1' if null
UPDATE public.assign_survey 
SET survey_stage = 'Survey 1' 
WHERE survey_stage IS NULL;
