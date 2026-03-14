# MASLOW APP — Redesign Brief
## Post-Carolyn Sprint · For Cline · React Native / Expo · March 2026

---

## Context & Goal

The website has been redesigned with a premium, editorial aesthetic: dark moss hero sections, cream body, Cormorant Garamond serif headlines, Jost sans-serif labels, gold accents, and zero rounded corners. The app currently uses a different visual language — navy blue primary, rounded cards, generic mobile UI patterns.

This brief aligns the app to match the website as its perfect mobile companion. Same soul, different form factor. The goal is not to make the app look like the website — it's a phone, not a browser. The goal is to make someone who uses both feel like they're inside the same world.

---

## Design Tokens — Canonical

### Colors
- Cream (primary bg): `#FAF4ED`
- Cream 2 (secondary bg): `#F2E8DC`
- Charcoal (primary text): `#2A2724`
- Gold (accent): `#C49F58`
- Moss (secondary accent): `#4A5C3A`
- Water (link/info): `#7AABCC`
- Brand Blue (logo only): `#286BCD`

### Typography
- Serif headlines: **Cormorant Garamond** — `@expo-google-fonts/cormorant-garamond`
- Sans body/labels: **Jost** — `@expo-google-fonts/jost`
- Fallback: System serif / System sans if fonts not loaded yet

### Shape Language
- Buttons: `borderRadius: 2` — NOT rounded, NOT pill-shaped
- Cards: `borderRadius: 2` — same rule
- Input fields: `borderRadius: 2`

### Shadows
- `shadowColor: '#2A2724', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2`
- No blue or cool-toned drop shadows

---

## Screen-by-Screen Redesign

### 1. Home Screen (Unauthenticated)
**Target:** The unauthenticated home should feel like arriving at a place you want to enter.
- Background: Dark moss gradient — `#1a2318` to `#2d3b28`
- Logo: `MASLOW - Round.png` centered, ~120px, top 1/3 of screen
- Tagline: "Where the city can wait." — Cormorant Garamond, cream, light, 22px
- Keep crossfade image carousel logic, update styling only
- Gradient overlay on images: transparent → `rgba(26,35,24,0.85)` bottom
- Log In: border 1.5px solid cream, cream text, transparent bg, borderRadius 2, py 14
- Create Account: bg gold, charcoal text, borderRadius 2, py 14
- Remove text logo — use PNG only

### 2. Home Screen (Authenticated)
**Target:** Feels like checking into a hotel app — calm, premium, personal.
- Background: `#FAF4ED`
- Top: Round logo PNG 40px, left-aligned
- Greeting: "Good morning, [first name]." — Cormorant Garamond, charcoal, 28px, light
- Sub-label: "YOUR NEXT VISIT" — Jost, gold, uppercase, tracking-widest
- Image carousel: full-width, edge to edge, no card border radius
- Quick Actions: "BOOK A VISIT" and "MY PASS" — charcoal bg, cream text, square, full width
- Remove navy entirely

### 3. Booking / Session Select Screen
**Target:** Match web booking section. Cards with session options.
- Session cards: `border: 1px solid rgba(42,39,36,0.15)`, bg white, `borderRadius: 2`
- Selected card: `border: 2px solid #C49F58`, bg `rgba(196,159,88,0.06)`
- Session name: Cormorant Garamond, charcoal, 20px
- Price: Jost, gold, right-aligned
- Duration + passes: Jost, charcoal 50%, small
- CTA: "CONTINUE" — charcoal bg, cream text, Jost uppercase, borderRadius 2, full width

### 4. My Pass Screen
**Target:** Clean, minimal. Like a boarding pass for a suite.
- Top: MASLOW Round logo, small, centered
- QR code: centered, generous white space, no card border
- Below QR: session type, date/time, "Scan to enter" — Jost uppercase gold
- Member number: charcoal 30% opacity, bottom
- Background: cream (`#FAF4ED`)
- No navy, no blue

### 5. Auth Screens (Login / Signup)
**Target:** Minor polish only — the gradient is already decent.
- Replace blue buttons → charcoal
- Replace rounded inputs → `borderRadius: 2`
- Headlines: Cormorant Garamond ("Welcome back." / "Create your account.")
- Keep warm gradient background

### 6. Tab Bar
**Target:** Minimal, cream background.
- Background: `#FAF4ED`
- Active: gold `#C49F58`
- Inactive: charcoal 30% opacity
- Border top: `1px solid rgba(42,39,36,0.1)`
- Tabs: Home, Book, Pass, Profile — max 4
- Move Events, History, Transfer Credits, Control, Settings → into Profile

---

## Font Setup

```bash
npx expo install @expo-google-fonts/cormorant-garamond
npx expo install @expo-google-fonts/jost
```

**In `_layout.tsx`:**
```typescript
import { useFonts, CormorantGaramond_400Regular, CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { Jost_400Regular, Jost_600SemiBold } from '@expo-google-fonts/jost';

const [fontsLoaded] = useFonts({
  CormorantGaramond_400Regular,
  CormorantGaramond_300Light,
  Jost_400Regular,
  Jost_600SemiBold,
});
if (!fontsLoaded) return null;
```

**Usage:**
```typescript
fontFamily: 'CormorantGaramond_300Light'  // headlines
fontFamily: 'Jost_400Regular'             // body/labels
fontFamily: 'Jost_600SemiBold'            // uppercase labels
```

---

## Execution Order

Do these in order. Don't skip ahead. Each screen should build and look right before moving on.

1. Install fonts + update `theme/colors.ts` with canonical tokens above
2. Tab bar (quick win, visible everywhere)
3. Home — Unauthenticated
4. Home — Authenticated
5. Booking / Session Select
6. My Pass
7. Auth screens (polish only)

---

## Do NOT Touch in This Sprint
- No new features
- Do not touch Stripe payment flow (separate sprint)
- Do not change navigation structure
- Do not add adaptive icon (Phase 2)
- Do not redesign Profile or Settings

---

## North Star
> "Someone who books a suite on the website and then opens the app should feel like they never left."
