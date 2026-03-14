# CLINE TASK: Fix Sample Picker UX + Remove Hardcoded Sample Limits

## File to edit
`app/(tabs)/book/[locationId].tsx`

---

## Context

The booking flow has a sample picker step (`step === 'samples'`). The `durationOptions`
state is already populated from the DB (`session_types` table) and each option has a
`samples` field. Current DB limits:

- Quick Stop (10 min) → 1 sample
- Standard (15 min) → 3 samples
- Comfortable (30 min) → 5 samples
- Extended (60 min) → 5 samples

---

## Problem 1 — Hardcoded maxSamples

Inside `{step === 'samples' && (() => {` find this line:

```ts
const maxSamples = bookingData.duration === 10 ? 2 : 5;
```

**Fix:** Replace with a DB-driven lookup:

```ts
const selectedOption = durationOptions.find(o => o.minutes === bookingData.duration);
const maxSamples = selectedOption?.samples ?? 5;
```

---

## Problem 2 — Confusing subtitle text

Current subtitle:
```
"Your Quick Visit favorites are pre-selected. Choose up to 5 samples total."
```

Issues:
- "Quick Visit favorites" is internal jargon
- Doesn't tell user how many picks they have left

**Fix:** Replace subtitle logic with:

```tsx
const preSelected = bookingData.preferences.samples.length;
const remaining = maxSamples - preSelected;

{preSelected > 0
  ? `${preSelected} of your saved preferences are already selected. You have ${remaining} more to pick.`
  : `Choose up to ${maxSamples} complimentary sample${maxSamples !== 1 ? 's' : ''} — premium single-use packets to take with you.`
}
```

---

## Problem 3 — canSelect uses stale maxSamples

```ts
const canSelect = bookingData.preferences.samples.length < maxSamples;
```

No change needed here — automatically correct once Problem 1 is fixed.

---

## Problem 4 — Upgrade hint is hardcoded and inaccurate

Current code:
```tsx
{bookingData.duration === 10 && bookingData.preferences.samples.length === 2 && (
  <Text>Book 15+ minutes to get 5 samples instead of 2!</Text>
)}
```

Problems: only triggers at duration===10, says "5 samples" for 15min (wrong, it's 3).

**Fix:**
```tsx
{bookingData.preferences.samples.length === maxSamples && maxSamples < 5 && (
  <View style={styles.samplesUpgradeHint}>
    <Ionicons name="arrow-up-circle" size={20} color={colors.gold} />
    <Text style={styles.samplesUpgradeText}>
      Book a longer session to unlock more samples — up to 5 for 30+ minutes.
    </Text>
  </View>
)}
```

---

## Problem 5 — Section title

```tsx
<Text style={styles.sectionTitle}>Select Your Samples ({maxSamples} Included)</Text>
```

No change needed — automatically correct once Problem 1 is fixed.

---

## Summary of changes

1. Replace hardcoded `maxSamples` with DB-driven lookup from `durationOptions`
2. Update subtitle to show pre-selected count + remaining picks
3. Update upgrade hint to be dynamic and accurate

## Do NOT change
- Grid layout, styles, or sample card components
- The `useEffect` that trims samples on duration change (already correct)
- Anything outside the `step === 'samples'` block
- `BookingData` type or `durationOptions` state

## Test after
- Quick Stop (10 min) → 1 sample limit
- Standard (15 min) → 3 sample limit
- With 2 pre-selected → subtitle: "2 of your saved preferences are already selected. You have 1 more to pick."
- Fill all samples → upgrade hint appears with accurate text
