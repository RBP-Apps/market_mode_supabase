-- Alter dispatch_materials table to add telly_photo column
ALTER TABLE public.dispatch_materials 
ADD COLUMN IF NOT EXISTS telly_photo TEXT;
