# ⚡ MASLOW Watch App - Quick Build Instructions

## 🎯 GOAL
Working Apple Watch app that syncs with iPhone and displays member info + QR pass.

---

## ✅ Files Created - All Ready!

### Watch App (4 files) → Add to MASLOW Watch target
```
✓ MASLOWWatchApp.swift          - App entry point
✓ ContentView.swift             - Home screen (credits + member #)
✓ PassView.swift                - QR code pass
✓ WatchConnectivityManager.swift - Sync from iPhone
```

### iOS Integration (3 files) → Add to iOS target
```
✓ iOSWatchConnectivityManager.swift - iPhone sync manager
✓ RNWatchSync.swift                 - RN bridge (Swift)
✓ RNWatchSync.m                     - RN bridge (Obj-C)
```

### React Native (1 file) → Add to app source
```
✓ WatchSync.ts - TypeScript API
```

---

## 🚀 STEP 1: Add Watch App Target

**In Xcode:**
1. File → New → Target
2. Select **"Watch App for iOS App"**
3. Settings:
   - Product Name: `MASLOW Watch`
   - Bundle ID: `com.maslow.app.watchkitapp`
   - Language: Swift
   - Interface: SwiftUI
4. Click Finish → Activate

✅ **Done:** Watch target created

---

## 🚀 STEP 2: Add Watch Files

**In Xcode:**
1. Right-click **MASLOW Watch Watch App** folder
2. Add Files to "MASLOW Watch"...
3. Select all 4 Watch files from repository:
   - MASLOWWatchApp.swift
   - ContentView.swift
   - PassView.swift
   - WatchConnectivityManager.swift
4. ✓ Copy items if needed
5. Target: ✓ MASLOW Watch Watch App
6. Click Add

✅ **Done:** Watch app code added

---

## 🚀 STEP 3: Add Maslow Logo

**Option A - Use Real Logo:**
1. Find: `/Users/patrickmay/Maslow/MASLOW-App/assets/Maslow_1.png`
2. In Xcode: MASLOW Watch Watch App → Assets.xcassets
3. Right-click → New Image Set
4. Name: `MaslowLogo`
5. Drag Maslow_1.png into image set

**Option B - Temporary Placeholder:**
Edit ContentView.swift, replace line ~18:
```swift
Image(systemName: "star.circle.fill")
    .foregroundColor(Color(red: 0x28/255, green: 0x6A/255, blue: 0xBC/255))
    .frame(width: 60, height: 60)
```

✅ **Done:** Logo added (or placeholder)

---

## 🚀 STEP 4: Build Watch App

**In Xcode:**
1. Select scheme: **MASLOW Watch Watch App**
2. Select destination: **Apple Watch Series 9 (45mm)** (or any Watch simulator)
3. Press **⌘B** to build
4. Press **⌘R** to run

**Expected Result:**
```
┌──────────────────┐
│                  │
│   [Maslow Logo]  │
│                  │
│  Member #00000   │
│                  │
│        0         │
│     Credits      │
│                  │
│   [Show Pass]    │
│                  │
└──────────────────┘
```

✅ **Done:** Watch app running!

---

## 🚀 STEP 5: Add iOS Integration (Optional but Recommended)

**To enable iPhone → Watch sync:**

1. Right-click iOS app folder
2. Add Files to "MASLOW"...
3. Select:
   - iOSWatchConnectivityManager.swift
   - RNWatchSync.swift
   - RNWatchSync.m
4. Target: ✓ MASLOW (iOS)
5. Add

**Then add TypeScript:**
```bash
cp WatchSync.ts /path/to/your/react-native/src/utils/
```

**Use in your app:**
```typescript
import WatchSync from './utils/WatchSync';

// After login:
WatchSync.syncToWatch(50, 12345); // credits, memberNumber
```

✅ **Done:** Full sync working!

---

## 🎯 What You Get

### Watch App Features
- ✅ Maslow logo
- ✅ Member number display (#00000 format)
- ✅ Credits count (large, bold)
- ✅ "Show Pass" button
- ✅ QR code generation
- ✅ MASLOW blue branding (#286ABC)

### QR Code Details
- URL: `https://maslownyc.com/member/[number]`
- Size: 150×150 pt
- Error correction: High (H)
- Scannable for check-in

### Sync Features
- Real-time updates from iPhone
- Background sync via applicationContext
- Persists across app launches
- Works when Watch is standalone

---

## 📋 Build Verification Checklist

- [ ] Watch target created
- [ ] 4 Watch files added to Watch target
- [ ] Logo added (or placeholder working)
- [ ] Watch app builds (⌘B succeeds)
- [ ] Watch app runs (⌘R launches app)
- [ ] Shows logo, member #, credits
- [ ] "Show Pass" button works
- [ ] QR code displays on PassView
- [ ] No crashes

**All checked?** → **Watch app ready! 🎉**

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Build errors | Check all 4 files in Watch target |
| Logo not found | Use placeholder or add image asset |
| QR code blank | Normal - needs real member number |
| 0 credits showing | Normal - needs sync from iPhone |

---

## 🎨 App Specifications

### Colors
- Brand Blue: `#286ABC` (rgb 40, 106, 188)
- Text Gray: `.gray`
- White: `.white`

### Typography
- Credits: 56pt bold
- Button: 16pt semibold
- Member #: caption
- Labels: caption

### Layout
- Logo: 60×60 pt
- QR Code: 150×150 pt
- Button: full width, 12pt radius
- Spacing: 16pt between elements

---

## ⏱️ Time Estimate

- **Step 1 (Target):** 2 minutes
- **Step 2 (Files):** 3 minutes
- **Step 3 (Logo):** 2 minutes
- **Step 4 (Build):** 3 minutes
- **Step 5 (iOS sync):** 10 minutes

**Total:** 20 minutes to fully working Watch app!

---

## 🚀 RESULT

When you're done, you'll have:

✅ Native Apple Watch app  
✅ Member number display  
✅ Credits counter  
✅ QR code pass for entry  
✅ Real-time sync with iPhone  
✅ Maslow branding  
✅ Ready to install on Watch  

**Tell me when it's built and I'll help you test the sync!** 🎯⌚

---

Generated: February 20, 2026  
MASLOW Watch App - Quick Build Guide  
All files ready! Just add to Xcode! 🚀
