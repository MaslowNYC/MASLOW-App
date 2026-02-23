-- Accessibility and Language Settings Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- ADD COLUMNS TO PROFILES TABLE
-- ============================================

-- Preferred language (ISO 639-1 code)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Accessibility settings (JSONB)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{
  "reduce_animations": false,
  "no_haptics": false,
  "high_contrast": false,
  "larger_text": false,
  "screen_reader": false
}'::jsonb;

-- Track if user has completed accessibility onboarding
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accessibility_onboarded BOOLEAN DEFAULT false;

-- ============================================
-- CREATE INDEX FOR LANGUAGE LOOKUPS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language
ON profiles(preferred_language);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN profiles.preferred_language IS 'ISO 639-1 language code (en, es, fr, de, it, pt, zh, ja, ko, ar, ru, hi, he)';
COMMENT ON COLUMN profiles.accessibility_settings IS 'JSON object with accessibility preferences: reduce_animations, no_haptics, high_contrast, larger_text, screen_reader';
COMMENT ON COLUMN profiles.accessibility_onboarded IS 'Whether user has completed the accessibility questionnaire';

-- ============================================
-- SAMPLE UPDATE (for testing)
-- ============================================
-- UPDATE profiles
-- SET accessibility_settings = '{
--   "reduce_animations": true,
--   "no_haptics": false,
--   "high_contrast": false,
--   "larger_text": true,
--   "screen_reader": false
-- }'::jsonb
-- WHERE id = 'your-user-id';
