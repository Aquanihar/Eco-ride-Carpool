-- ====================================================================
-- RAAHI CARPOOL - SUPABASE POSTGRESQL SCHEMA & POLICIES
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Rides Table
CREATE TABLE IF NOT EXISTS public.rides (
    id TEXT PRIMARY KEY,
    driver JSONB NOT NULL,
    "from" JSONB NOT NULL,
    "to" JSONB NOT NULL,
    waypoints JSONB DEFAULT '[]'::jsonb,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    seats INTEGER NOT NULL,
    "seatsAvailable" INTEGER NOT NULL,
    price INTEGER NOT NULL,
    vehicle JSONB,
    preferences JSONB DEFAULT '[]'::jsonb,
    recurring BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'PUBLISHED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and public access for demo/testing
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on rides" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rides" ON public.rides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rides" ON public.rides FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on rides" ON public.rides FOR DELETE USING (true);

-- 3. Ride Requests Table
CREATE TABLE IF NOT EXISTS public.ride_requests (
    id TEXT PRIMARY KEY,
    ride_id TEXT REFERENCES public.rides(id) ON DELETE CASCADE,
    passenger_id TEXT NOT NULL,
    passenger_name TEXT NOT NULL,
    passenger_rating NUMERIC(3, 2) DEFAULT 5.0,
    seats_requested INTEGER DEFAULT 1,
    pickup_location TEXT,
    pickup_latitude NUMERIC,
    pickup_longitude NUMERIC,
    drop_location TEXT,
    drop_latitude NUMERIC,
    drop_longitude NUMERIC,
    message TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on ride_requests" ON public.ride_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ride_requests" ON public.ride_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on ride_requests" ON public.ride_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on ride_requests" ON public.ride_requests FOR DELETE USING (true);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    ride_id TEXT REFERENCES public.rides(id) ON DELETE CASCADE,
    passenger_id TEXT NOT NULL,
    ride_request_id TEXT,
    seats_booked INTEGER DEFAULT 1,
    total_amount NUMERIC(10, 2) DEFAULT 0.0,
    status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bookings" ON public.bookings FOR UPDATE USING (true);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_ride_id TEXT,
    related_request_id TEXT,
    related_booking_id TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on notifications" ON public.notifications FOR UPDATE USING (true);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_date ON public.rides(date);
CREATE INDEX IF NOT EXISTS idx_requests_ride_id ON public.ride_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON public.bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
