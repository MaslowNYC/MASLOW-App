# NFC WORKSHOP DOOR LOCK — BUILD BRIEF
Date: March 15, 2026
Purpose: Prototype the Maslow suite door lock system at workshop scale
This IS Prototype 3B (Door Lock + Security) — just smaller and cheaper
Total cost: ~$45-50
Build time: ~2-3 hours

---

## WHAT YOU'RE BUILDING

An NFC-controlled door lock for your workshop.
Tap your phone or a card → door unlocks for 5 seconds → relocks automatically.
Unknown card → nothing happens, access logged to Supabase.
Everything runs on an ESP32 that talks to Supabase Realtime.

---

## PARTS LIST

Order all from Amazon. Search exact names.

| Part | Search Term | Price |
|------|-------------|-------|
| NFC module | "PN532 NFC RFID module I2C" | ~$8 |
| Electric strike lock | "12V electric strike lock door fail secure" | ~$25 |
| Relay module | "5V single channel relay module Arduino" | ~$5 |
| 12V 2A power supply | "12V 2A DC power adapter 5.5mm" | ~$10 |
| ESP32 dev board | "ESP32 38-pin development board" | ~$8 |
| Jumper wires | Already have these |
| NFC sticker tags (optional) | "NFC sticker tags NTAG215" ~$8/10 pack | optional |

Note: Your phone already works as an NFC card via Google Pay / Apple Pay wallet.
Any contactless card (credit card, OMNY card, key fob) also works.

---

## WIRING

### PN532 NFC Module → ESP32
Connect via I2C:
- VCC → 3.3V (ESP32 pin labeled 3V3)
- GND → GND
- SDA → GPIO 21
- SCL → GPIO 22

Set the PN532 DIP switches to I2C mode:
- Switch 1: OFF
- Switch 2: ON

### Relay Module → ESP32
- VCC → 5V (ESP32 VIN pin)
- GND → GND
- IN → GPIO 4

### Electric Strike → Relay
- One relay output terminal → 12V power supply positive
- Other relay output terminal → strike lock positive wire
- 12V power supply negative → strike lock negative wire

### Power
- USB cable → ESP32 (for programming and 3.3V/5V logic)
- 12V adapter → barrel jack → relay/strike circuit (for the lock itself)

---

## CODE

Install Arduino IDE. Add ESP32 board support.
Install these libraries via Library Manager:
- "PN532" by Adafruit
- "PN532_I2C" (comes with Adafruit PN532 library)

Create new sketch, paste this:

```cpp
#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>

PN532_I2C pn532i2c(Wire);
PN532 nfc(pn532i2c);

#define RELAY_PIN 4
#define UNLOCK_DURATION 5000  // 5 seconds

// Add your allowed card UIDs here after scanning
// Format: {0xXX, 0xXX, 0xXX, 0xXX}
uint8_t allowedCards[][4] = {
  // Add your card UIDs here after step 1 below
};
int numAllowedCards = 0;  // Update this when you add cards

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // HIGH = locked (relay off)
  
  Wire.begin(21, 22);  // SDA=21, SCL=22
  nfc.begin();
  
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("ERROR: PN532 not found. Check wiring.");
    while (1);
  }
  
  Serial.print("Found PN532, firmware version: ");
  Serial.println((versiondata >> 16) & 0xFF);
  
  nfc.SAMConfig();
  Serial.println("Ready. Tap a card.");
}

void loop() {
  uint8_t uid[7];
  uint8_t uidLength;
  
  bool cardFound = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 500);
  
  if (cardFound) {
    Serial.print("Card UID: ");
    for (int i = 0; i < uidLength; i++) {
      Serial.print(uid[i], HEX);
      if (i < uidLength - 1) Serial.print(":");
    }
    Serial.println();
    
    if (isAllowed(uid, uidLength)) {
      Serial.println("ACCESS GRANTED - Unlocking");
      unlock();
    } else {
      Serial.println("ACCESS DENIED");
    }
    
    delay(1000);  // Debounce
  }
}

bool isAllowed(uint8_t* uid, uint8_t uidLength) {
  for (int i = 0; i < numAllowedCards; i++) {
    bool match = true;
    for (int j = 0; j < 4; j++) {
      if (uid[j] != allowedCards[i][j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

void unlock() {
  digitalWrite(RELAY_PIN, LOW);   // LOW = relay on = strike unlocked
  delay(UNLOCK_DURATION);
  digitalWrite(RELAY_PIN, HIGH);  // HIGH = relay off = strike locked
  Serial.println("Relocked.");
}
```

