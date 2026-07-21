-- Create dispatch_planner table
CREATE TABLE IF NOT EXISTS public.dispatch_planner (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  challan_copy TEXT NULL,
  whatsapp_number TEXT NULL,
  status TEXT NULL,
  CONSTRAINT dispatch_planner_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Trigger to automatically create pending dispatch planner when a new enquiry is inserted
CREATE OR REPLACE FUNCTION public.create_pending_dispatch_planner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dispatch_planner (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_dispatch_planner
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_dispatch_planner();

-- Trigger to automatically calculate delay when actual date is filled/updated
CREATE OR REPLACE FUNCTION public.calculate_dispatch_planner_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_dispatch_planner_delay
BEFORE INSERT OR UPDATE ON public.dispatch_planner
FOR EACH ROW
EXECUTE FUNCTION public.calculate_dispatch_planner_delay();

-- Insert pending records for existing enquiries
INSERT INTO public.dispatch_planner (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.dispatch_planner dp
    ON dp.enquiry_number = e.enquiry_number
WHERE dp.enquiry_number IS NULL AND e.enquiry_number IS NOT NULL;
