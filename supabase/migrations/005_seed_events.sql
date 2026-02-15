-- =============================================
-- MASLOW EVENTS SEED DATA
-- Created: 2026-02-14
-- Seeds 22 diverse mock events across all categories
-- =============================================

-- Clear existing events (optional - uncomment if needed)
-- DELETE FROM event_attendees;
-- DELETE FROM events;

-- CULTURAL EVENTS (4)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('Brooklyn Poetry Night', 'Open mic poetry reading featuring local poets. Share your work or just enjoy the performances.', '2026-02-20 19:00:00-05', '2026-02-20 21:00:00-05', '456 7th Ave, Brooklyn', 'cultural', ARRAY['poetry', 'arts', 'performance'], 30, 0, 'Sarah Chen', 'Local poet and event organizer', 'upcoming'),
('Gallery Opening: Local Artists', 'Celebrate Brooklyn artists with wine, music, and amazing artwork.', '2026-02-25 18:00:00-05', '2026-02-25 22:00:00-05', 'The Hull Gallery Space', 'cultural', ARRAY['art', 'gallery', 'wine'], 50, 5, 'Marcus Williams', 'Art curator and collector', 'upcoming'),
('Jazz & Wine Evening', 'Live jazz trio performance paired with curated wines.', '2026-03-01 20:00:00-05', '2026-03-01 23:00:00-05', 'The Hull Lounge', 'cultural', ARRAY['music', 'jazz', 'wine'], 40, 10, 'The Brooklyn Trio', 'Professional jazz ensemble', 'upcoming'),
('Film Screening: NYC Stories', 'Independent film about life in New York City, followed by Q&A with director.', '2026-03-05 19:30:00-05', '2026-03-05 22:00:00-05', 'The Hull Theater', 'cultural', ARRAY['film', 'cinema', 'discussion'], 35, 0, 'Lisa Rodriguez', 'Independent filmmaker', 'upcoming');

-- CHILDREN'S EVENTS (3)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('Kids Art Workshop', 'Painting and crafts for children ages 5-12. All materials provided!', '2026-02-22 14:00:00-05', '2026-02-22 16:00:00-05', 'The Hull Kids Corner', 'childrens', ARRAY['kids', 'art', 'creative'], 20, 0, 'Amy Park', 'Elementary art teacher', 'upcoming'),
('Storytime & Snacks', 'Interactive story reading for young children with healthy snacks.', '2026-02-28 11:00:00-05', '2026-02-28 12:00:00-05', 'The Hull Kids Corner', 'childrens', ARRAY['kids', 'reading', 'education'], 15, 0, 'Mr. James', 'Children''s librarian', 'upcoming'),
('Science Fun Day', 'Hands-on science experiments that kids will love! Ages 8-14.', '2026-03-08 13:00:00-05', '2026-03-08 15:00:00-05', 'The Hull Workshop', 'childrens', ARRAY['kids', 'science', 'education'], 25, 5, 'Dr. Emily Watson', 'Science educator', 'upcoming');

-- DANCING EVENTS (3)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('Salsa Night Basics', 'Learn basic salsa steps in this beginner-friendly class. No partner needed!', '2026-02-21 19:00:00-05', '2026-02-21 21:00:00-05', 'The Hull Dance Floor', 'dancing', ARRAY['salsa', 'latin', 'beginner'], 30, 5, 'Carlos & Maria', 'Professional salsa instructors', 'upcoming'),
('Hip Hop Dance Class', 'Urban dance workshop for all skill levels. Bring your energy!', '2026-02-26 18:30:00-05', '2026-02-26 20:00:00-05', 'The Hull Dance Floor', 'dancing', ARRAY['hiphop', 'urban', 'fitness'], 25, 5, 'DJ Smooth', 'Hip hop choreographer', 'upcoming'),
('Swing Dance Social', 'Partner dancing in the swing style. Beginners welcome, lesson included.', '2026-03-07 20:00:00-05', '2026-03-07 22:30:00-05', 'The Hull Dance Floor', 'dancing', ARRAY['swing', 'partner', 'vintage'], 40, 0, 'The Swing Crew', 'Swing dance collective', 'upcoming');

