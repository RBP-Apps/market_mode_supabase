-- Migration: Add IP Name, IP Mobile Number, and IP Aadhar Card Number columns to dispatch_planner table

ALTER TABLE public.dispatch_planner 
ADD COLUMN IF NOT EXISTS ip_name TEXT,
ADD COLUMN IF NOT EXISTS ip_mobile_number TEXT,
ADD COLUMN IF NOT EXISTS ip_aadhar_card_number TEXT;
