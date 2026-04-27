-- Supabase Schema for KickOff - Football Ground Booking

-- 1. Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Referees table
CREATE TABLE referees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  experience TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Prevent double booking
  UNIQUE(date, time_slot)
);

-- 4. Ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.referees ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles: No RLS (queried by other tables' policies)
-- Users manage their own profiles via the app

-- Referees: Anyone can view, Admins full access
CREATE POLICY "Referees are viewable by everyone" ON referees FOR SELECT USING (true);
CREATE POLICY "Admins can insert referees" ON referees FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update referees" ON referees FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete referees" ON referees FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: Anyone can view (to check availability), Users can insert own, Admin full access
CREATE POLICY "Bookings are viewable by everyone" ON bookings FOR SELECT USING (true);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON bookings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bookings" ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Ratings: Anyone can view, Users can write own
CREATE POLICY "Ratings are viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON ratings FOR DELETE USING (auth.uid() = user_id);

-- Realtime: Enable for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
