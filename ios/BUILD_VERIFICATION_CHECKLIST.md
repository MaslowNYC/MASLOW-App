# 🔨 MASLOW Watch - Build & Verify Checklist

## ✅ Quick Verification Steps

### Step 1: Check Files in Xcode (2 min)

Open Xcode and verify these files exist in **MASLOW Watch Watch App** group:

```
✓ MASLOW_Watch_Watch_AppApp.swift
✓ ContentView.swift
✓ PassView.swift
✓ MaslowUser.swift
✓ WatchConnectivityManager.swift
```

**How to check:**
1. Open Xcode Project Navigator (⌘1)
2. Look for "MASLOW Watch Watch App" folder
3. All 5 files should be there

---

### Step 2: Verify Target Membership (1 min)

For each Swift file:
1. Select the file in Project Navigator
2. Open File Inspector (⌥⌘1)
3. Check **Target Membership** section
4. Ensure **"MASLOW Watch Watch App"** is ✓ checked

**Quick way:**
- Select all 5 files
- File Inspector will show "Multiple Values" if inconsistent
- Should show "MASLOW Watch Watch App" checked for all

---

### Step 3: Add Maslow Logo (3 min)

#### Option A: Add Real Logo (Recommended)
1. Open **Assets.xcassets** in Watch target
2. Right-click → **New Image Set**
3. Name: **MaslowLogo**
4. Drag images into @2x and @3x slots
   - @2x: 160×160 pixels
   - @3x: 240×240 pixels

#### Option B: Use System Icon (Temporary)
Edit `ContentView.swift` line ~27:
```swift
// Replace:
Image("MaslowLogo")

// With:
Image(systemName: "star.fill")
    .font(.system(size: 60))
    .foregroundStyle(.orange)
```

---

### Step 4: Build Watch App (2 min)

1. **Select scheme:** MASLOW Watch Watch App
   - Click scheme dropdown in toolbar
   - Choose "MASLOW Watch Watch App"

2. **Select destination:** Apple Watch simulator
   - Click device dropdown
   - Choose any Apple Watch simulator (e.g., "Apple Watch Series 9 (45mm)")

3. **Build:** Press ⌘B
   - Should complete without errors

4. **Run:** Press ⌘R
   - Watch simulator will launch
   - App should appear

---

## 🎯 Expected Behavior

### On First Launch
You should see:

```
┌─────────────────────┐
│     Maslow          │
├─────────────────────┤
│                     │
│   [Logo/Icon]       │
│                     │
│      📱 ⬆️          │
│                     │
│  Open the Maslow    │
│  app on your iPhone │
│     to sync         │
│                     │
└─────────────────────┘
```

