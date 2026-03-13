-- Hotel Management System Database Schema
-- PostgreSQL

CREATE DATABASE hotel_management;
\c hotel_management;

-- ================================
-- ENUMS
-- ================================
CREATE TYPE user_role AS ENUM ('admin', 'receptionist', 'housekeeping', 'manager');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'reserved', 'cleaning', 'maintenance');
CREATE TYPE room_type AS ENUM ('single', 'double', 'suite', 'deluxe', 'penthouse');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
CREATE TYPE cleaning_state AS ENUM ('dirty', 'in_progress', 'clean');

-- ================================
-- USERS (Staff)
-- ================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'receptionist',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- ROOM TYPES
-- ================================
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    name room_type NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    max_occupancy INT NOT NULL DEFAULT 2,
    amenities JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- ROOMS
-- ================================
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    floor INT NOT NULL,
    room_type_id INT REFERENCES room_types(id),
    status room_status DEFAULT 'available',
    price_per_night NUMERIC(10,2) NOT NULL,
    amenities JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- GUESTS
-- ================================
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    nationality VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- RESERVATIONS
-- ================================
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    guest_id INT REFERENCES guests(id) ON DELETE SET NULL,
    room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    actual_check_in TIMESTAMP,
    actual_check_out TIMESTAMP,
    num_guests INT DEFAULT 1,
    status booking_status DEFAULT 'pending',
    special_requests TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- ================================
-- INVOICES
-- ================================
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    reservation_id INT REFERENCES reservations(id),
    guest_id INT REFERENCES guests(id),
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0.10,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) DEFAULT 0,
    status payment_status DEFAULT 'pending',
    notes TEXT,
    issued_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- INVOICE ITEMS
-- ================================
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- PAYMENTS
-- ================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id),
    amount NUMERIC(10,2) NOT NULL,
    method payment_method NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    processed_by INT REFERENCES users(id),
    paid_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- HOUSEKEEPING TASKS
-- ================================
CREATE TABLE housekeeping_tasks (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id),
    assigned_to INT REFERENCES users(id),
    cleaning_state cleaning_state DEFAULT 'dirty',
    priority INT DEFAULT 1,
    notes TEXT,
    reported_issue TEXT,
    scheduled_date DATE DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- INDEXES
-- ================================
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_guests_name ON guests(last_name, first_name);
CREATE INDEX idx_housekeeping_room ON housekeeping_tasks(room_id);

-- ================================
-- SEED: Default Users
-- Run `node database/seed.js` after this script to insert users with
-- properly hashed passwords. Do NOT add raw hashes here manually.
-- ================================

-- SEED: Room Types
INSERT INTO room_types (name, description, base_price, max_occupancy, amenities) VALUES
('single', 'Cozy single room', 80.00, 1, '["WiFi", "TV", "AC"]'),
('double', 'Comfortable double room', 120.00, 2, '["WiFi", "TV", "AC", "Mini-bar"]'),
('suite', 'Luxurious suite', 250.00, 3, '["WiFi", "TV", "AC", "Mini-bar", "Jacuzzi", "Lounge"]'),
('deluxe', 'Deluxe room with city view', 180.00, 2, '["WiFi", "TV", "AC", "Mini-bar", "City View"]'),
('penthouse', 'Top floor penthouse', 500.00, 4, '["WiFi", "TV", "AC", "Mini-bar", "Jacuzzi", "Private Terrace", "Butler Service"]');

-- SEED: Sample Rooms
INSERT INTO rooms (room_number, floor, room_type_id, price_per_night) VALUES
('101', 1, 1, 80.00), ('102', 1, 1, 80.00), ('103', 1, 2, 120.00),
('201', 2, 2, 120.00), ('202', 2, 4, 180.00), ('203', 2, 4, 180.00),
('301', 3, 3, 250.00), ('302', 3, 3, 250.00),
('401', 4, 5, 500.00);
