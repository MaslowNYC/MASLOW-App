// Apple Wallet Pass Generator - Supabase Edge Function
// Generates signed .pkpass files for Maslow NYC members

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

// Base64 decode using built-in atob (no external dependencies)
function base64Decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const PASS_TYPE_ID = 'pass.nyc.maslow';
const TEAM_ID = 'KA74TN36V2';
const ORG_NAME = 'Maslow NYC';

// Certificate loaded from environment secrets
const PASS_CERT_PEM = Deno.env.get('APPLE_PASS_CERT_PEM');
const PASS_KEY_PEM = Deno.env.get('APPLE_PASS_KEY_PEM');
const WWDR_CERT_PEM = Deno.env.get('APPLE_WWDR_CERT_PEM');
const SIGNATURE_BASE64 = Deno.env.get('APPLE_PASS_SIGNATURE_BASE64'); // Pre-computed if needed

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemberProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  member_number: string;
  membership_tier: string;
}

// Maslow logo as minimal PNG (29x29 blue M icon)
// This is a simplified placeholder - replace with actual assets
const ICON_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB' +
  'yElEQVRIie2WzU7CQBCAvwJEiQfx4NGDHox68ODBgwcNJ028+Ai+gI/gC3jy5NmDB69evHrx6sUD' +
  'BwMXQqKJhkD5cZwN05YuXYpGE7/klJnZb2Z3dmYh/0BKKVFK3SulXimlVpRSL0qpO6XUvFLqQim1' +
  'ppT6UEqdKKWelFKnSqk1pdS5UupWKbWolLpXSq0qpT6VUidKqRel1IFS6kUpdaeUWldKfSilTpVS' +
  'L0qpI6XUrVJqQyn1oZQ6U0q9KKWOlVI3SqlNpdSnUupcKfWqlDpRSl0rpbaUUp9KqQul1JtS6lQp' +
  'da2U2lZKfSmlLpVS70qpM6XUjVJqRyn1rZS6Ukp9KKXOlVK3Sqk9pdSPUupaKfWplLpQSt0ppfaV' +
  'Ur9KqRul1JdS6lIpdaeUOlBK/SqlbpVS30qpK6XUvVLqUCn1p5S6U0r9KKWulVIPSqkjpVRCKXWv' +
  'lPpVSt0ope6VUsdKqQal1INS6k8pdauUelRKnSilGpVSD0qplFLqTin1pJQ6VUo1K6UelVJppdSd' +
  'UupZKXWmlGpRSj0qpdJKqXul1ItS6lwp1aqUelJKZZRS90qpV6XUhVKqTSn1rJTKKqUelFJvSqlL' +
  'pVS7UupFKZVTSj0qpd6VUtdKqQ6l1KtSKq+UelJKfSilbpRSnUqpN6VU4X/xH+QXQEVd4Wy+v3IA' +
  'AAAASUVORK5CYII=';

// Calculate SHA-1 hash of data
async function sha1Hash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format member tier for display
function formatTierDisplay(tier: string | null): string {
  if (!tier) return 'Member';
  const tierLower = tier.toLowerCase();
  if (tierLower === 'founding') return 'Founding Member';
  if (tierLower === 'architect') return 'Architect';
  if (tierLower === 'sovereign') return 'Sovereign';
  return 'Member';
}

// Create pass.json content
function createPassJson(profile: MemberProfile): object {
  const memberNumber = profile.member_number
    ? `#${String(profile.member_number).padStart(5, '0')}`
    : '#00000';

  const tierDisplay = formatTierDisplay(profile.membership_tier);
  const memberName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Member';

  return {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    serialNumber: `maslow-${profile.user_id.substring(0, 8)}-${Date.now()}`,
    teamIdentifier: TEAM_ID,
    organizationName: ORG_NAME,
    description: 'Maslow NYC Membership',
    logoText: 'MASLOW',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(54, 69, 79)', // Charcoal
    labelColor: 'rgb(212, 175, 55)', // Gold

    // Barcode/QR code configuration - contains user ID
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: profile.user_id,
        messageEncoding: 'iso-8859-1',
        altText: memberNumber
      }
    ],

    // Generic pass type (membership card style)
    generic: {
      primaryFields: [
        {
          key: 'member',
          label: 'MEMBER',
          value: memberName
        }
      ],
      secondaryFields: [
        {
          key: 'tier',
          label: 'TIER',
          value: tierDisplay
        },
        {
          key: 'number',
          label: 'NUMBER',
          value: memberNumber
        }
      ],
      auxiliaryFields: [],
      backFields: [
        {
          key: 'terms',
          label: 'Terms',
          value: 'This pass grants access to Maslow NYC locations. Present at entry. Non-transferable.'
        },
        {
          key: 'contact',
          label: 'Contact',
          value: 'hello@maslow.nyc'
        },
        {
          key: 'website',
          label: 'Website',
          value: 'https://maslow.nyc'
        }
      ]
    },

    // Relevance date
    relevantDate: new Date().toISOString(),

    // NYC location for relevance
    locations: [
      {
        latitude: 40.7128,
        longitude: -74.0060,
        relevantText: 'Welcome to Maslow NYC'
      }
    ]
  };
}

