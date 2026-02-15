-- =============================================
-- MASLOW EVENTS SYSTEM
-- Created: 2026-02-14
-- =============================================

-- =============================================
-- PART 1: CREATE EVENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location_id UUID REFERENCES locations(id),
  category TEXT NOT NULL,  -- 'cultural', 'childrens', 'dancing', 'learning', 'wellness', 'social', 'nightlife'
  tags TEXT[],  -- array for multiple tags
  image_url TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  price_credits INTEGER DEFAULT 0,  -- 0 = free for members
  external_link TEXT,
  host_name TEXT,
  host_bio TEXT,
  status TEXT DEFAULT 'upcoming',  -- 'upcoming', 'happening_now', 'past', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- =============================================
-- PART 2: CREATE EVENT ATTENDEES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rsvp_status TEXT DEFAULT 'going',  -- 'going', 'interested', 'not_going'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);

-- =============================================
-- PART 3: ADD USER EVENT PREFERENCES TO PROFILES
-- =============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interested_categories TEXT[] DEFAULT '{}';

-- =============================================
-- PART 4: ROW LEVEL SECURITY
-- =============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Events are readable by all authenticated users
CREATE POLICY "Events are viewable by authenticated users"
ON events FOR SELECT
TO authenticated
USING (true);

-- Event attendees - users can view all attendees
CREATE POLICY "Event attendees are viewable by authenticated users"
ON event_attendees FOR SELECT
TO authenticated
USING (true);

-- Users can RSVP to events
CREATE POLICY "Users can create their own RSVPs"
ON event_attendees FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVPs
CREATE POLICY "Users can update their own RSVPs"
ON event_attendees FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete their own RSVPs"
ON event_attendees FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- PART 5: SEED MOCK EVENTS (20+ diverse events)
-- =============================================

-- Clear existing events (for development)
-- DELETE FROM event_attendees;
-- DELETE FROM events;

-- CULTURAL EVENTS (5 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'Brooklyn Poetry Night',
  'Join us for an evening of spoken word and poetry. Open mic format - bring your own work or just come to listen. Light refreshments provided.',
  '2026-02-20 19:00:00-05',
  '2026-02-20 21:30:00-05',
  'cultural',
  ARRAY['poetry', 'open-mic', 'arts', 'evening'],
  30,
  0,
  'Maya Johnson',
  'Local poet and workshop facilitator with 10+ years experience',
  'upcoming'
),
(
  'Gallery Opening: Local Artists',
  'Exclusive preview of emerging Brooklyn artists. Wine and cheese reception, meet the artists, and first opportunity to purchase works.',
  '2026-02-22 18:00:00-05',
  '2026-02-22 21:00:00-05',
  'cultural',
  ARRAY['art', 'gallery', 'networking', 'evening'],
  50,
  0,
  'Brooklyn Arts Collective',
  'Supporting local artists since 2015',
  'upcoming'
),
(
  'Jazz & Wine Evening',
  'Live jazz trio performance paired with curated wine selections. An intimate evening of music and conversation.',
  '2026-02-28 19:30:00-05',
  '2026-02-28 22:00:00-05',
  'cultural',
  ARRAY['jazz', 'music', 'wine', 'evening'],
  25,
  5,
  'The Brooklyn Trio',
  'Award-winning local jazz ensemble',
  'upcoming'
),
(
  'Film Screening: NYC Stories',
  'Independent short film showcase featuring stories from all five boroughs. Q&A with filmmakers after screening.',
  '2026-03-05 19:00:00-05',
  '2026-03-05 22:00:00-05',
  'cultural',
  ARRAY['film', 'indie', 'screening', 'evening'],
  40,
  0,
  'NYC Film Society',
  'Promoting independent cinema in New York',
  'upcoming'
),
(
  'Cultural Exchange Dinner',
  'Monthly potluck celebrating cuisines from around the world. This month: West African flavors. Bring a dish to share or just come hungry!',
  '2026-03-12 18:30:00-04',
  '2026-03-12 21:00:00-04',
  'cultural',
  ARRAY['food', 'culture', 'potluck', 'evening'],
  35,
  0,
  'Global Kitchen Collective',
  'Connecting communities through food',
  'upcoming'
);

