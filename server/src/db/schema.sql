-- Car Service Reminder System - PostgreSQL Schema

DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReminderType" AS ENUM ('SERVICE', 'INSURANCE', 'PUC', 'WARRANTY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReminderChannel" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP', 'IN_APP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users table (RBAC: ADMIN, RECEPTIONIST)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role "Role" NOT NULL DEFAULT 'RECEPTIONIST',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reg_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    purchase_date TIMESTAMP(3),
    insurance_expiry TIMESTAMP(3),
    puc_expiry TIMESTAMP(3),
    warranty_expiry TIMESTAMP(3),
    service_interval_days INTEGER NOT NULL DEFAULT 180,
    last_service_date TIMESTAMP(3),
    next_service_date TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Service History table
CREATE TABLE IF NOT EXISTS service_history (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    service_date TIMESTAMP(3) NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type "ReminderType" NOT NULL,
    due_date TIMESTAMP(3) NOT NULL,
    lead_days INTEGER NOT NULL DEFAULT 0,
    channel "ReminderChannel" NOT NULL,
    status "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP(3),
    error_message TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO services (name)
SELECT 'General service'
WHERE NOT EXISTS (SELECT 1 FROM services)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    booking_date TIMESTAMP(3) NOT NULL,
    slot_start TEXT NOT NULL,
    slot_end TEXT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'General service',
    status "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    booking_code VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);
ALTER TABLE bookings ALTER COLUMN service_type SET DEFAULT 'General service';

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    paid_at TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Slot Config table
CREATE TABLE IF NOT EXISTS slot_config (
    id SERIAL PRIMARY KEY,
    working_hours_start VARCHAR(5) NOT NULL DEFAULT '09:00',
    working_hours_end VARCHAR(5) NOT NULL DEFAULT '18:00',
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    max_bookings_per_slot INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Remove the retired mechanic and job-card workflow while preserving invoices
-- that were already attached to a booking.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
DO $$
BEGIN
    IF to_regclass('public.job_cards') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'job_card_id'
       ) THEN
        UPDATE invoices inv
        SET booking_id = COALESCE(inv.booking_id, jc.booking_id),
            vehicle_id = jc.vehicle_id,
            customer_id = v.customer_id
        FROM job_cards jc
        JOIN vehicles v ON v.id = jc.vehicle_id
        WHERE inv.job_card_id = jc.id;
    END IF;
END $$;
ALTER TABLE invoices DROP COLUMN IF EXISTS job_card_id;
DROP TABLE IF EXISTS job_cards CASCADE;
ALTER TABLE service_history DROP COLUMN IF EXISTS mechanic_id;

DO $$
DECLARE role_type TEXT;
BEGIN
    SELECT udt_name INTO role_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role';

    IF role_type = 'Role' THEN
        IF EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'Role' AND e.enumlabel = 'STAFF'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'Role' AND e.enumlabel = 'RECEPTIONIST'
        ) THEN
            ALTER TYPE "Role" RENAME VALUE 'STAFF' TO 'RECEPTIONIST';
        END IF;
    ELSE
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        UPDATE users SET role = 'RECEPTIONIST', is_active = false WHERE role IN ('MECHANIC', 'STAFF');
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'RECEPTIONIST'));
    END IF;
END $$;

-- Indexes for performance & quick lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_number ON vehicles (reg_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_next_service ON vehicles (next_service_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_insurance ON vehicles (insurance_expiry);
CREATE INDEX IF NOT EXISTS idx_vehicles_puc ON vehicles (puc_expiry);
CREATE INDEX IF NOT EXISTS idx_vehicles_warranty ON vehicles (warranty_expiry);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_reminders_dedup ON reminders (vehicle_id, type, due_date, lead_days);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_booking_unique ON invoices (booking_id) WHERE booking_id IS NOT NULL;
