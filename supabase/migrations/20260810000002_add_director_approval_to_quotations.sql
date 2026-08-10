-- Migration: Add director_approval and director_approval_time columns to quotation tables

-- 1. Add columns to public.new_quatation_create
ALTER TABLE public.new_quatation_create 
ADD COLUMN IF NOT EXISTS director_approval TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS director_approval_time TIMESTAMPTZ;

-- 2. Add columns to public.quatation_10kw
ALTER TABLE public.quatation_10kw 
ADD COLUMN IF NOT EXISTS director_approval TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS director_approval_time TIMESTAMPTZ;

-- 3. Set default 'Pending' status for existing records
UPDATE public.new_quatation_create 
SET director_approval = 'Pending' 
WHERE director_approval IS NULL;

UPDATE public.quatation_10kw 
SET director_approval = 'Pending' 
WHERE director_approval IS NULL;
