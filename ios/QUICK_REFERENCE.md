# ⚡ MASLOW Watch App - Quick Reference Card

## 🎯 30-Second Overview

**What:** Native Apple Watch app for MASLOW membership
**Features:** Home screen + QR code pass with auto-sync
**Time to integrate:** 30 minutes
**Files created:** 13 (all ready to use)

---

## 📁 File Map

```
Watch App (watchOS target)
├── MaslowWatchApp.swift          → App entry point
├── ContentView.swift             → Home screen
├── PassView.swift                → QR code screen
├── MaslowUser.swift              → Data model
├── WatchConnectivityManager.swift → Sync manager
└── Info.plist                    → Config

iOS App (iOS target)
├── iOS-WatchConnectivityManager.swift → iPhone sync
└── iOS-RNWatchConnectivity.m         → RN bridge

React Native (src/)
└── WatchConnectivity.ts          → JS/TS API

Docs (reference)
├── README_WATCH_APP.md           → Main guide (start here!)
├── MASLOW_WATCH_INTEGRATION_GUIDE.md → Step-by-step
├── WATCH_ASSETS_GUIDE.md         → Assets guide
└── INTEGRATION_CHECKLIST.md      → Complete checklist
```

---

## 🚀 5-Minute Quick Start

### 1. Create Watch Target (Xcode)
```
File → New → Target → "Watch App for iOS App"
Name: Maslow Watch
Bundle: com.maslownyc.app.watchkitapp
```

### 2. Add Watch Files
```
Drag these to "Maslow Watch" target:
✓ MaslowWatchApp.swift
✓ ContentView.swift
✓ PassView.swift
✓ MaslowUser.swift
✓ WatchConnectivityManager.swift
(Rename: remove "MaslowWatch-" prefix)
```

### 3. Add iOS Files
```
Drag these to iOS target:
✓ iOS-WatchConnectivityManager.swift
✓ iOS-RNWatchConnectivity.m
```

### 4. Copy React Native File
```
Copy to src/utils/:
✓ WatchConnectivity.ts
```

### 5. Build
```
Select "Maslow Watch" scheme
⌘R to run on Watch simulator
```

---

## 💻 Code Usage

### In Your React Native App

```typescript
import WatchConnectivity from './utils/WatchConnectivity';

// After login:
WatchConnectivity.sendUserData({
  memberId: 'MASLOW-001',
  name: 'John Doe',
  membershipTier: 'Founding Member',
  email: 'john@example.com'
});

// On logout:
WatchConnectivity.clearUserData();

// Check availability:
if (WatchConnectivity.isAvailable()) {
  // Send data
}
```

### Integration Points

```typescript
// 1. After successful login
const onLogin = async (credentials) => {
  const user = await api.login(credentials);
  WatchConnectivity.sendUserData(user); // ← Add this
};

// 2. On app launch (if logged in)
useEffect(() => {
  if (currentUser) {
    WatchConnectivity.sendUserData(currentUser); // ← Add this
  }
}, []);

// 3. When user data updates
const onProfileUpdate = async (newData) => {
  const user = await api.updateProfile(newData);
  WatchConnectivity.sendUserData(user); // ← Add this
};

// 4. On logout
const onLogout = () => {
  WatchConnectivity.clearUserData(); // ← Add this
  // ... rest of logout logic
};
```

---

## 🎨 Customization Quick Hits

### Change QR Code Content

**File:** `PassView.swift`
```swift
// Line ~35: Change what's encoded
generateQRCode(from: user.memberId)  // Current

// To JSON:
let json = """
{"id":"\(user.memberId)","name":"\(user.name)"}
"""
generateQRCode(from: json)
```

### Change Colors

**File:** `Assets.xcassets/AccentColor`
```
Open in Xcode → Set to your brand color
```

**Or in code:**
```swift
.foregroundStyle(.orange)  // Any SwiftUI color
.foregroundStyle(Color("CustomColor"))  // From assets
```

### Change Logo Size

**File:** `ContentView.swift`
```swift
// Line ~25
.frame(width: 80, height: 80)  // Current
.frame(width: 100, height: 100)  // Larger
```

### Add More User Fields

**File:** `MaslowUser.swift`
```swift
struct MaslowUser: Codable {
    let memberId: String
    let name: String
    let membershipTier: String
    let email: String?
    let phone: String?        // ← Add this
    let expiryDate: Date?     // ← And this
}
```

**Then update dictionary conversion:**
```swift
func toDictionary() -> [String: Any] {
    var dict = [/* existing fields */]
    if let phone = phone {
        dict["phone"] = phone  // ← Add this
    }
    return dict
}
```

---

## 🐛 Quick Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Build errors | Clean build folder (⇧⌘K) |
| Watch won't sync | Check both apps running |
| QR code blank | Verify memberId not empty |
| RN bridge error | Rebuild iOS app completely |
| Logo not showing | Check asset name is "MaslowLogo" |
| Wrong colors | Check AccentColor in assets |

---

## 📱 Test Checklist

```
□ Watch app launches
□ Shows "waiting to sync" when no data
□ Login on iPhone
□ Data appears on Watch
□ Tap "Show Pass"
□ QR code displays
□ QR code scans correctly
□ Works in dark mode
□ Logout on iPhone
□ Data clears on Watch
```

