-- Step 2: Create the enquiries table (parent table)
create table public.enquiries (
  id bigserial not null,
  timestamp timestamp without time zone null,
  enquiry_number text null,
  beneficiary_name text null,
  beneficiary_number text null,
  contact_number text null,
  address text null,
  village_block text null,
  district text null,
  present_load text null,
  bp_number text null,
  cspdcl_contract_demand text null,
  avg_electricity_bill text null,
  future_load_requirement text null,
  load_details text null,
  structure_type text null,
  roof_type text null,
  system_type text null,
  need_type text null,
  project_mode text null,
  firm_name text null,
  assigned_by text null,
  reference text null,
  payment_type text null,
  constraint enquiries_pkey primary key (id),
  constraint enquiries_enquiry_number_key unique (enquiry_number)
) TABLESPACE pg_default;


-- Function to generate enquiry number automatically (EN-001, EN-002, etc.)
CREATE OR REPLACE FUNCTION public.generate_enquiry_number()
RETURNS TRIGGER AS $$
DECLARE
  max_num INT;
  latest_enq TEXT;
BEGIN
  -- If enquiry_number is not provided or is empty, generate it automatically
  IF NEW.enquiry_number IS NULL OR NEW.enquiry_number = '' THEN
    -- Get the maximum number from existing EN-XXX patterns
    SELECT enquiry_number INTO latest_enq
    FROM public.enquiries
    WHERE enquiry_number ~ '^EN-\d+$'
    ORDER BY substring(enquiry_number from 4)::integer DESC
    LIMIT 1;

    IF latest_enq IS NULL THEN
      NEW.enquiry_number := 'EN-001';
    ELSE
      max_num := (substring(latest_enq from 4)::integer) + 1;
      NEW.enquiry_number := 'EN-' || lpad(max_num::text, 3, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before insert
CREATE OR REPLACE TRIGGER trigger_generate_enquiry_number
BEFORE INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.generate_enquiry_number();



-- Step 3: Create the survey table
create table public.assign_survey (
  id bigserial not null,
  enquiry_id bigint not null,
  planned_1 date null,
  actual_1 timestamp without time zone null,
  delay_1 text null,
  survey_date timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  phase text null,
  backup_hours text null,
  no_of_floors text null,
  roof_top_area text null,
  grid_supply_available text null,
  control_room_space text null,
  control_room_area text null,
  distance_modules_to_control_room text null,
  distance_module_to_dcdb_earthing text null,
  distance_inverter_acdb_to_earthing text null,
  distance_la_to_earthing text null,
  distance_inverter_mcb_meter text null,
  shadow_free_area_terrace text null,
  geotag_photos jsonb null,
  electricity_bills_3months jsonb null,
  id_proof text null,
  address_proof text null,
  surveyor_name text null,
  surveyor_contact text null,
  constraint survey_pkey primary key (id),
  constraint assign_survey_enquiry_id_key unique (enquiry_id),
  constraint assign_survey_enquiry_id_fkey foreign KEY (enquiry_id) references enquiries (id) on delete CASCADE
) TABLESPACE pg_default;


-- Trigger to automatically create a pending survey row when an enquiry is created
CREATE OR REPLACE FUNCTION public.create_pending_survey()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.assign_survey (
    enquiry_id,
    planned_1
   
  ) VALUES (
    NEW.id,
    NEW.timestamp::date
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_create_pending_survey
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_survey();

-- Trigger to automatically calculate delay when actual_1 is updated
CREATE OR REPLACE FUNCTION public.calculate_survey_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_1 IS NOT NULL AND NEW.planned_1 IS NOT NULL THEN
    NEW.delay_1 := (NEW.actual_1::date - NEW.planned_1::date)::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_survey_delay
BEFORE UPDATE ON public.assign_survey
FOR EACH ROW
EXECUTE FUNCTION public.calculate_survey_delay();


------------  Site Survey-------------
create table public.site_surveys (
  id bigserial not null,
  enquiry_number text null,
  planned date null,
  actual timestamp without time zone null,
  delay text null,
  status text null,
  survey_report text null,
  geotag_photo text null,
  bill_copy text null,
  aadhar_card text null,
  pan_card text null,
  address_proof text null,
  surveyor_name text null,
  surveyor_contact text null,
  ip_name text null,
  ip_contact text null,
  constraint site_surveys_pkey primary key (id),
  constraint site_surveys_enquiry_number_key unique (enquiry_number),
  constraint site_surveys_enquiry_number_fkey foreign KEY (enquiry_number) references enquiries (enquiry_number) on delete CASCADE
) TABLESPACE pg_default;

-- Automatically create a pending site survey row when an enquiry is created
CREATE OR REPLACE FUNCTION public.create_pending_site_survey()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.site_surveys (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_site_survey
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_site_survey();


-- Automatically calculate delay when actual date is updated
CREATE OR REPLACE FUNCTION public.calculate_site_survey_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_site_survey_delay
BEFORE UPDATE ON public.site_surveys
FOR EACH ROW
EXECUTE FUNCTION public.calculate_site_survey_delay();


-- data lane ke lioye planned wala phle se jo table me h
INSERT INTO public.site_surveys (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.site_surveys s
    ON s.enquiry_number = e.enquiry_number
WHERE s.enquiry_number IS NULL;




-- Quotation Create

CREATE TABLE public.new_new_quatation_create (
    id BIGSERIAL PRIMARY KEY,

    enquiry_number TEXT UNIQUE,

    planned TIMESTAMP WITHOUT TIME ZONE NULL,
    actual TIMESTAMP WITHOUT TIME ZONE NULL,
    delay INTEGER NULL,

    product TEXT NULL,

    salesperson TEXT NULL,
    customer TEXT NULL,
    contact_no VARCHAR(20) NULL,
    email TEXT NULL,
    dealer TEXT NULL,
    alternative_phone_no VARCHAR(20) NULL,

    structure_type TEXT NULL,
    place_of_installation TEXT NULL,
    terms_conditions TEXT NULL,

    qty INTEGER NULL,

    central_subsidy NUMERIC NULL,
    state_subsidy NUMERIC NULL,
    discount_percent NUMERIC NULL,

    need_type TEXT NULL,
    reference_by TEXT NULL,

    bank_name TEXT NULL,
    account_no VARCHAR(50) NULL,
    ifsc_code VARCHAR(20) NULL,
    branch TEXT NULL,

    general_terms_conditions TEXT NULL,
    load_details TEXT NULL,

    product_name TEXT NULL,
    bill_of_material TEXT NULL,

    size TEXT NULL,
    gst NUMERIC NULL,
    rate NUMERIC NULL,
    amount NUMERIC NULL,
    net_cost NUMERIC NULL,

    quatation_copy TEXT NULL,

    quotation_date TEXT NULL,

    send_status TEXT NULL,
    send_status_time DATE NULL,

    status TEXT DEFAULT 'Approved',

    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    FOREIGN KEY (enquiry_number)
    REFERENCES public.enquiries(enquiry_number)
    ON DELETE CASCADE
);


CREATE OR REPLACE FUNCTION public.create_pending_new_quotation()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO public.new_new_quatation_create
    (
        enquiry_number,
        planned
    )
    VALUES
    (
        NEW.enquiry_number,
        NEW.timestamp
    );

    RETURN NEW;

END;
$$
LANGUAGE plpgsql;



CREATE OR REPLACE TRIGGER trigger_create_pending_new_quotation
AFTER INSERT
ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_new_quotation();


CREATE OR REPLACE FUNCTION public.calculate_new_quotation_delay()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.actual IS NOT NULL
       AND NEW.planned IS NOT NULL THEN

        NEW.delay := (NEW.actual::date - NEW.planned::date);

    END IF;

    RETURN NEW;

END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_new_quotation_delay
BEFORE UPDATE
ON public.new_new_quatation_create
FOR EACH ROW
EXECUTE FUNCTION public.calculate_new_quotation_delay();


INSERT INTO public.new_new_quatation_create
(
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp
FROM public.enquiries e
LEFT JOIN public.new_new_quatation_create q
       ON q.enquiry_number = e.enquiry_number
WHERE q.enquiry_number IS NULL;


-- more than 10KW
create table public.quatation_10kw (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  enquiry_number text not null,
  proposal_for text null,
  prepared_for text null,
  dated text null,
  capacity_mwp text null,
  module_count text null,
  land_acres text null,
  annual_gen text null,
  co2_tonnes text null,
  capacity_wp text null,
  tariff_low text null,
  savings_low text null,
  tariff_high text null,
  savings_high text null,
  capex_cr text null,
  savings_25_low text null,
  savings_25_high text null,
  price_material text null,
  price_gst_supply text null,
  price_total_a text null,
  price_om text null,
  price_om_gst text null,
  price_total_b text null,
  price_total text null,
  price_words text null,
  quatation_copy text null,
  status text null default 'Approved'::text,
  constraint quatation_10kw_pkey primary key (id),
  constraint quatation_10kw_enquiry_number_key unique (enquiry_number)
) TABLESPACE pg_default;



-- Sales call ------------
CREATE TABLE public.sales_calls (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  customer_feedback TEXT NULL,
  stage TEXT NULL,
  next_call_date DATE NULL,
  value_order TEXT NULL,
  CONSTRAINT sales_calls_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_sales_calls()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sales_calls (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_sales_calls
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_sales_calls();


CREATE OR REPLACE FUNCTION public.calculate_sales_calls_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.sales_calls (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.sales_calls s
    ON s.enquiry_number = e.enquiry_number
WHERE s.enquiry_number IS NULL;




-- solarkart --------------
CREATE TABLE public.order_placements (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  module TEXT NULL,
  inverter TEXT NULL,
  bos TEXT NULL,
  acdb TEXT NULL,
  dcdb TEXT NULL,
  order_copy_1 TEXT NULL,
  order_copy_2 TEXT NULL,
  order_copy_3 TEXT NULL,
  order_copy_4 TEXT NULL,
  CONSTRAINT order_placements_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_order_placements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.order_placements (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_order_placements
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_order_placements();


CREATE OR REPLACE FUNCTION public.calculate_order_placements_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.order_placements (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.order_placements op
    ON op.enquiry_number = e.enquiry_number
WHERE op.enquiry_number IS NULL;



-- IP Assignment ---
CREATE TABLE public.ip_assignments (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  ip_name TEXT NULL,
  ip_contact TEXT NULL,
  CONSTRAINT ip_assignments_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_ip_assignments()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ip_assignments (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_ip_assignments
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_ip_assignments();


CREATE OR REPLACE FUNCTION public.calculate_ip_assignments_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.ip_assignments (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.ip_assignments ip
    ON ip.enquiry_number = e.enquiry_number
WHERE ip.enquiry_number IS NULL;

-- Dispatch Material
CREATE TABLE public.dispatch_materials (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  CONSTRAINT dispatch_materials_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_dispatch_materials()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dispatch_materials (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_dispatch_materials
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_dispatch_materials();


CREATE OR REPLACE FUNCTION public.calculate_dispatch_materials_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.dispatch_materials (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.dispatch_materials dm
    ON dm.enquiry_number = e.enquiry_number
WHERE dm.enquiry_number IS NULL;


-- Inform to customer
CREATE TABLE public.customer_notifications (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  CONSTRAINT customer_notifications_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_customer_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_notifications (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_customer_notifications
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_customer_notifications();


CREATE OR REPLACE FUNCTION public.calculate_customer_notifications_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.customer_notifications (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.customer_notifications cn
    ON cn.enquiry_number = e.enquiry_number
WHERE cn.enquiry_number IS NULL;


-- material received

CREATE TABLE public.material_receipts (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  receipt_copy TEXT NULL,
  receipt_date DATE NULL,
  CONSTRAINT material_receipts_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_material_receipts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.material_receipts (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_material_receipts
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_material_receipts();


CREATE OR REPLACE FUNCTION public.calculate_material_receipts_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.material_receipts (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.material_receipts mr
    ON mr.enquiry_number = e.enquiry_number
WHERE mr.enquiry_number IS NULL;


-- installation 
CREATE TABLE public.installations (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  installation_date DATE NULL,
  phase TEXT NULL,
  earthing TEXT NULL,
  base_foundation TEXT NULL,
  wiring TEXT NULL,
  plant_photo TEXT NULL,
  dcr_certificate TEXT NULL,
  module_warranty TEXT NULL,
  installation_photo TEXT NULL,
  inverter_make TEXT NULL,
  inverter_capacity TEXT NULL,
  module_make TEXT NULL,
  module_capacity TEXT NULL,
  module_type TEXT NULL,
  structure_make TEXT NULL,
  inverter_id TEXT NULL,
  CONSTRAINT installations_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_installations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.installations (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_installations
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_installations();


CREATE OR REPLACE FUNCTION public.calculate_installations_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.installations (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.installations i
    ON i.enquiry_number = e.enquiry_number
WHERE i.enquiry_number IS NULL;



-- billing
CREATE TABLE public.billings (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  invoice_number TEXT NULL,
  invoice_amount NUMERIC NULL,
  invoice_copy TEXT NULL,
  payment_date DATE NULL,
  amount_received NUMERIC NULL,
  payment_reference TEXT NULL,
  outstanding NUMERIC NULL,
  deduction NUMERIC NULL,
  date DATE NULL,
  amount NUMERIC NULL,
  check_number TEXT NULL,
  tax_invoice TEXT NULL,
  invoice_date DATE NULL,
  CONSTRAINT billings_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_billings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.billings (
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


CREATE OR REPLACE TRIGGER trigger_create_pending_billings
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_billings();


CREATE OR REPLACE FUNCTION public.calculate_billings_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- for insert  data to  planned when enquiry create
INSERT INTO public.billings (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.billings b
    ON b.enquiry_number = e.enquiry_number
WHERE b.enquiry_number IS NULL;


-- documents_uploads
create table public.documents_uploads (
  id bigserial not null,
  enquiry_number text null,
  planned date null,
  actual timestamp without time zone null,
  delay text null,
  electricity_bill text null,
  aadhar_number text null,
  pan_number text null,
  address_proof text null,
  surveyor_name text null,
  pan_card_copy text null,
  aadhar_card_copy text null,
  registered_mobile_number character varying(20) null,
  email_id text null,
  bank_document_copy text null,
  property_tax_receipt text null,
  site_pre_installation text null,
  constraint documents_uploads_pkey primary key (id),
  constraint documents_uploads_enquiry_number_key unique (enquiry_number),
  constraint documents_uploads_enquiry_number_fkey foreign KEY (enquiry_number) references enquiries (enquiry_number) on delete CASCADE
) TABLESPACE pg_default;

CREATE OR REPLACE FUNCTION public.create_pending_documents_uploads()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.documents_uploads (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_documents_uploads
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_documents_uploads();

CREATE OR REPLACE FUNCTION public.calculate_documents_uploads_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_documents_uploads_delay
BEFORE INSERT OR UPDATE ON public.documents_uploads
FOR EACH ROW
EXECUTE FUNCTION public.calculate_documents_uploads_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.documents_uploads (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.documents_uploads du
    ON du.enquiry_number = e.enquiry_number
WHERE du.enquiry_number IS NULL;



-- Insurance 
CREATE TABLE public.project_insurance (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  premium_amount NUMERIC NULL,
  company_name TEXT NULL,
  policy_number TEXT NULL,
  policy_date DATE NULL,
  policy_period TEXT NULL,
  aadhar_card_insurance TEXT NULL,
  tax_invoice TEXT NULL,
  address_proof_insurance TEXT NULL,
  commission TEXT NULL,
  certificate TEXT NULL,
  CONSTRAINT project_insurance_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_project_insurance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_insurance (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_project_insurance
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_project_insurance();

CREATE OR REPLACE FUNCTION public.calculate_project_insurance_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_project_insurance_delay
BEFORE INSERT OR UPDATE ON public.project_insurance
FOR EACH ROW
EXECUTE FUNCTION public.calculate_project_insurance_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.project_insurance (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.project_insurance pi
    ON pi.enquiry_number = e.enquiry_number
WHERE pi.enquiry_number IS NULL;



-- Subsidy ------------

CREATE TABLE public.subsidy_disbursals (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  central_subsidy NUMERIC NULL,
  state_subsidy NUMERIC NULL,
  CONSTRAINT subsidy_disbursals_pkey PRIMARY KEY (id)
);


CREATE OR REPLACE FUNCTION public.create_pending_subsidy_disbursals()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subsidy_disbursals (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_subsidy_disbursals
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_subsidy_disbursals();

CREATE OR REPLACE FUNCTION public.calculate_subsidy_disbursals_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_subsidy_disbursals_delay
BEFORE INSERT OR UPDATE ON public.subsidy_disbursals
FOR EACH ROW
EXECUTE FUNCTION public.calculate_subsidy_disbursals_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.subsidy_disbursals (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.subsidy_disbursals sd
    ON sd.enquiry_number = e.enquiry_number
WHERE sd.enquiry_number IS NULL;





-- subsidy redemptions -------
CREATE TABLE public.subsidy_redemptions (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  CONSTRAINT subsidy_redemptions_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_subsidy_redemptions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subsidy_redemptions (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_subsidy_redemptions
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_subsidy_redemptions();

CREATE OR REPLACE FUNCTION public.calculate_subsidy_redemptions_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_subsidy_redemptions_delay
BEFORE INSERT OR UPDATE ON public.subsidy_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_subsidy_redemptions_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.subsidy_redemptions (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.subsidy_redemptions sr
    ON sr.enquiry_number = e.enquiry_number
WHERE sr.enquiry_number IS NULL;



--  inspection

CREATE TABLE public.inspections (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  date_of_inspection TIMESTAMP WITHOUT TIME ZONE NULL,
  remark TEXT NULL,
  deduction NUMERIC NULL,
  CONSTRAINT inspections_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_inspections()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inspections (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_inspections
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_inspections();

CREATE OR REPLACE FUNCTION public.calculate_inspections_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_inspections_delay
BEFORE INSERT OR UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.calculate_inspections_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.inspections (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.inspections i
    ON i.enquiry_number = e.enquiry_number
WHERE i.enquiry_number IS NULL;



--  qc
CREATE TABLE public.qc (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  
  inverter_serial TEXT NULL,
  inverter_make TEXT NULL,
  inverter_capacity TEXT NULL,
  structure_type TEXT NULL,
  structure_make TEXT NULL,
  inverter_ip_wifi TEXT NULL,
  
  dcdb_serial TEXT NULL,
  dc_spd_make TEXT NULL,
  dc_fuse_make TEXT NULL,
  dc_mcb_make TEXT NULL,
  
  acdb_serial TEXT NULL,
  ac_spd_make TEXT NULL,
  ac_mcb_make TEXT NULL,
  
  structure_material TEXT NULL,
  
  ac_cable_make TEXT NULL,
  ac_cable_size TEXT NULL,
  ac_cable_length TEXT NULL,
  
  dc_cable_make TEXT NULL,
  dc_cable_size TEXT NULL,
  dc_cable_length TEXT NULL,
  
  earthing_count TEXT NULL,
  earthing_type TEXT NULL,
  earthing_make TEXT NULL,
  earthing_chemical_make TEXT NULL,
  earthing_size_make TEXT NULL,
  
  net_meter_serial TEXT NULL,
  solar_meter_serial TEXT NULL,
  ct_ratio TEXT NULL,
  
  checklist JSONB NULL,
  documents JSONB NULL,
  remarks TEXT NULL,
  
  CONSTRAINT qc_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_qc()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.qc (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_qc
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_qc();

CREATE OR REPLACE FUNCTION public.calculate_qc_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_qc_delay
BEFORE INSERT OR UPDATE ON public.qc
FOR EACH ROW
EXECUTE FUNCTION public.calculate_qc_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.qc (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.qc q
    ON q.enquiry_number = e.enquiry_number
WHERE q.enquiry_number IS NULL;




-- registration

CREATE TABLE public.registration (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  application_number TEXT NULL,
  application_date TIMESTAMP WITHOUT TIME ZONE NULL,
  CONSTRAINT registration_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.registration (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_registration
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_registration();

CREATE OR REPLACE FUNCTION public.calculate_registration_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_registration_delay
BEFORE INSERT OR UPDATE ON public.registration
FOR EACH ROW
EXECUTE FUNCTION public.calculate_registration_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.registration (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.registration r
    ON r.enquiry_number = e.enquiry_number
WHERE r.enquiry_number IS NULL;



-- Payment -------------

CREATE TABLE public.payments (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  payment_type TEXT NULL,
  check_number TEXT NULL,
  payment_date DATE NULL,
  amount NUMERIC NULL,
  deduction NUMERIC NULL,
  loan_apply TEXT NULL,
  submission_upload TEXT NULL,
  application_number TEXT NULL,
  registration_number TEXT NULL,
  feasibility_report TEXT NULL,
  digital_loan_approval TEXT NULL,
  site_feasibility_report TEXT NULL,
  electricity_bill TEXT NULL,
  aadhaar_card TEXT NULL,
  pan_card TEXT NULL,
  bank_statement TEXT NULL,
  vendor_consumer_agreement TEXT NULL,
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.create_pending_payments()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.payments (
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

CREATE OR REPLACE TRIGGER trigger_create_pending_payments
AFTER INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.create_pending_payments();

CREATE OR REPLACE FUNCTION public.calculate_payments_delay()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual IS NOT NULL AND NEW.planned IS NOT NULL THEN
    NEW.delay := (NEW.actual::date - NEW.planned::date)::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_calculate_payments_delay
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.calculate_payments_delay();

-- for insert data to planned when enquiry create
INSERT INTO public.payments (
    enquiry_number,
    planned
)
SELECT
    e.enquiry_number,
    e.timestamp::date
FROM public.enquiries e
LEFT JOIN public.payments p
    ON p.enquiry_number = e.enquiry_number
WHERE p.enquiry_number IS NULL AND e.enquiry_number IS NOT NULL;




-- payment confirmation 
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
  CONSTRAINT payment_confirmations_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

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

