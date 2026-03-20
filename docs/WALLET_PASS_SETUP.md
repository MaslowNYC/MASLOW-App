# Apple Wallet Pass Setup for Maslow NYC

This document explains how to set up Apple Wallet pass generation for the Maslow NYC app.

## Overview

The wallet pass feature allows members to add their Maslow membership card to Apple Wallet. The pass displays:
- Maslow NYC logo
- Member name
- Member number
- Membership tier
- QR code containing the user ID (for scanning at entry)

## Prerequisites

1. **Apple Developer Account** with Pass Type ID capability
2. **Pass Type ID Certificate** (.p12 file) from Apple Developer Portal
3. **Supabase project** with Edge Functions enabled

## Certificate Setup

### 1. Create Pass Type ID (Apple Developer Portal)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to Certificates, Identifiers & Profiles
3. Create a new Pass Type ID: `pass.nyc.maslow`
4. Create a Pass Type ID Certificate for this identifier
5. Download the certificate and export as .p12 with password

### 2. Place Certificate

Place your .p12 file at:
```
~/Desktop/maslow-pass.p12
```

### 3. Run Setup Script

```bash
cd scripts
./setup-wallet-pass.sh ~/Desktop/maslow-pass.p12 maslow2026
```

This will output the Supabase secrets you need to configure.

## Supabase Configuration

### Set Secrets

Run these commands in your Supabase project:

```bash
# P12 certificate (base64 encoded)
supabase secrets set APPLE_WALLET_P12_BASE64='<base64-encoded-p12>'

# P12 password
supabase secrets set APPLE_WALLET_P12_PASSWORD='maslow2026'

# Apple WWDR certificate (PEM format)
supabase secrets set APPLE_WWDR_CERT_PEM='<pem-certificate>'
```

### Deploy Edge Function

```bash
supabase functions deploy generate-wallet-pass
```

## Testing

### Local Testing with Node.js

To generate a test pass locally:

```bash
cd scripts
npm install node-forge archiver
node sign-wallet-pass.js ~/Desktop/maslow-pass.p12 maslow2026 test-pass.pkpass
```

Then AirDrop or email the .pkpass file to your iPhone.

### Testing in App

1. Open the Maslow app
2. Go to the Pass tab
3. Tap "Add to Apple Wallet"
4. The pass should open in Apple Wallet for adding

## Pass Configuration

The pass is configured with:

| Field | Value |
|-------|-------|
| Pass Type ID | `pass.nyc.maslow` |
| Team ID | `KA74TN36V2` |
| Organization | Maslow NYC |
| Style | Generic (membership card) |
| Colors | Charcoal background, gold labels, white text |

## Troubleshooting

### "Unable to Add Pass" Error

1. Check that the certificate is valid and not expired
2. Verify the Pass Type ID matches your certificate
3. Ensure the Team ID is correct
4. Check Supabase function logs: `supabase functions logs generate-wallet-pass`

### Pass Not Showing in Wallet

1. The pass must be properly signed with PKCS#7
2. All required files must be present (pass.json, icon.png, manifest.json, signature)
3. SHA-1 hashes in manifest.json must match actual file contents

### Certificate Issues

If you get certificate errors:

```bash
# Check certificate details
openssl pkcs12 -in maslow-pass.p12 -info -nokeys

# Export private key
openssl pkcs12 -in maslow-pass.p12 -nocerts -out key.pem

# Export certificate
openssl pkcs12 -in maslow-pass.p12 -clcerts -nokeys -out cert.pem
```

## Files

| File | Purpose |
|------|---------|
| `supabase/functions/generate-wallet-pass/index.ts` | Edge function to generate passes |
| `scripts/setup-wallet-pass.sh` | Certificate setup helper |
| `scripts/sign-wallet-pass.js` | Local pass signing tool |
| `app/(tabs)/pass.tsx` | Pass screen with wallet button |
| `app/(tabs)/profile.tsx` | Profile page with wallet button |

## Security Notes

- Never commit certificates or secrets to git
- The .p12 password should be stored securely
- User IDs in QR codes should be UUIDs (not guessable)
- Passes are tied to specific devices once added