-- CHILDREN'S EVENTS (4 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'Kids Art Workshop',
  'Creative painting and crafts for children ages 5-12. All materials provided. Parents welcome to stay or use Maslow facilities.',
  '2026-02-23 10:00:00-05',
  '2026-02-23 12:00:00-05',
  'childrens',
  ARRAY['kids', 'art', 'crafts', 'morning'],
  15,
  3,
  'Art with Amy',
  'Elementary art teacher and children''s art specialist',
  'upcoming'
),
(
  'Storytime & Snacks',
  'Interactive reading circle for kids ages 3-7. Picture books, songs, and healthy snacks. Perfect for Saturday morning!',
  '2026-03-01 10:30:00-05',
  '2026-03-01 11:30:00-05',
  'childrens',
  ARRAY['kids', 'reading', 'stories', 'morning'],
  12,
  0,
  'Miss Rachel',
  'Children''s librarian and early childhood educator',
  'upcoming'
),
(
  'Science Fun Day',
  'Hands-on science experiments for curious kids ages 6-10. Make slime, build volcanoes, and explore physics! Lab coats provided.',
  '2026-03-08 14:00:00-05',
  '2026-03-08 16:00:00-05',
  'childrens',
  ARRAY['kids', 'science', 'STEM', 'afternoon'],
  20,
  5,
  'Dr. Science Steve',
  'Science educator making learning fun for 15+ years',
  'upcoming'
),
(
  'Family Game Night',
  'Board games and activities for the whole family. Games for all ages, snacks provided. Come make new friends!',
  '2026-03-15 17:00:00-04',
  '2026-03-15 19:30:00-04',
  'childrens',
  ARRAY['family', 'games', 'evening', 'social'],
  30,
  0,
  'Maslow Community',
  'Family-friendly events for our members',
  'upcoming'
);

-- DANCING EVENTS (4 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'Salsa Night Basics',
  'Beginner salsa lesson followed by open dance floor. No partner needed - we rotate! All levels welcome.',
  '2026-02-21 19:00:00-05',
  '2026-02-21 21:30:00-05',
  'dancing',
  ARRAY['salsa', 'latin', 'beginner', 'evening'],
  24,
  3,
  'Carlos & Maria',
  'Professional Latin dance instructors',
  'upcoming'
),
(
  'Hip Hop Dance Class',
  'Urban dance workshop focusing on current trends and classic moves. Bring comfortable shoes and water!',
  '2026-02-25 18:30:00-05',
  '2026-02-25 20:00:00-05',
  'dancing',
  ARRAY['hip-hop', 'urban', 'fitness', 'evening'],
  20,
  5,
  'DJ Moves',
  'Professional dancer and choreographer from Brooklyn',
  'upcoming'
),
(
  'Swing Dance Social',
  'Learn the basics of swing dancing then practice at our social dance. Live music from local band!',
  '2026-03-07 19:00:00-05',
  '2026-03-07 22:00:00-05',
  'dancing',
  ARRAY['swing', 'vintage', 'live-music', 'evening'],
  40,
  0,
  'The Lindy Hoppers',
  'Keeping swing alive in NYC since 2010',
  'upcoming'
),
(
  'Movement & Meditation',
  'Expressive movement session combining free-form dance with mindfulness. No dance experience needed.',
  '2026-03-14 10:00:00-04',
  '2026-03-14 11:30:00-04',
  'dancing',
  ARRAY['movement', 'meditation', 'wellness', 'morning'],
  18,
  0,
  'Flow with Fiona',
  'Movement therapist and yoga instructor',
  'upcoming'
);

