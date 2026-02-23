-- Maslow AI Concierge Database Schema
-- Run this migration in Supabase SQL Editor

-- ============================================
-- CONCIERGE USAGE TABLE (Rate Limiting per User)
-- ============================================
CREATE TABLE IF NOT EXISTS concierge_usage (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_count_today INTEGER DEFAULT 0,
  hour_count INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_hour_reset TIMESTAMPTZ DEFAULT NOW(),
  total_cost NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_concierge_usage_reset_date ON concierge_usage(last_reset_date);

-- Enable RLS
ALTER TABLE concierge_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own usage
CREATE POLICY "Users can read own usage"
  ON concierge_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON concierge_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON concierge_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CONCIERGE BUDGET TABLE (Global Cost Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS concierge_budget (
  id SERIAL PRIMARY KEY,
  month TEXT NOT NULL UNIQUE, -- Format: "2026-02"
  total_cost NUMERIC(10, 4) DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for month lookups
CREATE INDEX IF NOT EXISTS idx_concierge_budget_month ON concierge_budget(month);

-- Enable RLS (only service role can update, users can read)
ALTER TABLE concierge_budget ENABLE ROW LEVEL SECURITY;

-- Everyone can read budget status
CREATE POLICY "Anyone can read budget"
  ON concierge_budget FOR SELECT
  USING (true);

-- Only service role can modify (handled by Edge Function)
-- No INSERT/UPDATE policies for regular users

-- ============================================
-- CONCIERGE CHATS TABLE (Conversation Storage)
-- ============================================
CREATE TABLE IF NOT EXISTS concierge_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concierge_chats_user_id ON concierge_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_chats_created_at ON concierge_chats(created_at DESC);

-- Enable RLS
ALTER TABLE concierge_chats ENABLE ROW LEVEL SECURITY;

-- Users can only access their own chats
CREATE POLICY "Users can read own chats"
  ON concierge_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
  ON concierge_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON concierge_chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON concierge_chats FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CONCIERGE KNOWLEDGE BASE
-- ============================================
CREATE TABLE IF NOT EXISTS concierge_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'maslow_company', 'abraham_maslow', 'nyc_history', 'nyc_current'
  title TEXT,
  content TEXT NOT NULL,
  source TEXT, -- Citation source
  tags TEXT[], -- For search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_concierge_knowledge_content
  ON concierge_knowledge USING gin(to_tsvector('english', content));

-- Category index
CREATE INDEX IF NOT EXISTS idx_concierge_knowledge_category
  ON concierge_knowledge(category);

-- Enable RLS
ALTER TABLE concierge_knowledge ENABLE ROW LEVEL SECURITY;

-- Everyone can read knowledge base
CREATE POLICY "Anyone can read knowledge"
  ON concierge_knowledge FOR SELECT
  USING (true);

-- ============================================
-- SEED INITIAL KNOWLEDGE BASE DATA
-- ============================================
INSERT INTO concierge_knowledge (category, title, content, source) VALUES
-- Maslow Company
('maslow_company', 'About Maslow', 'Maslow is a luxury wellness company offering private suites in New York City for personal care, grooming, and self-renewal. Named after psychologist Abraham Maslow, the company embodies the philosophy that self-care is foundational to achieving one''s full potential.', 'Maslow Official'),

('maslow_company', 'Maslow Membership', 'Maslow members purchase credits through the app to book private suites. Credits can be used for various session lengths. Members enjoy exclusive access to premium amenities and a peaceful environment for self-care.', 'Maslow Official'),

('maslow_company', 'Maslow Locations', 'Maslow currently operates luxury suite locations in Manhattan, including SoHo. Each location features private suites equipped with premium amenities for grooming, relaxation, and personal care.', 'Maslow Official'),

('maslow_company', 'Booking a Suite', 'To book a Maslow suite: 1) Open the Maslow app, 2) Select a location, 3) Choose your preferred date and time, 4) Select a suite and duration, 5) Confirm using your credits. Suites are available 7 days a week.', 'Maslow Official'),

-- Abraham Maslow
('abraham_maslow', 'Abraham Maslow Biography', 'Abraham Harold Maslow (1908-1970) was an American psychologist best known for creating Maslow''s hierarchy of needs, a theory of psychological health predicated on fulfilling innate human needs in priority, culminating in self-actualization.', 'American Psychological Association'),

('abraham_maslow', 'Hierarchy of Needs', 'Maslow''s hierarchy of needs is often portrayed as a pyramid: physiological needs (food, water, rest) at the base, followed by safety needs, love and belonging, esteem, and self-actualization at the peak. Maslow proposed that people are motivated to fulfill basic needs before moving on to higher-level needs.', 'Motivation and Personality, 1954'),

('abraham_maslow', 'Self-Actualization', 'Self-actualization, in Maslow''s psychology, represents the fulfillment of one''s greatest potential. Maslow described self-actualizing people as those who were fulfilled and doing all they were capable of. He believed that all humans have the need to make the most of their abilities and to strive to be the best they can.', 'Toward a Psychology of Being, 1962'),

-- NYC Info
('nyc_history', 'SoHo Neighborhood', 'SoHo (South of Houston Street) is a neighborhood in Lower Manhattan known for its cast-iron architecture, art galleries, and upscale boutiques. Originally an industrial area, it transformed into an artist colony in the 1960s and 70s before becoming the fashionable shopping district it is today.', 'NYC Landmarks Preservation Commission'),

('nyc_current', 'NYC Dining Scene', 'New York City is home to over 27,000 restaurants representing virtually every cuisine in the world. For trusted restaurant recommendations, consult The New York Times dining section, Eater NY, Time Out New York, The Infatuation, and the Michelin Guide.', 'NYC Tourism Board')

ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all concierge tables
DROP TRIGGER IF EXISTS update_concierge_usage_updated_at ON concierge_usage;
CREATE TRIGGER update_concierge_usage_updated_at
  BEFORE UPDATE ON concierge_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_concierge_budget_updated_at ON concierge_budget;
CREATE TRIGGER update_concierge_budget_updated_at
  BEFORE UPDATE ON concierge_budget
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_concierge_chats_updated_at ON concierge_chats;
CREATE TRIGGER update_concierge_chats_updated_at
  BEFORE UPDATE ON concierge_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_concierge_knowledge_updated_at ON concierge_knowledge;
CREATE TRIGGER update_concierge_knowledge_updated_at
  BEFORE UPDATE ON concierge_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- ============================================
-- Service role needs full access to budget table
GRANT ALL ON concierge_budget TO service_role;
GRANT USAGE, SELECT ON SEQUENCE concierge_budget_id_seq TO service_role;
