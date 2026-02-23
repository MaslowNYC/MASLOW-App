# 🎯 MASLOW Apple Watch App - Setup Guide

## ✅ Files Created

### Watch App Files (Add to MASLOW Watch target)
- ✅ **MASLOWWatchApp.swift** - App entry point
- ✅ **ContentView.swift** - Home screen with credits and member number
- ✅ **PassView.swift** - QR code pass screen
- ✅ **WatchConnectivityManager.swift** - Watch-side sync manager

### iOS Integration Files (Add to iOS target)
- ✅ **iOSWatchConnectivityManager.swift** - iPhone-side sync manager
- ✅ **RNWatchSync.swift** - React Native bridge (Swift)
- ✅ **RNWatchSync.m** - React Native bridge (Objective-C)

### React Native Files (Add to your app source)
- ✅ **WatchSync.ts** - TypeScript API for easy integration

---

## 🚀 Step-by-Step Integration

### STEP 1: Create Watch App Target in Xcode

1. Open your MASLOW Xcode project
2. **File → New → Target**
3. Select **"Watch App for iOS App"**
4. Settings:
   - Product Name: `MASLOW Watch`
   - Bundle ID: `com.maslow.app.watchkitapp`
   - Language: Swift
   - Interface: SwiftUI
5. Click **Finish**
6. Click **Activate** when prompted

---

### STEP 2: Add Watch App Files

1. In Xcode, locate the **MASLOW Watch Watch App** folder
2. **Delete the default files** (ContentView.swift, etc.) if they exist
3. **Add our files**:
   - Right-click **MASLOW Watch Watch App** folder
   - Select **Add Files to "MASLOW Watch"...**
   - Navigate to repository and select:
     ```
     ✓ MASLOWWatchApp.swift
     ✓ ContentView.swift
     ✓ PassView.swift
     ✓ WatchConnectivityManager.swift
     ```
   - Check: ✓ Copy items if needed
   - Target: ✓ MASLOW Watch Watch App
   - Click **Add**

---

### STEP 3: Add Maslow Logo to Watch Assets

1. Locate your Maslow logo file:
   ```
   /Users/patrickmay/Maslow/MASLOW-App/assets/Maslow_1.png
   ```

2. In Xcode:
   - Open **MASLOW Watch Watch App → Assets.xcassets**
   - Right-click → **New Image Set**
   - Name: `MaslowLogo`
   - Drag **Maslow_1.png** into the image set
   - Xcode will automatically handle sizing

**Alternative if logo not found:**
Replace logo reference in ContentView.swift:
```swift
// Replace:
Image("MaslowLogo")

// With system icon (temporary):
Image(systemName: "star.circle.fill")
    .foregroundColor(Color(red: 0x28/255, green: 0x6A/255, blue: 0xBC/255))
```

---

### STEP 4: Add iOS Integration Files

1. In Xcode, right-click on your **iOS app target** folder (not Watch)
2. **Add Files to "MASLOW"...**
3. Select:
   ```
   ✓ iOSWatchConnectivityManager.swift
   ✓ RNWatchSync.swift
   ✓ RNWatchSync.m
   ```
4. Target: ✓ MASLOW (your iOS app)
5. Click **Add**

---

### STEP 5: Add React Native Integration

1. Copy **WatchSync.ts** to your React Native source folder:
   ```
   cp WatchSync.ts /path/to/your/app/src/utils/
   ```

2. In your React Native code (e.g., after login):
   ```typescript
   import WatchSync from './utils/WatchSync';
   
   // After successful login:
   const credits = 50; // Get from your state
   const memberNumber = 12345; // Get from user data
   
   WatchSync.syncToWatch(credits, memberNumber);
   ```

3. On logout:
   ```typescript
   WatchSync.clearWatchData();
   ```

---

### STEP 6: Build & Test

#### Build Watch App
1. Select **MASLOW Watch Watch App** scheme
2. Choose Apple Watch simulator (or paired device)
3. Press **⌘B** to build
4. Press **⌘R** to run

**Expected result:**
- Watch app launches
- Shows member #00000 and 0 credits (default values)
- "Show Pass" button works
- QR code displays

#### Test iPhone → Watch Sync
1. Run iOS app on iPhone simulator
2. Run Watch app on Watch simulator
3. In your iOS app, call `WatchSync.syncToWatch(50, 12345)`
4. Watch should update to show 50 credits and member #12345

---

## 🎨 Features

