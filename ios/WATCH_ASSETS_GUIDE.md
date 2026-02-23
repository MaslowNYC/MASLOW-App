# Assets Catalog Structure for Maslow Watch

This document describes the recommended asset structure for the Maslow Watch app.

## Assets.xcassets Structure

```
Assets.xcassets/
├── AppIcon.appiconset/          # Watch app icon (required)
│   ├── Contents.json
│   └── [Various sizes for different Watch models]
│
├── MaslowLogo.imageset/         # Main logo used in ContentView
│   ├── Contents.json
│   ├── MaslowLogo@2x.png       # 160x160 pixels
│   └── MaslowLogo@3x.png       # 240x240 pixels
│
├── AccentColor.colorset/        # App accent color (Maslow brand color)
│   └── Contents.json
│
└── Colors/                      # Optional: Custom color palette
    ├── MaslowPrimary.colorset/
    ├── MaslowSecondary.colorset/
    └── MaslowBackground.colorset/
```

## Required Assets

### 1. App Icon (AppIcon.appiconset)

Xcode will create this automatically when you create the Watch target. You need to provide:

**Watch App Icon sizes:**
- 172x172 - @2x 43mm/44mm/45mm/49mm watches
- 196x196 - @2x 46mm watches
- 258x258 - @3x 43mm/44mm/45mm/49mm watches
- 294x294 - @3x 46mm watches

**App Store Icon:**
- 1024x1024 - App Store listing

**Tips:**
- Must NOT have transparency
- Must be square
- Use simple, recognizable design
- Consider how it looks at small sizes

### 2. Maslow Logo (MaslowLogo.imageset)

Used in ContentView.swift:
```swift
Image("MaslowLogo")
    .resizable()
    .aspectRatio(contentMode: .fit)
    .frame(width: 80, height: 80)
```

**Recommended sizes:**
- @1x: 80x80 pixels (not usually needed)
- @2x: 160x160 pixels
- @3x: 240x240 pixels

**Format:**
- PNG with transparency preferred
- Can be PDF vector (even better - scales to any size)

**Design tips:**
- Keep it simple and recognizable
- Works well on both light and dark backgrounds
- Consider using a monochrome version for Watch

### 3. Accent Color (AccentColor.colorset)

The main brand color used for buttons and interactive elements.

**To create:**
1. In Assets.xcassets, right-click → New Color Set
2. Name it "AccentColor" (Xcode creates this by default)
3. Set colors for:
   - Any Appearance (light mode)
   - Dark Appearance (dark mode)

**Maslow brand color suggestions:**
```
Light mode: #FF6B35 (or your brand color)
Dark mode:  #FF8555 (slightly lighter version)
```

## Optional Assets

### Additional Images

If you want to add more graphics:

```
Assets.xcassets/
├── PassBackground.imageset/     # Background for pass screen
├── QRFrame.imageset/            # Decorative frame around QR code
└── EmptyState.imageset/         # Illustration for "no data" state
```

### Custom Colors

Create a consistent color palette:

```
Colors/
├── MaslowPrimary.colorset/      # Main brand color
├── MaslowSecondary.colorset/    # Secondary accent
├── MaslowText.colorset/         # Text color
├── MaslowBackground.colorset/   # Background color
└── MaslowError.colorset/        # Error states
```

**Usage in SwiftUI:**
```swift
Text("Hello")
    .foregroundStyle(Color("MaslowPrimary"))

Button("Show Pass") { }
    .background(Color("MaslowSecondary"))
```

## Creating Assets in Xcode

### To add an Image Set:

1. Select **Assets.xcassets** in Project Navigator
2. Click **+** button at bottom or right-click in canvas
3. Select **New Image Set**
4. Name it (e.g., "MaslowLogo")
5. Drag and drop images into @1x, @2x, @3x slots

### To add a Color Set:

1. Select **Assets.xcassets**
2. Click **+** → **New Color Set**
3. Name it (e.g., "MaslowPrimary")
4. Click the color in the Attributes Inspector
5. Use color picker to choose your brand color
6. Add dark appearance variant if needed

### To use a PDF Vector Image:

