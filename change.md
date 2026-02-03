# MASLOW MOBILE APP - CHANGELOG

---

## [2.0.0] - 2026-02-02

### 🎉 Major Release - Complete MVP
**Complete rebuild with full feature set and onboarding**

### ✅ Added

**Onboarding Flow:**
- Welcome screen with brand introduction
- How It Works tutorial (3-step process)
- Get Started screen with signup/login options
- One-time display using AsyncStorage
- Smooth animations and transitions

**Control Tab:**
- Lighting controls (brightness 0-100%, temperature 2200K-6500K)
- 4 lighting presets (Relaxing, Energizing, Mirror, Night)
- Audio controls (volume slider, 4 soundscapes)
- Air quality controls (UV-C sanitization cycle, fan speed)
- Session timer with auto-countdown
- Haptic feedback on all interactions
- Real-time UI updates

**History Tab:**
- Monthly usage statistics
- Visit history with timestamps
- Duration tracking
- Settings used per visit
- Most visited location display
- Mock data ready for Supabase integration

**Locations Tab:**
- Nearby locations list
- Real-time availability status
- Distance calculations
- Amenities display (shower, accessible, changing table)
- Hours of operation
- Navigate and Show Pass buttons
- Map view placeholder

**Enhanced Navigation:**
- 5-tab bottom navigation
- Renamed tabs: Pass, Control, Locations, History, Account
- Consistent brand styling across all tabs

### 🔧 Technical Improvements
- Installed expo-haptics for tactile feedback
- Added fade-in animations on all major screens
- Improved color palette and spacing
- Better component organization
- Mock hardware API ready for real integration

### 🎨 UI/UX Polish
- Consistent BLUE (#2C5F8D), CREAM (#F9F2EC), GOLD (#C5A059) palette
- Improved card designs with shadows
- Better typography hierarchy
- Emoji icons for visual interest
- Smooth transitions between screens
- Loading states and error handling

### 📊 Mock Data Structure
- Usage logs with location, duration, settings
- Location data with coordinates, amenities, hours
- Ready for Supabase table integration

### 🐛 Fixed
- Resolved SDK 54 dependency issues
- Fixed missing @supabase packages
- Fixed expo-router route conflicts
- Fixed tab navigation layout issues
- Removed duplicate/ghost tabs

---

## [1.0.0] - 2026-02-01

### 🎉 Initial Release
**First working version built from scratch**

### ✅ Added
- Login/Signup with Supabase authentication
- Pass screen with QR code generation
- Profile screen with membership tier display
- Tab navigation (Pass, Profile)
- Session persistence with AsyncStorage
- New Supabase publishable key system

### 🔧 Technical
- Expo SDK 54
- React Native with Expo Router
- Pure StyleSheet (no NativeWind)
- File-based routing

---

## Future Roadmap

### Version 2.1 (Tonight/Tomorrow)
- [ ] Connect real Supabase data (locations, usage_logs)
- [ ] Polish UI colors and spacing
- [ ] Add profile picture upload
- [ ] Save user preferences to database

### Version 2.2 (This Week)
- [ ] Real-time availability updates
- [ ] Push notifications
- [ ] Offline mode support
- [ ] Payment integration (Stripe)

### Version 3.0 (Hardware Integration)
- [ ] ESP32 door lock connection
- [ ] Lighting hardware API
- [ ] Audio hardware API  
- [ ] UV-C and ventilation control
- [ ] Real-time sensor data

---

**Last Updated:** February 2, 2026
**Maintained by:** Patrick May