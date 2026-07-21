-- Step 1: Rename the old fms table to fms_old/fms_backup to avoid name collisions and preserve data
ALTER TABLE IF EXISTS public.fms RENAME TO fms_old;

-- Step 2: Create the enquiries table (parent table)
CREATE TABLE public.enquiries (
  id BIGSERIAL NOT NULL,
  timestamp TIMESTAMP WITHOUT TIME ZONE NULL,
  enquiry_number TEXT NULL UNIQUE,
  beneficiary_name TEXT NULL,
  beneficiary_number TEXT NULL,
  contact_number TEXT NULL,
  address TEXT NULL,
  village_block TEXT NULL,
  district TEXT NULL,
  present_load TEXT NULL,
  bp_number TEXT NULL,
  cspdcl_contract_demand TEXT NULL,
  avg_electricity_bill TEXT NULL,
  future_load_requirement TEXT NULL,
  load_details TEXT NULL,
  structure_type TEXT NULL,
  roof_type TEXT NULL,
  system_type TEXT NULL,
  need_type TEXT NULL,
  project_mode TEXT NULL,
  vendor_name TEXT NULL,
  assigned_by TEXT NULL,
  reference TEXT NULL,
  reference_no TEXT NULL,
  company_name TEXT NULL,
  stage TEXT NULL,
  CONSTRAINT enquiries_pkey PRIMARY KEY (id)
);

-- Step 3: Insert base enquiry data from fms_old into enquiries
INSERT INTO public.enquiries (
  id, timestamp, enquiry_number, beneficiary_name, beneficiary_number, contact_number, 
  address, village_block, district, present_load, bp_number, cspdcl_contract_demand, 
  avg_electricity_bill, future_load_requirement, load_details, failure_hours, 
  structure_type, roof_type, system_type, need_type, project_mode, vendor_name, 
  assigned_by, reference, reference_no, company_name, stage
)
SELECT 
  id, timestamp, enquiry_number, beneficiary_name, beneficiary_number, contact_number, 
  address, village_block, district, present_load, bp_number, cspdcl_contract_demand, 
  avg_electricity_bill, future_load_requirement, load_details, failure_hours, 
  structure_type, roof_type, system_type, need_type, project_mode, vendor_name, 
  assigned_by, reference, reference_no, company_name, stage
FROM public.fms_old;

-- Step 4: Create the site_surveys table (Stage 1)
CREATE TABLE public.site_surveys (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned DATE NULL,
  actual TIMESTAMP WITHOUT TIME ZONE NULL,
  delay TEXT NULL,
  status TEXT NULL,
  survey_report TEXT NULL,
  geotag_photo TEXT NULL,
  bill_copy TEXT NULL,
  aadhar_card TEXT NULL,
  pan_card TEXT NULL,
  address_proof TEXT NULL,
  surveyor_name TEXT NULL,
  surveyor_contact TEXT NULL,
  CONSTRAINT site_surveys_pkey PRIMARY KEY (id)
);

-- Insert data into site_surveys from fms_old
INSERT INTO public.site_surveys (
  enquiry_number, planned_1, actual_1, delay_1, status_1, survey_report, 
  geotag_photo, bill_copy, aadhar_card, pan_card, address_proof, 
  surveyor_name, surveyor_contact
)
SELECT 
  enquiry_number, planned_1, actual_1, delay_1, status_1, survey_report, 
  geotag_photo, bill_copy, aadhar_card, pan_card, address_proof, 
  surveyor_name, surveyor_contact
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 5: Create the sales_calls table (Stage 3)
CREATE TABLE public.sales_calls (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_3 DATE NULL,
  actual_3 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_3 TEXT NULL,
  customer_feedback TEXT NULL,
  next_call_date DATE NULL,
  CONSTRAINT sales_calls_pkey PRIMARY KEY (id)
);

-- Insert data into sales_calls from fms_old
INSERT INTO public.sales_calls (
  enquiry_number, planned_3, actual_3, delay_3, customer_feedback, next_call_date
)
SELECT 
  enquiry_number, planned_3, actual_3, delay_3, customer_feedback, next_call_date
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 6: Create the order_placements table (Stage 4)
CREATE TABLE public.order_placements (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_4 DATE NULL,
  actual_4 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_4 TEXT NULL,
  order_value NUMERIC NULL,
  module TEXT NULL,
  inverter TEXT NULL,
  bos TEXT NULL,
  acdb TEXT NULL,
  dcdb TEXT NULL,
  order_copy TEXT NULL,
  order_copy_1 TEXT NULL,
  order_copy_2 TEXT NULL,
  order_copy_3 TEXT NULL,
  CONSTRAINT order_placements_pkey PRIMARY KEY (id)
);

