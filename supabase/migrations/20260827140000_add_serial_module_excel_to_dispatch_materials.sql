-- Alter dispatch_materials table to add serial_module_excel column
ALTER TABLE public.dispatch_materials 
ADD COLUMN IF NOT EXISTS serial_module_excel TEXT;
0