1. Create image set as above
2. In Attributes Inspector, select "Preserve Vector Data"
3. Set "Scales" to "Single Scale"
4. Drop PDF into Universal slot
5. Benefit: Perfect at any size, smaller file

## Asset Organization Best Practices

### File Naming Conventions

```
Good:
- MaslowLogo
- PassBackground
- MembershipBadge

Avoid:
- maslow_logo (use camelCase, not snake_case)
- Logo (too generic)
- img1 (not descriptive)
```

### Folder Structure

For larger projects, organize assets:

```
Assets.xcassets/
├── Icons/
│   ├── AppIcon.appiconset/
│   ├── TabBar/
│   └── Symbols/
├── Images/
│   ├── Branding/
│   │   └── MaslowLogo.imageset/
│   └── Backgrounds/
│       └── PassBackground.imageset/
└── Colors/
    ├── Brand/
    └── Semantic/
```

## Preparing Assets

### Image Specifications

**Logos and Icons:**
- Format: PNG-24 with alpha channel
- Color space: sRGB
- DPI: 72 (standard for iOS/watchOS)
- Optimization: Use ImageOptim or similar

**Photos/Backgrounds:**
- Format: JPEG for photos, PNG for graphics
- Color space: sRGB or Display P3
- Quality: 80-90% (balance size vs quality)

**Vector Graphics:**
- Format: PDF
- Color space: RGB
- Fonts: Convert to outlines
- Artboard: Exact size needed

### Color Specifications

Use your Maslow brand colors. Common approaches:

**Option 1: Hex Colors**
```
Primary:   #FF6B35
Secondary: #004E89
Text:      #1A1A1A
Background:#F8F9FA
```

**Option 2: RGB/HSB**
```
Primary:   rgb(255, 107, 53)
Secondary: rgb(0, 78, 137)
```

**Option 3: Dynamic Colors**
Different colors for light/dark mode:
```
Light mode: #FF6B35
Dark mode:  #FF8555
```

## Quick Setup Checklist

- [ ] Create MaslowLogo image set
- [ ] Add logo images (@2x and @3x)
- [ ] Create/customize AccentColor
- [ ] Add light mode color
- [ ] Add dark mode color variant
- [ ] Test on different Watch sizes
- [ ] Test in light and dark mode
- [ ] Verify logo renders clearly
- [ ] Check color contrast for accessibility

## Exporting from Design Tools

### From Figma:
1. Select asset
2. Export settings:
   - Format: PNG
   - Size: 2x and 3x
3. Export
4. Rename: `AssetName@2x.png`, `AssetName@3x.png`

### From Sketch:
1. Make slice
2. Export:
   - Format: PNG
   - Sizes: 2x, 3x
3. Export to folder

### From Adobe Illustrator:
1. File → Export → Export for Screens
2. Choose iOS
3. Select 2x and 3x
4. Export

## Testing Assets

After adding assets, test:

1. **Different Watch sizes:**
   - 40mm, 41mm, 44mm, 45mm, 49mm
   
2. **Appearance modes:**
   - Light mode
   - Dark mode
   - Always-on display (dimmed)
   
3. **Dynamic type:**
   - Default text size
   - Largest text size
   
4. **Accessibility:**
   - VoiceOver
   - Increase Contrast mode

## Resources

- [Apple Human Interface Guidelines - watchOS Icons](https://developer.apple.com/design/human-interface-guidelines/watchos/icons-and-images/home-screen-icons/)
- [Asset Catalog Format Reference](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/)
- [Color in watchOS](https://developer.apple.com/design/human-interface-guidelines/watchos/visual-design/color/)

---

## Quick Reference: Standard Image Sizes

```
Watch App Icon:      172×172 (@2x), 196×196 (@2x 46mm)
                     258×258 (@3x), 294×294 (@3x 46mm)
Logo (in-app):       80×80 (@1x), 160×160 (@2x), 240×240 (@3x)
Complications:       Varies by type
Notification Icon:   48×48 (@2x), 72×72 (@3x)
```

---

Generated: February 20, 2026
Maslow Watch Assets Guide
