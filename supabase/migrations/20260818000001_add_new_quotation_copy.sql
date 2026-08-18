-- Migration: Add new_quotation_copy column and drop unique constraints for edit quotation flow
ALTER TABLE public.new_quatation_create 
ADD COLUMN IF NOT EXISTS new_quotation_copy TEXT;

ALTER TABLE public.new_quatation_create 
DROP CONSTRAINT IF EXISTS new_quatation_create_enquiry_number_key;

ALTER TABLE public.quatation_10kw 
ADD COLUMN IF NOT EXISTS new_quotation_copy TEXT;

ALTER TABLE public.quatation_10kw 
DROP CONSTRAINT IF EXISTS quatation_10kw_enquiry_number_key;