---

## STEP 1 — FIND YOUR CARD'S UID

Before adding allowed cards, you need to scan them to get their UIDs.

1. Upload the code above as-is (numAllowedCards = 0, empty array)
2. Open Serial Monitor (115200 baud)
3. Tap your phone/card/fob against the PN532
4. Serial Monitor prints: "Card UID: XX:XX:XX:XX"
5. Write that UID down

Then update the code:
```cpp
uint8_t allowedCards[][4] = {
  {0xXX, 0xXX, 0xXX, 0xXX},  // Your phone
  {0xYY, 0xYY, 0xYY, 0xYY},  // Cat's card
};
int numAllowedCards = 2;
```

Re-upload. Now those cards unlock the door.

---

## STEP 2 — ADD SUPABASE LOGGING (optional but worth doing)

This is the step that makes it a real Maslow prototype, not just a toy.

Install "WiFi" and "HTTPClient" libraries (built into ESP32 core).
Install "ArduinoJson" via Library Manager.

Add to the top of your sketch:
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* supabaseUrl = "https://hrfmphkjeqcwhsfvzfvw.supabase.co";
const char* supabaseKey = "YOUR_SUPABASE_ANON_KEY";
```

Add this function:
```cpp
void logAccess(String uid, bool granted) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/access_logs";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  StaticJsonDocument<200> doc;
  doc["card_uid"] = uid;
  doc["granted"] = granted;
  doc["location"] = "workshop";
  doc["created_at"] = "now()";
  
  String body;
  serializeJson(doc, body);
  
  int responseCode = http.POST(body);
  Serial.print("Supabase log: ");
  Serial.println(responseCode);
  http.end();
}
```

Call it in your loop after the access check:
```cpp
logAccess(uidString, isAllowed(uid, uidLength));
```

The access_logs table already exists in your Supabase project.

---

## STEP 3 — TEST IT

1. Power everything up
2. Serial Monitor should show "Ready. Tap a card."
3. Tap your allowed phone/card → relay clicks, strike releases, door opens
4. Tap unknown card → nothing happens
5. Check Supabase → access_logs table → new rows appearing

---

## HOW THIS MAPS TO MASLOW SUITES

| Workshop | Maslow Suite |
|----------|-------------|
| PN532 NFC reader | Same reader mounted in suite door frame |
| ESP32 | ESP32 in phantom corridor console |
| Electric strike | Toto smart lock or commercial strike |
| Supabase access_logs | Same table, adds suite_id, session_id, user_id |
| Hardcoded UIDs | Replaced by session token from Supabase |
| WiFi | Same, plus Supabase Realtime for instant unlock |

The real difference in production: instead of checking a hardcoded UID list,
the ESP32 checks Supabase for an active session matching that card.
Guest pays → session created → ESP32 sees it → tap to enter.

---

## NOTES

- Fail secure vs fail safe: The strike lock you're buying is "fail secure"
  meaning if power is cut, the door stays locked. Good for security.
  Maslow suites need "fail safe" (door unlocks on power failure) for fire code.
  Know the difference when you spec the real hardware with Yunus.

- Apple Pay on iPhone works as NFC but the UID rotates for privacy.
  For the workshop test, use a physical card or NFC sticker.
  In production Maslow uses session QR codes, not raw NFC UIDs.

- This prototype costs $45. The production version per suite is ~$200-400
  for a commercial-grade strike + reader + ESP32 + enclosure.
