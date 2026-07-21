-- Add pdf_generate column to public.assign_survey table to store the URL of the generated survey report PDF
ALTER TABLE public.assign_survey 
ADD COLUMN IF NOT EXISTS pdf_generate text null;