-- LEARNING EVENTS (5 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'Financial Literacy Workshop',
  'Learn budgeting basics, investment fundamentals, and practical money management. Bring your questions!',
  '2026-02-19 18:30:00-05',
  '2026-02-19 20:30:00-05',
  'learning',
  ARRAY['finance', 'workshop', 'practical', 'evening'],
  25,
  0,
  'Marcus Chen, CFP',
  'Certified Financial Planner helping millennials build wealth',
  'upcoming'
),
(
  'Career Development Panel',
  'Industry leaders share insights on career growth, job searching, and professional development. Networking to follow.',
  '2026-02-27 18:00:00-05',
  '2026-02-27 20:30:00-05',
  'learning',
  ARRAY['career', 'networking', 'professional', 'evening'],
  40,
  0,
  'Brooklyn Business Network',
  'Connecting professionals across industries',
  'upcoming'
),
(
  'Meditation 101',
  'Introduction to meditation and mindfulness. Learn techniques you can practice anywhere. Cushions provided.',
  '2026-03-02 09:00:00-05',
  '2026-03-02 10:30:00-05',
  'learning',
  ARRAY['meditation', 'mindfulness', 'beginner', 'morning'],
  15,
  0,
  'Zen Master Kim',
  '20+ years teaching meditation and mindfulness',
  'upcoming'
),
(
  'Public Speaking Workshop',
  'Overcome fear, build confidence, and learn practical techniques for engaging presentations. Small group format.',
  '2026-03-09 14:00:00-04',
  '2026-03-09 17:00:00-04',
  'learning',
  ARRAY['speaking', 'confidence', 'skills', 'afternoon'],
  12,
  5,
  'Voice Coach Victoria',
  'Former actor turned executive communication coach',
  'upcoming'
),
(
  'Tech Talk: AI in Daily Life',
  'Understand how AI affects your daily life and work. Hands-on demos, Q&A, no technical background needed.',
  '2026-03-16 16:00:00-04',
  '2026-03-16 18:00:00-04',
  'learning',
  ARRAY['tech', 'AI', 'education', 'afternoon'],
  30,
  0,
  'Dr. Sarah Tech',
  'AI researcher making complex topics accessible',
  'upcoming'
);

-- WELLNESS EVENTS (4 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'Morning Yoga Session',
  'Gentle vinyasa flow suitable for all levels. Start your day with movement and breath. Mats provided.',
  '2026-02-18 07:30:00-05',
  '2026-02-18 08:30:00-05',
  'wellness',
  ARRAY['yoga', 'morning', 'fitness', 'all-levels'],
  16,
  0,
  'Yoga with Yuki',
  'RYT-500 certified instructor specializing in accessible yoga',
  'upcoming'
),
(
  'Nutrition Q&A',
  'Ask our registered dietitian anything about nutrition, meal planning, and healthy eating habits.',
  '2026-02-26 12:30:00-05',
  '2026-02-26 13:30:00-05',
  'wellness',
  ARRAY['nutrition', 'health', 'lunch', 'Q&A'],
  20,
  0,
  'Dr. Lisa Nutrition',
  'Registered dietitian focused on sustainable eating',
  'upcoming'
),
(
  'Mental Health Check-In',
  'Facilitated support circle for sharing and connection. Confidential, judgment-free space. Professional counselor present.',
  '2026-03-04 18:00:00-05',
  '2026-03-04 19:30:00-05',
  'wellness',
  ARRAY['mental-health', 'support', 'community', 'evening'],
  12,
  0,
  'Healing Circle Collective',
  'Licensed therapists creating safe spaces',
  'upcoming'
),
(
  'Breathwork Workshop',
  'Learn powerful breathing techniques for stress relief, energy, and focus. Transform your state in minutes.',
  '2026-03-11 18:30:00-04',
  '2026-03-11 20:00:00-04',
  'wellness',
  ARRAY['breathwork', 'stress-relief', 'energy', 'evening'],
  18,
  3,
  'Breathe with Brandon',
  'Certified breathwork facilitator and wellness coach',
  'upcoming'
);

