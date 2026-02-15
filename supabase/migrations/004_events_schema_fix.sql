-- =============================================
-- MASLOW EVENTS SCHEMA FIX
-- Created: 2026-02-14
-- Fixes schema mismatches between code and database
-- =============================================

-- =============================================
-- FIX 1: Ensure 'status' column exists on events
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'status'
  ) THEN
    ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'upcoming';
    RAISE NOTICE 'Added status column to events table';
  ELSE
    RAISE NOTICE 'status column already exists';
  END IF;
END $$;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- =============================================
-- FIX 2: Handle event_rsvps -> event_attendees rename
-- =============================================
DO $$
BEGIN
  -- Check if event_rsvps exists and event_attendees doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_rsvps'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_attendees'
  ) THEN
    ALTER TABLE event_rsvps RENAME TO event_attendees;
    RAISE NOTICE 'Renamed event_rsvps to event_attendees';
  ELSE
    RAISE NOTICE 'event_attendees table already exists or event_rsvps does not exist';
  END IF;
END $$;

-- =============================================
-- FIX 3: Create event_attendees if neither exists
-- =============================================
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rsvp_status TEXT DEFAULT 'confirmed',  -- 'confirmed', 'waitlisted', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(rsvp_status);

-- =============================================
-- FIX 4: Migrate 'going' status to 'confirmed'
-- (The code uses 'confirmed', migration used 'going')
-- =============================================
UPDATE event_attendees
SET rsvp_status = 'confirmed'
WHERE rsvp_status = 'going';

UPDATE event_attendees
SET rsvp_status = 'cancelled'
WHERE rsvp_status = 'not_going';

-- =============================================
-- FIX 5: Ensure all events columns exist
-- =============================================
DO $$
BEGIN
  -- Add category column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'category') THEN
    ALTER TABLE events ADD COLUMN category TEXT;
    RAISE NOTICE 'Added category column';
  END IF;

  -- Add tags column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'tags') THEN
    ALTER TABLE events ADD COLUMN tags TEXT[];
    RAISE NOTICE 'Added tags column';
  END IF;

  -- Add image_url column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
    RAISE NOTICE 'Added image_url column';
  END IF;

  -- Add max_attendees column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'max_attendees') THEN
    ALTER TABLE events ADD COLUMN max_attendees INTEGER;
    RAISE NOTICE 'Added max_attendees column';
  END IF;

  -- Add current_attendees column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'current_attendees') THEN
    ALTER TABLE events ADD COLUMN current_attendees INTEGER DEFAULT 0;
    RAISE NOTICE 'Added current_attendees column';
  END IF;

  -- Add price_credits column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'price_credits') THEN
    ALTER TABLE events ADD COLUMN price_credits INTEGER DEFAULT 0;
    RAISE NOTICE 'Added price_credits column';
  END IF;

  -- Add host_name column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'host_name') THEN
    ALTER TABLE events ADD COLUMN host_name TEXT;
    RAISE NOTICE 'Added host_name column';
  END IF;

  -- Add host_bio column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'host_bio') THEN
    ALTER TABLE events ADD COLUMN host_bio TEXT;
    RAISE NOTICE 'Added host_bio column';
  END IF;

  -- Add external_link column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'external_link') THEN
    ALTER TABLE events ADD COLUMN external_link TEXT;
    RAISE NOTICE 'Added external_link column';
  END IF;

  -- Add location column if missing (for text-based location)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location') THEN
    ALTER TABLE events ADD COLUMN location TEXT;
    RAISE NOTICE 'Added location column';
  END IF;
END $$;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- =============================================
-- FIX 6: Ensure RLS policies exist
-- =============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON events;
DROP POLICY IF EXISTS "Event attendees are viewable by authenticated users" ON event_attendees;
DROP POLICY IF EXISTS "Users can create their own RSVPs" ON event_attendees;
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON event_attendees;
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON event_attendees;

-- Recreate policies
CREATE POLICY "Events are viewable by authenticated users"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Event attendees are viewable by authenticated users"
ON event_attendees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own RSVPs"
ON event_attendees FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
ON event_attendees FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
ON event_attendees FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- FIX 7: Update trigger to use 'confirmed' status
-- =============================================
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.rsvp_status = 'confirmed' THEN
      UPDATE events
      SET current_attendees = current_attendees + 1
      WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.rsvp_status = 'confirmed' THEN
      UPDATE events
      SET current_attendees = current_attendees - 1
      WHERE id = OLD.event_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.rsvp_status = 'confirmed' AND NEW.rsvp_status != 'confirmed' THEN
      UPDATE events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
    ELSIF OLD.rsvp_status != 'confirmed' AND NEW.rsvp_status = 'confirmed' THEN
      UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_event_attendee_count ON event_attendees;

CREATE TRIGGER trigger_update_event_attendee_count
AFTER INSERT OR UPDATE OR DELETE ON event_attendees
FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- =============================================
-- FIX 8: Add interested_categories to profiles
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'interested_categories'
  ) THEN
    ALTER TABLE profiles ADD COLUMN interested_categories TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added interested_categories column to profiles';
  END IF;
END $$;

-- =============================================
-- VERIFICATION QUERY (run manually to check)
-- =============================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- ORDER BY ordinal_position;
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'event_attendees'
-- ORDER BY ordinal_position;
