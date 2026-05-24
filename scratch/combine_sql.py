import os
import re

def combine_and_rename_sql():
    backend_dir = r"d:\Student LMS\backend"
    output_path = os.path.join(backend_dir, "supabase_combined_setup.sql")
    
    # 1. Collect all SQL files starting with numbers (01_ through 71_)
    sql_files = []
    for file_name in os.listdir(backend_dir):
        if file_name.endswith(".sql") and file_name[:2].isdigit():
            # Parse prefix number
            num = int(file_name[:2])
            if 1 <= num <= 71 and num != 19: # Exclude phone column migration
                sql_files.append((num, file_name))
                
    # Sort files by their numeric prefix
    sql_files.sort(key=lambda x: x[0])
    
    print(f"Found {len(sql_files)} migration files to combine.")
    
    combined_content = []
    combined_content.append("-- =====================================================\n")
    combined_content.append("-- Student LMS - Complete Database Setup\n")
    combined_content.append("-- Combined on: 2026-05-24\n")
    combined_content.append("-- This file contains the complete consolidated database setup for Student LMS.\n")
    combined_content.append("-- Run this in the Supabase SQL Editor to initialize all tables, roles, and RLS policies.\n")
    combined_content.append("-- =====================================================\n\n")
    
    for num, file_name in sql_files:
        file_path = os.path.join(backend_dir, file_name)
        print(f"Processing: {file_name}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        combined_content.append(f"-- =====================================================\n")
        combined_content.append(f"-- MIGRATION: {file_name}\n")
        combined_content.append(f"-- =====================================================\n\n")
        combined_content.append(content)
        combined_content.append("\n\n")
        
    # 2. Append Step 72: Subject Payments and Gatekeeping Access
    gatekeeping_sql = """
-- =====================================================
-- 72. ADD SUBJECT PAYMENTS & GATEKEEPING ACCESS
-- =====================================================

-- Create subject payments table to track student payments for subjects via Razorpay
CREATE TABLE IF NOT EXISTS subject_payments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL, -- Razorpay Payment ID
  order_id TEXT, -- Razorpay Order ID
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- Enable Row Level Security (RLS) on subject_payments
ALTER TABLE subject_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments, admin and faculty can view all payments
CREATE POLICY "subject_payments_select"
  ON subject_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_faculty_or_admin());

-- Policy: Authenticated users (students) can insert their own payment records after successful Razorpay checkout
CREATE POLICY "subject_payments_insert"
  ON subject_payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop old has_subject_access function
DROP FUNCTION IF EXISTS has_subject_access(BIGINT) CASCADE;

-- Re-create has_subject_access function to include payment checks
CREATE OR REPLACE FUNCTION has_subject_access(subject_id_param BIGINT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Admin and faculty have access to all approved subjects
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'faculty')
  ) OR EXISTS (
    -- Creator has access to their own subjects
    SELECT 1 FROM subjects 
    WHERE id = subject_id_param 
    AND created_by = auth.uid()
  ) OR EXISTS (
    -- Students have access if course is assigned to them
    SELECT 1 FROM course_assignments 
    WHERE user_id = auth.uid() 
    AND subject_id = subject_id_param 
    AND status = 'active'
  ) OR EXISTS (
    -- Students have access if they paid for it
    SELECT 1 FROM subject_payments 
    WHERE user_id = auth.uid() 
    AND subject_id = subject_id_param 
    AND status = 'completed'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION has_subject_access(BIGINT) TO authenticated;
"""
    combined_content.append(f"-- =====================================================\n")
    combined_content.append(f"-- STEP 72: SUBJECT PAYMENTS & GATEKEEPING ACCESS\n")
    combined_content.append(f"-- =====================================================\n")
    combined_content.append(gatekeeping_sql)
    
    full_sql_text = "".join(combined_content)
    
    # 3. Apply Tenspick -> Student replacements
    # Case insensitive replacement or direct case-preserving replacement
    # TenspickLMS -> StudentLMS
    # Tenspick LMS -> Student LMS
    # tenspick -> student
    # Tenspick -> Student
    
    replacements = [
        (re.compile(r"TenspickLMS", re.IGNORECASE), "StudentLMS"),
        (re.compile(r"Tenspick", re.IGNORECASE), "Student"),
        (re.compile(r"tenspick", re.IGNORECASE), "student")
    ]
    
    for pattern, repl in replacements:
        full_sql_text = pattern.sub(repl, full_sql_text)
        
    # Write consolidated file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_sql_text)
        
    print(f"Successfully consolidated SQL migrations into: {output_path}")

if __name__ == "__main__":
    combine_and_rename_sql()
