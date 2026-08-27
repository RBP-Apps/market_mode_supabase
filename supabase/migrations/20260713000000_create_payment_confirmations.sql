-- Create payment confirmations table
CREATE TABLE IF NOT EXISTS public.payment_confirmations (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  payment_type TEXT NULL,
  cheque_number TEXT NULL,
  utr_number TEXT NULL,
  payment_date DATE NULL,
  amount NUMERIC NULL,
  down_payment NUMERIC NULL,
  loan_sanction_amount NUMERIC NULL,
  payment_70_utr_number TEXT NULL,
  payment_70_date DATE NULL,
  payment_70_amount NUMERIC NULL,
  payment_30_utr_number TEXT NULL,
  payment_30_date DATE NULL,
  payment_30_amount NUMERIC NULL,
  CONSTRAINT payment_confirmations_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add new columns if table already exists
ALTER TABLE public.payment_confirmations
  ADD COLUMN IF NOT EXISTS loan_sanction_amount NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS payment_70_utr_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_70_date DATE NULL,
  ADD COLUMN IF NOT EXISTS payment_70_amount NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS payment_30_utr_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_30_date DATE NULL,
  ADD COLUMN IF NOT EXISTS payment_30_amount NUMERIC NULL;

-- Automatically create a pending payment confirmation row when an enquiry is created
CREATE OR REPLACE FUNCTION public.create_pending_payment_confirmations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.payment_confirmations (
    enquiry_number,
    planned
  )
  VALUES (
    NEW.enquiry_number,
    NEW.timestamp::date
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_create_pending_payment_confirmations
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_payment_confirmations();

-- Automatically calculate delay when actual timestamp is updated
CREATE OR REPLACE FUNCTION public.calculate_payment_confirmations_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_payment_confirmations_delay
BEFORE INSERT OR UPDATE ON public.payment_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.calculate_payment_confirmations_delay();

-- Insert pending payment confirmation rows for existing enquiries
INSERT INTO public.payment_confirmations (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.payment_confirmations pc
    ON pc.enquiry_number = e.enquiry_number
WHERE pc.enquiry_number IS NULL AND e.enquiry_number IS NOT NULL;
