-- Step 1: Create the dcr_creation table
CREATE TABLE IF NOT EXISTS public.dcr_creation (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  dcr_number TEXT NULL,
  dcr_certificate TEXT NULL,
  dcr_copy TEXT NULL,
  module_make TEXT NULL,
  module_capacity TEXT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT dcr_creation_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Step 2: Function & Trigger to automatically create a pending DCR creation row when a new enquiry is added
CREATE OR REPLACE FUNCTION public.create_pending_dcr_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dcr_creation (
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

DROP TRIGGER IF EXISTS trigger_create_pending_dcr_creation ON public.enquiries;
CREATE TRIGGER trigger_create_pending_dcr_creation
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_dcr_creation();

-- Step 3: Function & Trigger to calculate delay automatically when actual date is updated
CREATE OR REPLACE FUNCTION public.calculate_dcr_creation_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_dcr_creation_delay ON public.dcr_creation;
CREATE TRIGGER trigger_calculate_dcr_creation_delay
BEFORE INSERT OR UPDATE ON public.dcr_creation
FOR EACH ROW
EXECUTE FUNCTION public.calculate_dcr_creation_delay();

-- Step 4: Populate pending DCR creation entries for existing enquiries
INSERT INTO public.dcr_creation (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.dcr_creation d
    ON d.enquiry_number = e.enquiry_number
WHERE d.enquiry_number IS NULL AND e.enquiry_number IS NOT NULL;