**This is correct!** 
- No user data yet (iPhone hasn't sent any)
- App is waiting to sync
- No crashes = success! ✅

---

## 🐛 Common Issues & Quick Fixes

### Issue 1: "Cannot find 'MaslowUser' in scope"

**Cause:** File not in correct target

**Fix:**
1. Select MaslowUser.swift
2. File Inspector (⌥⌘1)
3. Target Membership → ✓ MASLOW Watch Watch App

### Issue 2: "Asset catalog 'MaslowLogo' not found"

**Cause:** Logo asset missing

**Fix (Quick):**
```swift
// ContentView.swift, line ~27
// Comment out or replace with system icon:
Image(systemName: "figure.wave")
    .font(.system(size: 60))
```

**Fix (Proper):**
- Add MaslowLogo image set to Assets

### Issue 3: Build succeeds but app doesn't launch

**Cause:** Scheme not activated

**Fix:**
1. Product → Scheme → MASLOW Watch Watch App
2. Make sure it's selected (checkmark)
3. Try running again

### Issue 4: "No such module 'WatchConnectivity'"

**Cause:** Wrong deployment target or platform

**Fix:**
1. Select MASLOW Watch Watch App target
2. Build Settings
3. Verify:
   - Platform: watchOS
   - Deployment Target: 9.0 or later

---

## 📊 Build Verification Checklist

Run through this checklist:

### Files & Targets
- [ ] All 5 Swift files visible in Xcode
- [ ] All files have target membership set correctly
- [ ] No red (missing) files in Project Navigator
- [ ] Assets.xcassets exists in Watch target

### Build
- [ ] Scheme set to "MASLOW Watch Watch App"
- [ ] Clean build folder (⇧⌘K)
- [ ] Build succeeds (⌘B) with 0 errors
- [ ] 0 warnings (or only logo warning if temporary)

### Run
- [ ] Watch simulator selected
- [ ] App launches (⌘R)
- [ ] App appears on Watch simulator screen
- [ ] Shows "waiting to sync" message
- [ ] No crashes
- [ ] Can navigate around app

### Code
- [ ] All imports present (SwiftUI, WatchConnectivity, etc.)
- [ ] No syntax errors
- [ ] No "undefined" errors
- [ ] Preview compiles (optional)

---

## 🎨 Optional: Test QR Code Generation

Want to verify QR code works without iPhone integration?

### Add Test Data
Edit `ContentView.swift`, add this at the top:

```swift
struct ContentView: View {
    @StateObject private var connectivityManager = WatchConnectivityManager.shared
    @State private var showingPass = false
    
    // ADD THIS FOR TESTING:
    private var testUser: MaslowUser {
        MaslowUser(
            memberId: "TEST-001",
            name: "Test User",
            membershipTier: "Testing"
        )
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // ... rest of code
                
                // REPLACE THIS:
                if let user = connectivityManager.currentUser {
                
                // WITH THIS (temporarily):
                if let user = connectivityManager.currentUser ?? Optional(testUser) {
```

Now you'll see test data and can tap "Show Pass" to verify QR code generates!

**Remember to remove test code before production!**

---

## 🚀 Next Steps After Successful Build

Once your Watch app builds and runs:

### Immediate
1. ✅ Take a screenshot (for records)
2. ✅ Test on different Watch sizes
   - 40mm, 44mm, 45mm, 49mm
3. ✅ Test in dark mode
   - Device → Toggle Appearance

### This Week
1. **Add iOS integration**
   - Copy `iOS-WatchConnectivityManager.swift` to iOS target
   - Copy `iOS-RNWatchConnectivity.m` to iOS target
   - Copy `WatchConnectivity.ts` to React Native

2. **Integrate with login**
   - Call `WatchConnectivity.sendUserData()` after login
   - Test sync between iPhone and Watch

3. **Add real logo**
   - Export from design files
   - Add to Assets

### Next Week
1. **Test on real devices**
   - Install on real iPhone
   - Install on paired Apple Watch
   - Test in real-world conditions

2. **Polish**
   - Adjust colors
   - Fine-tune UI
   - Test edge cases

3. **Prepare for launch**
   - App icons
   - Screenshots
   - App Store metadata

---

## 💡 Pro Tips

### Faster Iteration
- Keep Watch simulator open
- Use Hot Reload when possible
- Test on largest Watch size first (easier to see)

### Debugging
- Open Console app to see print statements
- Use breakpoints in Xcode
- Check WatchConnectivity logs (emoji prefixes help!)

### Design
- Test in both light and dark mode
- Check on smallest Watch (readability)
- Verify QR code scans with real scanner

---

## 📞 Getting Help

### In-Project Help
- Read code comments (every function documented)
- Check `README_WATCH_APP.md`
- Use `QUICK_REFERENCE.md`

### Xcode Help
- Build errors → Click error for details
- Issue Navigator (⌘5) → See all issues
- Console (⇧⌘C) → See runtime logs

### Common Questions

**Q: Do I need to build iOS app first?**
A: No! Watch app is independent and can build/run alone.

**Q: Why doesn't it show user data?**
A: That's correct! iPhone needs to send data (next step).

**Q: Can I test without iPhone?**
A: Yes! Use test data (see "Optional: Test QR Code" above).

**Q: What if I get warnings?**
A: Logo warning is OK if you're using placeholder. Other warnings should be investigated.

---

## ✅ Success Criteria

You've successfully integrated the Watch app when:

1. ✅ All files in Xcode
2. ✅ Build succeeds (0 errors)
3. ✅ App launches on Watch simulator
4. ✅ Shows UI (logo/icon + message)
5. ✅ No crashes
6. ✅ Can navigate (if you added test data)

**🎉 You're ready for iPhone integration!**

---

## 📋 Quick Commands Reference

| Action | Shortcut |
|--------|----------|
| Build | ⌘B |
| Run | ⌘R |
| Stop | ⌘. |
| Clean Build Folder | ⇧⌘K |
| Show Project Navigator | ⌘1 |
| Show File Inspector | ⌥⌘1 |
| Show Console | ⇧⌘C |
| Show Issue Navigator | ⌘5 |

---

## 🎯 Time Estimate

- **File verification:** 2 min
- **Target check:** 1 min  
- **Logo setup:** 3 min (or 30 sec for placeholder)
- **First build:** 2 min
- **Testing:** 2 min

**Total: ~10 minutes** to fully verified Watch app! ⚡

---

Generated: February 20, 2026
MASLOW Watch Build Verification
Let's make sure everything works! 🔨
