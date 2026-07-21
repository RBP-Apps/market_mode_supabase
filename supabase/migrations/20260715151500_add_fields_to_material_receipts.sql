-- Alter material_receipts table to add module_damage and remark columns
ALTER TABLE public.material_receipts 
ADD COLUMN IF NOT EXISTS module_damage TEXT,
ADD COLUMN IF NOT EXISTS remark TEXT;
