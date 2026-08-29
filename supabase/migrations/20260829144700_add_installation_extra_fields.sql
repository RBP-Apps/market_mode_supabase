-- Migration: Add individual columns to public.installations for data logger and certificate fields

ALTER TABLE public.installations
ADD COLUMN IF NOT EXISTS data_logger_type text NULL,
ADD COLUMN IF NOT EXISTS sim_number text NULL,
ADD COLUMN IF NOT EXISTS mobile_number text NULL,
ADD COLUMN IF NOT EXISTS data_plan text NULL,
ADD COLUMN IF NOT EXISTS repeated_certificate text NULL,
ADD COLUMN IF NOT EXISTS project_commissioning_certificate text NULL;