-- Insert data into order_placements from fms_old
INSERT INTO public.order_placements (
  enquiry_number, planned_4, actual_4, delay_4, order_value, module, inverter, bos, acdb, dcdb, 
  order_copy, order_copy_1, order_copy_2, order_copy_3
)
SELECT 
  enquiry_number, planned_4, actual_4, delay_4, order_value, module, inverter, bos, acdb, dcdb, 
  order_copy, order_copy_1, order_copy_2, order_copy_3
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 7: Create the ip_assignments table (Stage 5)
CREATE TABLE public.ip_assignments (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_5 DATE NULL,
  actual_5 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_5 TEXT NULL,
  ip_name TEXT NULL,
  ip_contact TEXT NULL,
  gst_number TEXT NULL,
  gst_certificate TEXT NULL,
  bank_details TEXT NULL,
  ip_aadhar TEXT NULL,
  ip_pan TEXT NULL,
  work_order_number TEXT NULL,
  CONSTRAINT ip_assignments_pkey PRIMARY KEY (id)
);

-- Insert data into ip_assignments from fms_old
INSERT INTO public.ip_assignments (
  enquiry_number, planned_5, actual_5, delay_5, ip_name, ip_contact, gst_number, gst_certificate, bank_details, ip_aadhar, ip_pan, work_order_number
)
SELECT 
  enquiry_number, planned_5, actual_5, delay_5, ip_name, ip_contact, gst_number, gst_certificate, bank_details, ip_aadhar, ip_pan, work_order_number
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 8: Create the dispatch_materials table (Stage 6)
CREATE TABLE public.dispatch_materials (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_6 DATE NULL,
  actual_6 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_6 TEXT NULL,
  status_6 TEXT NULL,
  CONSTRAINT dispatch_materials_pkey PRIMARY KEY (id)
);

-- Insert data into dispatch_materials from fms_old
INSERT INTO public.dispatch_materials (
  enquiry_number, planned_6, actual_6, delay_6, status_6
)
SELECT 
  enquiry_number, planned_6, actual_6, delay_6, status_6
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 9: Create the customer_notifications table (Stage 7)
CREATE TABLE public.customer_notifications (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_7 DATE NULL,
  actual_7 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_7 TEXT NULL,
  status_7 TEXT NULL,
  CONSTRAINT customer_notifications_pkey PRIMARY KEY (id)
);

-- Insert data into customer_notifications from fms_old
INSERT INTO public.customer_notifications (
  enquiry_number, planned_7, actual_7, delay_7, status_7
)
SELECT 
  enquiry_number, planned_7, actual_7, delay_7, status_7
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 10: Create the material_receipts table (Stage 8)
CREATE TABLE public.material_receipts (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_8 DATE NULL,
  actual_8 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_8 TEXT NULL,
  status_8 TEXT NULL,
  receipt_copy TEXT NULL,
  receipt_date DATE NULL,
  CONSTRAINT material_receipts_pkey PRIMARY KEY (id)
);