---

## 🎯 Where Things Are

### User Interface
- **Home screen:** `ContentView.swift`
- **Pass screen:** `PassView.swift`
- **App entry:** `MaslowWatchApp.swift`

### Data & Logic
- **User model:** `MaslowUser.swift`
- **Watch sync:** `WatchConnectivityManager.swift` (Watch)
- **iPhone sync:** `iOS-WatchConnectivityManager.swift`
- **RN bridge:** `iOS-RNWatchConnectivity.m`
- **JS API:** `WatchConnectivity.ts`

### Resources
- **Logo:** Assets.xcassets/MaslowLogo
- **Colors:** Assets.xcassets/AccentColor
- **Config:** Info.plist

### Documentation
- **Main guide:** README_WATCH_APP.md (start here!)
- **Step-by-step:** MASLOW_WATCH_INTEGRATION_GUIDE.md
- **Assets help:** WATCH_ASSETS_GUIDE.md
- **Checklist:** INTEGRATION_CHECKLIST.md

---

## 🔑 Key Concepts

### Data Flow
```
iPhone App → WatchConnectivity.ts
  ↓
React Native Bridge (RNWatchConnectivity.m)
  ↓
iOS-WatchConnectivityManager.swift
  ↓
WCSession.sendMessage()
  ↓
Watch WatchConnectivityManager receives
  ↓
Updates @Published var currentUser
  ↓
SwiftUI views update automatically
```

### State Management
```swift
// Watch side:
@StateObject var manager = WatchConnectivityManager.shared
// Updates trigger view refresh

// Published property:
@Published var currentUser: MaslowUser?
// SwiftUI observes this automatically
```

---

## 💡 Pro Tips

1. **Test on real devices** - Simulators can be flaky with WatchConnectivity
2. **Use application context for persistence** - Survives app restarts
3. **Cache data locally** - Works offline
4. **Keep QR codes simple** - Easier to scan
5. **Test in bright light** - QR brightness matters
6. **Support dark mode** - Many users prefer it
7. **Handle missing data gracefully** - Show helpful messages

---

## 📊 File Sizes

| File | Lines | Complexity |
|------|-------|------------|
| ContentView.swift | ~80 | Easy |
| PassView.swift | ~100 | Easy |
| MaslowUser.swift | ~70 | Easy |
| WatchConnectivityManager.swift | ~150 | Medium |
| iOS-WatchConnectivityManager.swift | ~200 | Medium |

**Total Watch app:** ~400 lines
**Total iOS integration:** ~220 lines
**Total TypeScript:** ~80 lines

---

## 🎨 Design Specs

### ContentView
- **Logo size:** 80×80 pt
- **Spacing:** 20 pt between elements
- **Button:** Full width, 12 pt corner radius
- **Font sizes:** Headline (name), Caption (tier)

### PassView
- **QR code:** Full width with padding
- **Background:** White (for QR contrast)
- **Corner radius:** 12 pt
- **Font:** Title3 (name), Caption (tier, ID)

### Colors
- **Accent:** Brand color (customizable)
- **Background:** System background
- **Text:** Primary, secondary, tertiary (system)

---

## 🔐 Security Notes

- ✅ No data sent to external servers
- ✅ WatchConnectivity uses encrypted channel
- ✅ Data cached only in UserDefaults (secure)
- ✅ No analytics in base code
- ✅ QR can encode encrypted data if needed

---

## 📦 Bundle Identifiers

```
iOS App:      com.maslownyc.app
Watch App:    com.maslownyc.app.watchkitapp
```

---

## 🎯 Success Metrics

After integration, you should see:
- ✅ 0 build errors
- ✅ 0 warnings (in Watch files)
- ✅ < 2s launch time
- ✅ < 0.5s QR generation
- ✅ < 5s sync time
- ✅ Works offline (cached data)

---

## 📞 Getting Help

1. **Check README_WATCH_APP.md** (most complete)
2. **Read code comments** (every function documented)
3. **Use Xcode console** (helpful debug logs)
4. **Check INTEGRATION_CHECKLIST.md** (step-by-step)

---

## 🚀 Deployment

### Before App Store Submission
```
□ Add real Maslow logo
□ Set brand colors
□ Add app icons (all sizes)
□ Test on real devices
□ Update privacy policy
□ Create App Store screenshots
□ Write app description
```

### Build Settings
```
Deployment target: watchOS 9.0
Language: Swift
UI: SwiftUI
Signing: Automatic
Team: patrick@maslownyc.com
```

---

## 🎉 You're Ready!

Everything you need is here:
- ✅ Production code
- ✅ Complete docs
- ✅ Integration guide
- ✅ Quick reference (this!)

**Time to build:** ~30 minutes
**Files to add:** 8 (to Xcode)
**Lines to write:** 0 (all ready!)

---

**Start with:** README_WATCH_APP.md
**Reference:** This quick card
**Build:** Follow MASLOW_WATCH_INTEGRATION_GUIDE.md

---

*Keep this card handy during integration!* 📌

Generated: February 20, 2026
MASLOW Watch App Quick Reference