### Watch App Home Screen
- Maslow logo (60×60 pt)
- Member number display
- Large credits count (56pt bold)
- Blue brand color (#286ABC)
- "Show Pass" button

### Watch Pass Screen
- QR code (150×150 pt)
- Encodes: `https://maslownyc.com/member/[number]`
- High error correction (H level)
- "Scan to check in" label

### Sync Features
- Real-time sync from iPhone to Watch
- Automatic updates when credits change
- Persists across app launches (via applicationContext)
- Works in background

---

## 📱 Integration Points

### When to Sync to Watch

```typescript
import WatchSync from './utils/WatchSync';

// 1. After successful login
const handleLogin = async () => {
  const user = await loginAPI();
  WatchSync.syncToWatch(user.credits, user.memberNumber);
};

// 2. When credits change (after purchase, entry, etc.)
const handleCreditUpdate = (newCredits: number) => {
  setCredits(newCredits);
  WatchSync.syncToWatch(newCredits, memberNumber);
};

// 3. On app startup (if already logged in)
useEffect(() => {
  if (isLoggedIn) {
    WatchSync.syncToWatch(credits, memberNumber);
  }
}, []);

// 4. On logout
const handleLogout = () => {
  WatchSync.clearWatchData();
  // ... rest of logout logic
};
```

---

## 🐛 Troubleshooting

### Build Errors

**"Cannot find 'WatchConnectivityManager' in scope"**
- Solution: Verify all 4 Watch files are added to MASLOW Watch target
- Check Target Membership in File Inspector

**"Asset catalog 'MaslowLogo' not found"**
- Solution: Add logo to Assets or use system icon placeholder

**"No such module 'WatchConnectivity'"**
- Solution: This is a system framework - no action needed
- Verify deployment target is watchOS 9.0+

### Runtime Issues

**Watch shows 0 credits/member number**
- Solution: Make sure you're calling `WatchSync.syncToWatch()` from iOS
- Check console for sync messages
- Verify both apps are running

**QR code doesn't display**
- Solution: Check memberNumber is not 0
- Verify CoreImage framework is available
- Try on real device (simulators can be inconsistent)

---

## 📊 Testing Checklist

### Watch App Only
- [ ] App builds without errors
- [ ] App launches on Watch simulator
- [ ] Logo displays correctly
- [ ] Member number shows (even if 00000)
- [ ] Credits show (even if 0)
- [ ] "Show Pass" button navigates to PassView
- [ ] QR code generates and displays

### Full Integration
- [ ] iOS app can sync to Watch
- [ ] Watch updates when iOS sends data
- [ ] Credits update correctly
- [ ] Member number updates correctly
- [ ] QR code contains correct URL
- [ ] QR code is scannable
- [ ] Works after relaunch (data persists)

### User Experience
- [ ] UI looks good on 40mm Watch
- [ ] UI looks good on 45mm Watch
- [ ] UI looks good on 49mm Watch
- [ ] Readable in bright light
- [ ] Readable in dark mode
- [ ] Animations smooth
- [ ] No crashes

---

## 🎯 Current Status

**What's Ready:**
- ✅ All Watch app files created
- ✅ All iOS integration files created
- ✅ React Native bridge ready
- ✅ TypeScript API ready
- ✅ Complete sync implementation

**What You Need to Do:**
1. Create Watch App target in Xcode (can't be automated)
2. Add files to correct targets
3. Add Maslow logo asset
4. Build and test
5. Integrate `WatchSync.syncToWatch()` calls in your app

**Time Estimate:** 15-20 minutes

---

## 🎨 Color Reference

The app uses MASLOW's blue brand color throughout:

```swift
Color(red: 0x28/255, green: 0x6A/255, blue: 0xBC/255)
// Hex: #286ABC
// RGB: rgb(40, 106, 188)
```

---

## 📝 Code Examples

### Full Login Integration Example

```typescript
import WatchSync from './utils/WatchSync';

const LoginScreen = () => {
  const [credits, setCredits] = useState(0);
  const [memberNumber, setMemberNumber] = useState(0);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await loginAPI(email, password);
      
      // Update state
      setCredits(response.credits);
      setMemberNumber(response.memberNumber);
      
      // Sync to Watch
      WatchSync.syncToWatch(response.credits, response.memberNumber);
      
      // Navigate to home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // ... your login UI
  );
};
```

### Credit Update Example

```typescript
const handlePurchaseCredits = async (amount: number) => {
  try {
    const newCredits = await purchaseCreditsAPI(amount);
    setCredits(newCredits);
    
    // Sync updated credits to Watch
    WatchSync.syncToWatch(newCredits, memberNumber);
    
    showSuccessMessage(`Purchased ${amount} credits!`);
  } catch (error) {
    console.error('Purchase failed:', error);
  }
};
```

---

## 🚀 You're Ready!

All files are created and ready to integrate. Follow the steps above to:

1. **Create Watch target** (5 min)
2. **Add files** (5 min)
3. **Add logo** (2 min)
4. **Build & test** (5 min)
5. **Integrate sync calls** (10 min)

**Total: ~30 minutes to fully working Watch app!**

---

**Questions?** All code is commented and ready to use. Just follow the steps! 🎯

Generated: February 20, 2026
MASLOW Apple Watch App - Complete Package
Ready to build! ⌚✨
