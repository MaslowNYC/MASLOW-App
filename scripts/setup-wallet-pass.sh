#!/bin/bash
# Apple Wallet Pass Setup Script
# This script helps configure the Supabase secrets needed for wallet pass generation

set -e

echo "=== Maslow NYC Apple Wallet Pass Setup ==="
echo ""

# Configuration
P12_FILE="${1:-$HOME/Desktop/maslow-pass.p12}"
P12_PASSWORD="${2:-maslow2026}"

# Check if P12 file exists
if [ ! -f "$P12_FILE" ]; then
    echo "Error: Certificate file not found at $P12_FILE"
    echo ""
    echo "Please place your .p12 certificate at ~/Desktop/maslow-pass.p12"
    echo "or provide the path as the first argument:"
    echo "  ./setup-wallet-pass.sh /path/to/certificate.p12 password"
    exit 1
fi

echo "1. Converting P12 certificate to base64..."
P12_BASE64=$(base64 -i "$P12_FILE")
echo "   Done! (${#P12_BASE64} characters)"
echo ""

echo "2. Downloading Apple WWDR Intermediate Certificate..."
# Apple WWDR G4 certificate (valid for Wallet passes)
WWDR_URL="https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer"
WWDR_TMP="/tmp/AppleWWDRCAG4.cer"
curl -sS -o "$WWDR_TMP" "$WWDR_URL"

# Convert DER to PEM
WWDR_PEM=$(openssl x509 -inform DER -in "$WWDR_TMP" -outform PEM)
echo "   Done!"
echo ""

echo "3. Setting Supabase secrets..."
echo ""
echo "Run the following commands to configure your Supabase project:"
echo ""
echo "# Set the P12 certificate (base64 encoded)"
echo "supabase secrets set APPLE_WALLET_P12_BASE64='$P12_BASE64'"
echo ""
echo "# Set the P12 password"
echo "supabase secrets set APPLE_WALLET_P12_PASSWORD='$P12_PASSWORD'"
echo ""
echo "# Set the Apple WWDR certificate (PEM format)"
cat << 'EOF'
supabase secrets set APPLE_WWDR_CERT='
EOF
echo "$WWDR_PEM"
echo "'"
echo ""

# Also save to a file for reference
SECRETS_FILE="/tmp/wallet-pass-secrets.txt"
cat > "$SECRETS_FILE" << EOF
# Apple Wallet Pass Secrets for Supabase
# Generated on $(date)

APPLE_WALLET_P12_BASE64=$P12_BASE64

APPLE_WALLET_P12_PASSWORD=$P12_PASSWORD

APPLE_WWDR_CERT=$WWDR_PEM
EOF

echo "Secrets have been saved to: $SECRETS_FILE"
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Run 'supabase secrets set' commands above (or use the Supabase dashboard)"
echo "2. Deploy the edge function: supabase functions deploy generate-wallet-pass"
echo "3. Test by tapping 'Add to Apple Wallet' in the app"
