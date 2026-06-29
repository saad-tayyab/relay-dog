# 📡 NIP Reference

Nostr Implementation Possessions (NIPs) are protocol specifications that extend the core Nostr protocol. This doc tracks which NIPs we implement and why.

## Implemented NIPs

| NIP | Name | Phase | Status | Description |
|-----|------|-------|--------|-------------|
| **NIP-01** | Basic Protocol | 2 | 🚧 | Core event structure: `id`, `pubkey`, `created_at`, `kind`, `tags`, `content`. REQ/EVENT/EOSE/CLOSE message types over WebSocket |
| **NIP-05** | DNS Identifiers | 3 | 📋 | Maps pubkeys to human-readable identifiers (e.g., `name@domain.com`). Uses DNS TXT records for verification |
| **NIP-07** | Browser Extension | 4 | 📋 | `window.nostr` API for signing events and getting public keys. Used for AUTH flow |
| **NIP-11** | Relay Information | 1 | ✅ | HTTP endpoint returning relay metadata: name, description, supported NIPs, limitations. Fetched with `Accept: application/nostr+json` |
| **NIP-19** | Bech32 Encoding | 3 | 📋 | Encodes pubkeys (`npub`), event IDs (`nevent`), and profiles (`nprofile`) in human-readable bech32 format |
| **NIP-42** | Relay Authentication | 4 | 📋 | AUTH challenge/response flow. Relay sends `AUTH` message, client signs and sends back. Required for auth-gated relays |
| **NIP-65** | Relay List Metadata | 5 | 📋 | `kind:10002` events containing relay URLs for read/write. Used for relay discovery |
| **NIP-66** | Relay & Channel Discovery | 5 | 📋 | `kind:30166` events from relay monitors indicating relay liveness. `kind:10166` for monitor announcements |

## NIP Details

### NIP-01: Core Protocol

The foundation of Nostr. Every Nostr interaction uses NIP-01.

**Event Structure:**
```json
{
  "id": "hex_encoded_32_byte_sha256",
  "pubkey": "hex_encoded_32_byte_pubkey",
  "created_at": 1234567890,
  "kind": 1,
  "tags": [["e", "event_id"], ["p", "pubkey"]],
  "content": "Hello, Nostr!",
  "sig": "hex_encoded_64_byte_schnorr_signature"
}
```

**Message Types:**
| Type | Direction | Format |
|------|-----------|--------|
| `EVENT` | Client → Relay | `["EVENT", <event>]` |
| `REQ` | Client → Relay | `["REQ", <sub_id>, <filter>]` |
| `CLOSE` | Client → Relay | `["CLOSE", <sub_id>]` |
| `EVENT` | Relay → Client | `["EVENT", <sub_id>, <event>]` |
| `EOSE` | Relay → Client | `["EOSE", <sub_id>]` |
| `NOTICE` | Relay → Client | `["NOTICE", <message>]` |

---

### NIP-11: Relay Information Document

The only HTTP endpoint a relay must support.

**Request:**
```bash
curl -H "Accept: application/nostr+json" https://relay.damus.io
```

**Response:**
```json
{
  "name": "Damus Relay",
  "description": "The official Damus relay",
  "supported_nips": [1, 2, 4, 11, 12, 16, 20, 42],
  "software": "https://github.com/damusc/relay",
  "version": "1.0.0",
  "limitation": {
    "max_message_length": 131072,
    "max_subscriptions": 20,
    "max_filters": 10,
    "max_limit": 5000,
    "max_event_tags": 2000,
    "auth_required": false,
    "payment_required": false
  }
}
```

---

### NIP-42: Relay Authentication

Required for relays that gate access.

**Flow:**
```
Client                     Relay
  │                          │
  │──── CONNECT ────────────>│
  │                          │
  │<─── ["AUTH", <challenge>] │
  │                          │
  │──── ["AUTH", <event>] ──>│  (signed AUTH event)
  │                          │
  │<─── OK ──────────────────│
  │                          │
  │──── REQ ────────────────>│  (now authenticated)
```

---

### NIP-66: Relay Discovery

Monitor relays publish liveness data.

**Monitor Announcement (`kind:10166`):**
```json
{
  "kind": 10166,
  "content": "I monitor Nostr relays",
  "tags": [
    ["relay", "wss://relay.damus.io"],
    ["relay", "wss://nos.lol"]
  ]
}
```

**Relay Status (`kind:30166`):**
```json
{
  "kind": 30166,
  "content": "",
  "tags": [
    ["relay", "wss://relay.damus.io"],
    ["n", "nip11"],
    ["n", "nip42"],
    ["s", "NIP-11 info"]
  ]
}
```

## Spec Links

| NIP | Spec URL |
|-----|----------|
| NIP-01 | https://github.com/nostr-protocol/nips/blob/master/01.md |
| NIP-05 | https://github.com/nostr-protocol/nips/blob/master/05.md |
| NIP-07 | https://github.com/nostr-protocol/nips/blob/master/07.md |
| NIP-11 | https://github.com/nostr-protocol/nips/blob/master/11.md |
| NIP-19 | https://github.com/nostr-protocol/nips/blob/master/19.md |
| NIP-42 | https://github.com/nostr-protocol/nips/blob/master/42.md |
| NIP-65 | https://github.com/nostr-protocol/nips/blob/master/65.md |
| NIP-66 | https://github.com/nostr-protocol/nips/blob/master/66.md |