-- LEARNING EVENTS (4)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('Financial Literacy Workshop', 'Learn budgeting, saving, and investing basics. Q&A included.', '2026-02-24 18:00:00-05', '2026-02-24 20:00:00-05', 'The Hull Conference Room', 'learning', ARRAY['finance', 'education', 'career'], 35, 0, 'Michael Chang', 'Financial advisor', 'upcoming'),
('Career Development Panel', 'Hear from successful professionals about career growth and networking.', '2026-03-03 19:00:00-05', '2026-03-03 21:00:00-05', 'The Hull Conference Room', 'learning', ARRAY['career', 'networking', 'professional'], 50, 0, 'Various Speakers', 'Industry professionals', 'upcoming'),
('Meditation 101', 'Introduction to meditation and mindfulness practices for beginners.', '2026-02-27 18:30:00-05', '2026-02-27 19:30:00-05', 'The Hull Wellness Room', 'learning', ARRAY['meditation', 'wellness', 'mindfulness'], 20, 0, 'Zen Master Lee', 'Meditation instructor', 'upcoming'),
('Public Speaking Workshop', 'Overcome fear and improve your presentation skills.', '2026-03-10 18:00:00-05', '2026-03-10 20:30:00-05', 'The Hull Conference Room', 'learning', ARRAY['communication', 'skills', 'career'], 25, 10, 'Rebecca Stone', 'Communications coach', 'upcoming');

-- WELLNESS EVENTS (3)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('Morning Yoga Session', 'Gentle yoga class to start your day. All levels welcome.', '2026-02-23 08:00:00-05', '2026-02-23 09:00:00-05', 'The Hull Wellness Room', 'wellness', ARRAY['yoga', 'fitness', 'morning'], 30, 0, 'Yoga with Priya', 'Certified yoga instructor', 'upcoming'),
('Nutrition Q&A', 'Ask a nutritionist your questions about healthy eating and wellness.', '2026-03-02 12:00:00-05', '2026-03-02 13:30:00-05', 'The Hull Lounge', 'wellness', ARRAY['nutrition', 'health', 'wellness'], 20, 0, 'Dr. Sarah Johnson', 'Registered nutritionist', 'upcoming'),
('Breathwork Workshop', 'Learn powerful breathing techniques for stress relief and energy.', '2026-03-06 19:00:00-05', '2026-03-06 20:30:00-05', 'The Hull Wellness Room', 'wellness', ARRAY['breathing', 'stress', 'wellness'], 25, 5, 'Tom Rivers', 'Breathwork facilitator', 'upcoming');

-- SOCIAL EVENTS (3)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('Members Mixer', 'Meet other Maslow members! Drinks and light bites provided.', '2026-02-19 18:00:00-05', '2026-02-19 20:00:00-05', 'The Hull Lounge', 'social', ARRAY['networking', 'community', 'mixer'], 60, 0, 'Maslow Team', 'Community managers', 'upcoming'),
('Game Night', 'Board games, card games, and good times with fellow members.', '2026-03-04 19:00:00-05', '2026-03-04 22:00:00-05', 'The Hull Lounge', 'social', ARRAY['games', 'fun', 'community'], 40, 0, 'Game Masters', 'Board game enthusiasts', 'upcoming'),
('Book Club: Modern Classics', 'Monthly book discussion. This month: "The Great Gatsby"', '2026-03-09 18:30:00-05', '2026-03-09 20:00:00-05', 'The Hull Library', 'social', ARRAY['books', 'reading', 'discussion'], 15, 0, 'Literary Society', 'Book club organizers', 'upcoming');

-- NIGHTLIFE EVENTS (2)
INSERT INTO events (title, description, event_date, end_date, location, category, tags, max_attendees, price_credits, host_name, host_bio, status) VALUES
('DJ Night', 'Dance the night away with resident DJ spinning house and techno.', '2026-02-28 22:00:00-05', '2026-03-01 02:00:00-05', 'The Hull Dance Floor', 'nightlife', ARRAY['dancing', 'music', 'party'], 80, 10, 'DJ Eclipse', 'Professional DJ', 'upcoming'),
('Karaoke Social', 'Sing your heart out! Private rooms and main stage available.', '2026-03-11 20:00:00-05', '2026-03-11 23:00:00-05', 'The Hull Lounge', 'nightlife', ARRAY['karaoke', 'singing', 'fun'], 50, 5, 'Karaoke Kings', 'Entertainment crew', 'upcoming');

-- =============================================
-- VERIFICATION: Count events by category
-- =============================================
-- Run this to verify:
-- SELECT category, COUNT(*) as count FROM events GROUP BY category ORDER BY category;