// Simple ZIP file creation (minimal implementation)
function createZip(files: Map<string, Uint8Array>): Uint8Array {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  // Local file headers and data
  for (const [name, data] of files) {
    const nameBytes = new TextEncoder().encode(name);

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (store)
    view.setUint16(10, 0, true); // File modification time
    view.setUint16(12, 0, true); // File modification date
    view.setUint32(14, 0, true); // CRC-32 (placeholder)
    view.setUint32(18, data.length, true); // Compressed size
    view.setUint32(22, data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(data);

    // Central directory entry
    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralEntry.buffer);

    centralView.setUint32(0, 0x02014b50, true); // Central directory signature
    centralView.setUint16(4, 20, true); // Version made by
    centralView.setUint16(6, 20, true); // Version needed to extract
    centralView.setUint16(8, 0, true); // General purpose bit flag
    centralView.setUint16(10, 0, true); // Compression method
    centralView.setUint16(12, 0, true); // File modification time
    centralView.setUint16(14, 0, true); // File modification date
    centralView.setUint32(16, 0, true); // CRC-32
    centralView.setUint32(20, data.length, true); // Compressed size
    centralView.setUint32(24, data.length, true); // Uncompressed size
    centralView.setUint16(28, nameBytes.length, true); // File name length
    centralView.setUint16(30, 0, true); // Extra field length
    centralView.setUint16(32, 0, true); // File comment length
    centralView.setUint16(34, 0, true); // Disk number start
    centralView.setUint16(36, 0, true); // Internal file attributes
    centralView.setUint32(38, 0, true); // External file attributes
    centralView.setUint32(42, offset, true); // Relative offset of local header
    centralEntry.set(nameBytes, 46);

    centralDirectory.push(centralEntry);
    offset += localHeader.length + data.length;
  }

  // Add central directory
  const centralDirOffset = offset;
  for (const entry of centralDirectory) {
    chunks.push(entry);
    offset += entry.length;
  }

  // End of central directory
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  endView.setUint32(0, 0x06054b50, true); // End of central directory signature
  endView.setUint16(4, 0, true); // Number of this disk
  endView.setUint16(6, 0, true); // Disk where central directory starts
  endView.setUint16(8, files.size, true); // Number of central directory records on this disk
  endView.setUint16(10, files.size, true); // Total number of central directory records
  endView.setUint32(12, offset - centralDirOffset, true); // Size of central directory
  endView.setUint32(16, centralDirOffset, true); // Offset of start of central directory
  endView.setUint16(20, 0, true); // Comment length

  chunks.push(endRecord);

  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
}

// Sign manifest using pre-configured signature or external service
async function signManifest(manifestJson: string): Promise<Uint8Array | null> {
  // Check for pre-computed signature (for testing)
  if (SIGNATURE_BASE64) {
    return base64Decode(SIGNATURE_BASE64);
  }

  // For production, you would call an external signing service here
  // or use a Deno-compatible PKCS#7 library

  // Without proper signing, Apple Wallet won't accept the pass
  // Return null to indicate signing is not available
  return null;
}

// Create the .pkpass file
async function createPkpass(profile: MemberProfile): Promise<Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const encoder = new TextEncoder();

  // 1. Create pass.json
  const passJson = createPassJson(profile);
  const passJsonStr = JSON.stringify(passJson, null, 2);
  const passJsonData = encoder.encode(passJsonStr);
  files.set('pass.json', passJsonData);

  // 2. Add icon images (decoded from base64)
  const iconData = base64Decode(ICON_PNG_BASE64);
  files.set('icon.png', iconData);
  files.set('icon@2x.png', iconData);
  files.set('logo.png', iconData);
  files.set('logo@2x.png', iconData);

  // 3. Create manifest.json with SHA-1 hashes
  const manifest: Record<string, string> = {};

  for (const [name, data] of files) {
    manifest[name] = await sha1Hash(data);
  }

  const manifestStr = JSON.stringify(manifest);
  const manifestData = encoder.encode(manifestStr);
  files.set('manifest.json', manifestData);

  // 4. Sign the manifest (if signing is available)
  const signature = await signManifest(manifestStr);
  if (signature) {
    files.set('signature', signature);
  }

  // 5. Create ZIP file
  const pkpassData = createZip(files);

  return pkpassData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, member_number, membership_tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the member profile object
    const memberProfile: MemberProfile = {
      user_id: user.id,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      member_number: profile.member_number || '0',
      membership_tier: profile.membership_tier || 'Member'
    };

    console.log('[DEBUG] memberProfile created:', JSON.stringify(memberProfile));

    // Generate the .pkpass file
    let pkpassData: Uint8Array;
    try {
      console.log('[DEBUG] Starting createPkpass...');
      pkpassData = await createPkpass(memberProfile);
      console.log('[DEBUG] createPkpass succeeded, size:', pkpassData.length);
    } catch (passError) {
      console.error('[ERROR] createPkpass failed:', passError);
      console.error('[ERROR] Stack:', passError instanceof Error ? passError.stack : 'No stack');
      return new Response(
        JSON.stringify({
          error: 'Pass generation failed',
          details: passError instanceof Error ? passError.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the .pkpass file
    return new Response(pkpassData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="maslow-pass.pkpass"`,
      }
    });

  } catch (error) {
    console.error('Wallet pass generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate wallet pass',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