-- SOCIAL EVENTS (4 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'Members Mixer',
  'Monthly networking event for Maslow members. Drinks, appetizers, and great conversation. Make new friends!',
  '2026-02-24 18:30:00-05',
  '2026-02-24 20:30:00-05',
  'social',
  ARRAY['networking', 'drinks', 'community', 'evening'],
  50,
  0,
  'Maslow Community Team',
  'Building connections in our community',
  'upcoming'
),
(
  'Game Night',
  'Tabletop games, card games, and friendly competition. Games provided or bring your favorite!',
  '2026-03-03 19:00:00-05',
  '2026-03-03 22:00:00-05',
  'social',
  ARRAY['games', 'fun', 'social', 'evening'],
  30,
  0,
  'Brooklyn Board Gamers',
  'Bringing people together through play',
  'upcoming'
),
(
  'Book Club Meeting',
  'This month: "Tomorrow, and Tomorrow, and Tomorrow" by Gabrielle Zevin. Discussion and light refreshments.',
  '2026-03-10 19:00:00-04',
  '2026-03-10 20:30:00-04',
  'social',
  ARRAY['books', 'reading', 'discussion', 'evening'],
  15,
  0,
  'Maslow Readers',
  'Monthly book club for curious minds',
  'upcoming'
),
(
  'Coffee & Conversation',
  'Casual morning meetup for coffee and connection. No agenda, just good vibes and new friends.',
  '2026-03-13 09:30:00-04',
  '2026-03-13 11:00:00-04',
  'social',
  ARRAY['coffee', 'casual', 'morning', 'networking'],
  25,
  0,
  'Maslow Community',
  'Low-key community connections',
  'upcoming'
);

-- NIGHTLIFE EVENTS (3 events)
INSERT INTO events (title, description, event_date, end_date, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
(
  'DJ Night',
  'Local DJs spinning house, disco, and funk. Dance floor open, good vibes only. Cash bar available.',
  '2026-02-22 21:00:00-05',
  '2026-02-23 01:00:00-05',
  'nightlife',
  ARRAY['DJ', 'dancing', 'house', 'late-night'],
  75,
  5,
  'DJ Soundwave',
  'Brooklyn-based DJ bringing the heat',
  'upcoming'
),
(
  'Karaoke Social',
  'Sing your heart out! Private room vibes in a group setting. Song books and liquid courage available.',
  '2026-03-06 20:00:00-05',
  '2026-03-06 23:00:00-05',
  'nightlife',
  ARRAY['karaoke', 'singing', 'fun', 'evening'],
  35,
  0,
  'Maslow Entertainment',
  'Everyone''s a star at karaoke',
  'upcoming'
),
(
  'Late Night Comedy',
  'Stand-up comedy showcase featuring up-and-coming Brooklyn comedians. Warning: may contain adult humor.',
  '2026-03-14 21:30:00-04',
  '2026-03-14 23:30:00-04',
  'nightlife',
  ARRAY['comedy', 'stand-up', 'entertainment', 'late-night'],
  45,
  3,
  'Brooklyn Comedy Club',
  'Discovering tomorrow''s comedy stars',
  'upcoming'
);

-- =============================================
-- PART 6: HELPER FUNCTION TO UPDATE ATTENDEE COUNT
-- =============================================

CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET current_attendees = current_attendees + 1
    WHERE id = NEW.event_id AND NEW.rsvp_status = 'going';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET current_attendees = current_attendees - 1
    WHERE id = OLD.event_id AND OLD.rsvp_status = 'going';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.rsvp_status = 'going' AND NEW.rsvp_status != 'going' THEN
      UPDATE events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
    ELSIF OLD.rsvp_status != 'going' AND NEW.rsvp_status = 'going' THEN
      UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_attendee_count
AFTER INSERT OR UPDATE OR DELETE ON event_attendees
FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- =============================================
-- NOTES FOR EMAIL TARGETING
-- =============================================
-- To find users interested in dancing events:
-- SELECT * FROM profiles WHERE 'dancing' = ANY(interested_categories);
--
-- To find users interested in multiple categories:
-- SELECT * FROM profiles WHERE interested_categories && ARRAY['dancing', 'wellness'];
