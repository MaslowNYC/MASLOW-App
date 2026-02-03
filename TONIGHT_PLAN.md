# TONIGHT'S DEVELOPMENT PLAN
**Goal:** Make app look good + connect to Supabase

---

## 🎨 PHASE 1: UI POLISH (1-2 hours)

### Colors & Spacing
- [ ] Review all screens and adjust spacing for consistency
- [ ] Fine-tune button sizes and padding
- [ ] Improve card shadows and borders
- [ ] Add subtle gradients where appropriate

### Typography
- [ ] Consistent font sizes across screens
- [ ] Better hierarchy (titles, subtitles, body)
- [ ] Improve readability

### Animations
- [ ] Add loading skeletons for data fetching
- [ ] Smooth transitions between tabs
- [ ] Better button press animations

### Control Tab Specific
- [ ] Better slider track styling
- [ ] Preset button active states
- [ ] UV cycle progress indicator
- [ ] Fan speed visual feedback

---

## 🔌 PHASE 2: SUPABASE INTEGRATION (2-3 hours)

### Database Setup
- [ ] Create `locations` table
  - Columns: id, name, address, lat, lng, amenities, hours, occupied
  - Add seed data for 5-10 NYC locations
  
- [ ] Create `usage_logs` table
  - Columns: id, user_id, location_id, entry_time, exit_time, duration_minutes, settings_used
  - Enable RLS (Row Level Security)
  
- [ ] Create `user_preferences` table
  - Columns: user_id, default_lighting, default_audio, notifications
  - Link to profiles table

### Code Changes

**Locations Tab:**
- [ ] Replace mock data with Supabase query
- [ ] Fetch locations on screen load
- [ ] Show loading state while fetching
- [ ] Handle errors gracefully

**History Tab:**
- [ ] Fetch usage_logs for current user
- [ ] Calculate stats from real data
- [ ] Show empty state if no history
- [ ] Add pull-to-refresh

**Profile Tab:**
- [ ] Fetch/update user preferences
- [ ] Save default settings to database
- [ ] Profile picture upload to Supabase Storage

### API Layer
- [ ] Create `lib/api.js` with helper functions:
  - fetchLocations()
  - fetchUserHistory()
  - saveUserPreferences()
  - logUsageEntry()

---

## 📋 PHASE 3: TESTING (30 min)

- [ ] Test login flow
- [ ] Test data loading on all tabs
- [ ] Test creating/updating preferences
- [ ] Test with slow network (throttle in dev tools)
- [ ] Test error states
- [ ] Fix any bugs found

---

## 🎯 SUCCESS CRITERIA

By end of tonight:
- App looks polished and professional
- All tabs load real data from Supabase
- User preferences save and load correctly
- No crashes or major bugs
- Ready to show someone

---

## 📝 NOTES

**Database RLS Policies Needed:**
```sql
-- Locations: everyone can read
CREATE POLICY "Public locations are viewable by everyone"
ON locations FOR SELECT
USING (true);

-- Usage logs: users see only their own
CREATE POLICY "Users can view own usage logs"
ON usage_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
ON usage_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Preferences: users manage only their own
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON user_preferences FOR ALL
USING (auth.uid() = user_id);
```

---

**Estimated Total Time:** 3.5 - 5 hours
**Start Time:** [Fill in when you start]
**End Time:** [Fill in when done]
