# Maslow App Redesign Plan
*Written: March 10, 2026 — execute after SCORE call Wednesday*

---

## The Problem in One Sentence
The app has the right bones but feels like a developer built it — 
the website now looks like a luxury brand, the app doesn't match.

---

## What "Match the Site" Actually Means

The website uses:
- Dark moss gradient heroes: `#1a2318 → #2d3b28`
- Cream backgrounds: `#FAF4ED`
- Charcoal text: `#2A2724`
- Gold accents: `#C49F58`
- Serif headings: Cormorant Garamond
- Sans body: Jost
- Square aesthetic (borderRadius: 2px, not rounded-xl)
- Dot texture overlay on dark sections
- Wave transitions between sections

The app currently uses:
- Navy blue (`#286BCD`) as primary — wrong, that's the logo color not the brand color
- Generic rounded cards
- Standard sans-serif throughout (no serif hierarchy)
- Blue gradients in the wrong places
- Tab bar with generic icons

---

## What Needs to Change (Prioritized)

### Priority 1 — Colors (biggest visual impact, fastest fix)
Update `src/theme/colors.ts`:
- Replace `navy` as primary action color → use `charcoal` (#2A2724) for buttons
- Add `moss` (#4A5C3A) and `mossDark` (#1a2318)
- Keep gold as accent ✅ (already correct)
- Keep cream as background ✅ (already correct)
- Remove blue from surfaces — blue is ONLY for the logo

### Priority 2 — Typography
Add Cormorant Garamond to the app:
- Use for screen titles and card headings (the "moment" text)
- Keep system sans for body/functional text
- This single change will make the app feel 3x more premium

### Priority 3 — Tab Bar
Current tab bar: generic icons, probably blue tint
New tab bar:
- Background: `#FAF4ED` (cream) with subtle top border in gold at 20% opacity
- Active icon: gold (`#C49F58`)
- Inactive: charcoal at 40% opacity
- Labels: uppercase, tracking-wider, tiny — or no labels at all (icon only, cleaner)

### Priority 4 — Home Screen Hero
The home screen already has a carousel of suite images — good.
Needs:
- Dark moss gradient overlay on the image (not black)
- Serif heading: "Where the city can wait." 
- Replace blue CTA button → charcoal with gold text

### Priority 5 — Cards & Surfaces  
Replace rounded-xl / rounded-2xl with borderRadius 4 (almost square)
White cards stay white but get a 1px border: `rgba(42,39,36,0.12)` instead of shadows
This immediately reads as more architectural/intentional

### Priority 6 — Booking Flow (do this last)
Wire Stripe into the existing flow.
Add sample picker (same logic as website).
Session types from DB instead of hardcoded.

---

## What NOT to Change
- Navigation structure — it works fine
- Auth flow — works fine
- Supabase integration — works fine  
- The suite image carousel on home — keep it, it's good
- QR pass screen — works, just restyle the colors

---

## The Cline Brief Strategy
Do this in three separate Cline sessions, not one:

**Session A** — Theme only (colors + borderRadius)
No screen changes. Just update `src/theme/colors.ts` and do a global find/replace of 
`rounded-` style values and blue color references. Build and check.

**Session B** — Typography + Tab Bar
Add Cormorant Garamond. Restyle tab bar. Update home screen hero text.

**Session C** — Booking flow parity with website
Wire Stripe. Add session types from DB. Add sample picker.

---

## The Goal
Someone who uses the app and visits the site should feel 
like they're in the same world — same brand, same confidence, 
same "this is not a startup side project" energy.

---
*Do not start this until after Wednesday's SCORE call.*
