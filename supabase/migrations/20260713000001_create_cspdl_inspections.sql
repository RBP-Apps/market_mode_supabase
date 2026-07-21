-- Create cspdl_inspections table
CREATE TABLE IF NOT EXISTS public.cspdl_inspections (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  inspection_status TEXT NULL,
  meter_installation_upload TEXT NULL,
  CONSTRAINT cspdl_inspections_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Automatically create a pending cspdl_inspections row when an enquiry is created
CREATE OR REPLACE FUNCTION public.create_pending_cspdl_inspections()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cspdl_inspections (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_cspdl_inspections
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_cspdl_inspections();

-- Automatically calculate delay when actual timestamp is updated
CREATE OR REPLACE FUNCTION public.calculate_cspdl_inspections_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_cspdl_inspections_delay
BEFORE INSERT OR UPDATE ON public.cspdl_inspections
FOR EACH ROW
EXECUTE FUNCTION public.calculate_cspdl_inspections_delay();

-- Insert pending cspdl_inspections rows for existing enquiries
INSERT INTO public.cspdl_inspections (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.cspdl_inspections ci
    ON ci.enquiry_number = e.enquiry_number
WHERE ci.enquiry_number IS NULL AND e.enquiry_number IS NOT NULL;