-- Insert data into material_receipts from fms_old
INSERT INTO public.material_receipts (
  enquiry_number, planned_8, actual_8, delay_8, status_8, receipt_copy, receipt_date
)
SELECT 
  enquiry_number, planned_8, actual_8, delay_8, status_8, receipt_copy, receipt_date
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 11: Create the installations table (Stage 9)
CREATE TABLE public.installations (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_9 DATE NULL,
  actual_9 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_9 TEXT NULL,
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

-- Insert data into installations from fms_old
INSERT INTO public.installations (
  enquiry_number, planned_9, actual_9, delay_9, installation_date, phase, earthing, base_foundation, wiring, plant_photo, dcr_certificate, module_warranty, installation_photo, inverter_make, inverter_capacity, module_make, module_capacity, module_type, structure_make, inverter_id
)
SELECT 
  enquiry_number, planned_9, actual_9, delay_9, installation_date, phase, earthing, base_foundation, wiring, plant_photo, dcr_certificate, module_warranty, installation_photo, inverter_make, inverter_capacity, module_make, module_capacity, module_type, structure_make, inverter_id
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 12: Create the qc_inspections table (Stage 10)
CREATE TABLE public.qc_inspections (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_10 DATE NULL,
  actual_10 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_10 TEXT NULL,
  deduction_10 NUMERIC NULL,
  CONSTRAINT qc_inspections_pkey PRIMARY KEY (id)
);

-- Insert data into qc_inspections from fms_old
INSERT INTO public.qc_inspections (
  enquiry_number, planned_10, actual_10, delay_10, deduction_10
)
SELECT 
  enquiry_number, planned_10, actual_10, delay_10, deduction_10
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 13: Create the ip_payments table (Stage 11)
CREATE TABLE public.ip_payments (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_11 DATE NULL,
  actual_11 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_11 TEXT NULL,
  ip_bill_number TEXT NULL,
  ip_copy TEXT NULL,
  CONSTRAINT ip_payments_pkey PRIMARY KEY (id)
);

-- Insert data into ip_payments from fms_old
INSERT INTO public.ip_payments (
  enquiry_number, planned_11, actual_11, delay_11, ip_bill_number, ip_copy
)
SELECT 
  enquiry_number, planned_11, actual_11, delay_11, ip_bill_number, ip_copy
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 14: Create the sync_documents table (Stage 12)
CREATE TABLE public.sync_documents (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_12 DATE NULL,
  actual_12 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_12 TEXT NULL,
  status_12 TEXT NULL,
  date_12 DATE NULL,
  remark_12 TEXT NULL,
  power_purchase_agreement TEXT NULL,
  vendor_consumer_agreement TEXT NULL,
  application_copy TEXT NULL,
  physibilty_report TEXT NULL,
  token_for_subsidy TEXT NULL,
  pan_card_doc TEXT NULL,
  aadhar_card_doc TEXT NULL,
  cancellation_cheque TEXT NULL,
  electricity_bill_doc TEXT NULL,
  witness_id_proof TEXT NULL,
  CONSTRAINT sync_documents_pkey PRIMARY KEY (id)
);

-- Insert data into sync_documents from fms_old
INSERT INTO public.sync_documents (
  enquiry_number, planned_12, actual_12, delay_12, status_12, date_12, remark_12, power_purchase_agreement, vendor_consumer_agreement, application_copy, physibilty_report, token_for_subsidy, pan_card_doc, aadhar_card_doc, cancellation_cheque, electricity_bill_doc, witness_id_proof
)
SELECT 
  enquiry_number, planned_12, actual_12, delay_12, status_12, date_12, remark_12, power_purchase_agreement, vendor_consumer_agreement, application_copy, physibilty_report, token_for_subsidy, pan_card_doc, aadhar_card_doc, cancellation_cheque, electricity_bill_doc, witness_id_proof
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 15: Create the project_synchronizations table (Stage 13)
CREATE TABLE public.project_synchronizations (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_13 DATE NULL,
  actual_13 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_13 TEXT NULL,
  status_13 TEXT NULL,
  date_13 DATE NULL,
  repeated_certificate TEXT NULL,
  commissioning_certificate TEXT NULL,
  CONSTRAINT project_synchronizations_pkey PRIMARY KEY (id)
);

-- Insert data into project_synchronizations from fms_old
INSERT INTO public.project_synchronizations (
  enquiry_number, planned_13, actual_13, delay_13, status_13, date_13, repeated_certificate, commissioning_certificate
)
SELECT 
  enquiry_number, planned_13, actual_13, delay_13, status_13, date_13, repeated_certificate, commissioning_certificate
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 16: Create the subsidy_redemptions table (Stage 14)
CREATE TABLE public.subsidy_redemptions (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_14 DATE NULL,
  actual_14 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_14 TEXT NULL,
  status_14 TEXT NULL,
  CONSTRAINT subsidy_redemptions_pkey PRIMARY KEY (id)
);

-- Insert data into subsidy_redemptions from fms_old
INSERT INTO public.subsidy_redemptions (
  enquiry_number, planned_14, actual_14, delay_14, status_14
)
SELECT 
  enquiry_number, planned_14, actual_14, delay_14, status_14
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 17: Create the subsidy_disbursals table (Stage 15)
CREATE TABLE public.subsidy_disbursals (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_15 DATE NULL,
  actual_15 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_15 TEXT NULL,
  status_15 TEXT NULL,
  central_subsidy NUMERIC NULL,
  state_subsidy NUMERIC NULL,
  CONSTRAINT subsidy_disbursals_pkey PRIMARY KEY (id)
);

-- Insert data into subsidy_disbursals from fms_old
INSERT INTO public.subsidy_disbursals (
  enquiry_number, planned_15, actual_15, delay_15, status_15, central_subsidy, state_subsidy
)
SELECT 
  enquiry_number, planned_15, actual_15, delay_15, status_15, central_subsidy, state_subsidy
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 18: Create the billings table (Stage 16)
CREATE TABLE public.billings (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_16 DATE NULL,
  actual_16 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_16 TEXT NULL,
  status_16 TEXT NULL,
  invoice_number TEXT NULL,
  invoice_amount NUMERIC NULL,
  invoice_copy TEXT NULL,
  payment_date DATE NULL,
  amount_received NUMERIC NULL,
  payment_reference TEXT NULL,
  outstanding NUMERIC NULL,
  deduction_16 NUMERIC NULL,
  date_16 DATE NULL,
  amount_16 TEXT NULL,
  check_number TEXT NULL,
  tax_invoice TEXT NULL,
  invoice_date DATE NULL,
  CONSTRAINT billings_pkey PRIMARY KEY (id)
);

-- Insert data into billings from fms_old
INSERT INTO public.billings (
  enquiry_number, planned_16, actual_16, delay_16, status_16, invoice_number, invoice_amount, invoice_copy, payment_date, amount_received, payment_reference, outstanding, deduction_16, date_16, amount_16, check_number, tax_invoice, invoice_date
)
SELECT 
  enquiry_number, planned_16, actual_16, delay_16, status_16, invoice_number, invoice_amount, invoice_copy, payment_date, amount_received, payment_reference, outstanding, deduction_16, date_16, amount_16, check_number, tax_invoice, invoice_date
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 19: Create the project_insurance table (Stage 17)
CREATE TABLE public.project_insurance (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_17 DATE NULL,
  actual_17 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_17 TEXT NULL,
  status_17 TEXT NULL,
  premium_amount NUMERIC NULL,
  policy_number TEXT NULL,
  policy_date DATE NULL,
  policy_period TEXT NULL,
  aadhar_card_insurance TEXT NULL,
  address_proof_insurance TEXT NULL,
  commission TEXT NULL,
  certificate TEXT NULL,
  CONSTRAINT project_insurance_pkey PRIMARY KEY (id)
);

-- Insert data into project_insurance from fms_old
INSERT INTO public.project_insurance (
  enquiry_number, planned_17, actual_17, delay_17, status_17, premium_amount, policy_number, policy_date, policy_period, aadhar_card_insurance, address_proof_insurance, commission, certificate
)
SELECT 
  enquiry_number, planned_17, actual_17, delay_17, status_17, premium_amount, policy_number, policy_date, policy_period, aadhar_card_insurance, address_proof_insurance, commission, certificate
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;

-- Step 20: Create the telecom_loggers table (Stage 18)
CREATE TABLE public.telecom_loggers (
  id BIGSERIAL NOT NULL,
  enquiry_number TEXT UNIQUE REFERENCES public.enquiries(enquiry_number) ON DELETE CASCADE,
  planned_18 DATE NULL,
  actual_18 TIMESTAMP WITHOUT TIME ZONE NULL,
  delay_18 TEXT NULL,
  status_18 TEXT NULL,
  data_logger_type TEXT NULL,
  sim_number TEXT NULL,
  mobile_number TEXT NULL,
  data_plan TEXT NULL,
  CONSTRAINT telecom_loggers_pkey PRIMARY KEY (id)
);

-- Insert data into telecom_loggers from fms_old
INSERT INTO public.telecom_loggers (
  enquiry_number, planned_18, actual_18, delay_18, status_18, data_logger_type, sim_number, mobile_number, data_plan
)
SELECT 
  enquiry_number, planned_18, actual_18, delay_18, status_18, data_logger_type, sim_number, mobile_number, data_plan
FROM public.fms_old
WHERE enquiry_number IS NOT NULL;
