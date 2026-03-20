#!/usr/bin/env node
/**
 * Apple Wallet Pass Signing Tool
 *
 * This script generates a properly signed .pkpass file that can be used
 * as a template or for testing. Run this locally with Node.js.
 *
 * Usage:
 *   node sign-wallet-pass.js <p12_file> <password> <output_dir>
 *
 * Requirements:
 *   npm install node-forge archiver
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const forge = require('node-forge');
const archiver = require('archiver');

const PASS_TYPE_ID = 'pass.nyc.maslow';
const TEAM_ID = 'KA74TN36V2';
const ORG_NAME = 'Maslow NYC';

// Apple WWDR G4 certificate URL
const WWDR_CERT_URL = 'https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer';

async function downloadWWDRCert() {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(WWDR_CERT_URL, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const derBuffer = Buffer.concat(chunks);
        // Convert DER to PEM
        const pem = forge.pki.certificateToPem(
          forge.pki.certificateFromAsn1(
            forge.asn1.fromDer(derBuffer.toString('binary'))
          )
        );
        resolve(pem);
      });
      res.on('error', reject);
    });
  });
}

function loadP12(p12Path, password) {
  const p12Buffer = fs.readFileSync(p12Path);
  const p12Der = p12Buffer.toString('binary');
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certificate = certBags[forge.pki.oids.certBag]?.[0]?.cert;

  if (!privateKey || !certificate) {
    throw new Error('Could not extract key/certificate from P12 file');
  }

  return { privateKey, certificate };
}

function sha1(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}

function createPassJson(memberName, memberNumber, tier, userId) {
  return {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    serialNumber: `maslow-${userId}-${Date.now()}`,
    teamIdentifier: TEAM_ID,
    organizationName: ORG_NAME,
    description: 'Maslow NYC Membership',
    logoText: 'MASLOW',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(54, 69, 79)',
    labelColor: 'rgb(212, 175, 55)',
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: userId,
        messageEncoding: 'iso-8859-1',
        altText: memberNumber
      }
    ],
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
          value: tier
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
    locations: [
      {
        latitude: 40.7128,
        longitude: -74.0060,
        relevantText: 'Welcome to Maslow NYC'
      }
    ]
  };
}

function signManifest(manifestJson, privateKey, certificate, wwdrCert) {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, 'utf8');
  p7.addCertificate(certificate);
  p7.addCertificate(forge.pki.certificateFromPem(wwdrCert));
  p7.addSigner({
    key: privateKey,
    certificate: certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data
      },
      {
        type: forge.pki.oids.messageDigest
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date()
      }
    ]
  });

  p7.sign({ detached: true });

  const derBuffer = forge.asn1.toDer(p7.toAsn1());
  return Buffer.from(derBuffer.getBytes(), 'binary');
}

async function createPkpass(outputPath, p12Path, password, memberData) {
  console.log('Loading P12 certificate...');
  const { privateKey, certificate } = loadP12(p12Path, password);

  console.log('Downloading Apple WWDR certificate...');
  const wwdrCert = await downloadWWDRCert();

  // Create pass content
  const passJson = createPassJson(
    memberData.name || 'Test Member',
    memberData.number || '#00001',
    memberData.tier || 'Founding Member',
    memberData.userId || 'test-user-id'
  );
  const passJsonStr = JSON.stringify(passJson, null, 2);

  // Get icon from assets (placeholder - use actual assets in production)
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  let iconData;
  if (fs.existsSync(iconPath)) {
    iconData = fs.readFileSync(iconPath);
  } else {
    // Create minimal placeholder icon
    console.log('Warning: icon.png not found, using placeholder');
    iconData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
      'W0lEQVRIiWNgGAWjYBSMglFACmBkYGBg+P//PwMDAwMjIyMDw3/i9UAGsOngf6IBOIHxPxrg+A8V' +
      'A9Y0RoYGBoYGhv+MjIwMDP+Jt4sYMNoXo2AUjIJRQH8AACS0BxX5xFdAAAAAAElFTkSuQmCC',
      'base64'
    );
  }

  // Create manifest
  const manifest = {
    'pass.json': sha1(passJsonStr),
    'icon.png': sha1(iconData),
    'icon@2x.png': sha1(iconData),
    'logo.png': sha1(iconData),
    'logo@2x.png': sha1(iconData)
  };
  const manifestStr = JSON.stringify(manifest);

  console.log('Signing manifest...');
  const signature = signManifest(manifestStr, privateKey, certificate, wwdrCert);

  // Create ZIP archive
  console.log('Creating .pkpass file...');
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { store: true });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);
      resolve(outputPath);
    });

    archive.on('error', reject);
    archive.pipe(output);

    archive.append(passJsonStr, { name: 'pass.json' });
    archive.append(iconData, { name: 'icon.png' });
    archive.append(iconData, { name: 'icon@2x.png' });
    archive.append(iconData, { name: 'logo.png' });
    archive.append(iconData, { name: 'logo@2x.png' });
    archive.append(manifestStr, { name: 'manifest.json' });
    archive.append(signature, { name: 'signature' });

    archive.finalize();
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Apple Wallet Pass Signing Tool');
    console.log('');
    console.log('Usage: node sign-wallet-pass.js <p12_file> <password> [output_file]');
    console.log('');
    console.log('Example:');
    console.log('  node sign-wallet-pass.js ~/Desktop/maslow-pass.p12 maslow2026 test-pass.pkpass');
    process.exit(1);
  }

  const p12Path = args[0];
  const password = args[1];
  const outputPath = args[2] || 'maslow-pass.pkpass';

  if (!fs.existsSync(p12Path)) {
    console.error(`Error: P12 file not found: ${p12Path}`);
    process.exit(1);
  }

  try {
    await createPkpass(outputPath, p12Path, password, {
      name: 'Test Member',
      number: '#00001',
      tier: 'Founding Member',
      userId: 'test-user-123'
    });

    console.log('');
    console.log('Success! You can now:');
    console.log('1. AirDrop the .pkpass file to your iPhone to test');
    console.log('2. Email the .pkpass file to yourself');
    console.log('3. Use the signature for your edge function');
  } catch (error) {
    console.error('Error creating pass:', error.message);
    process.exit(1);
  }
}

main();
