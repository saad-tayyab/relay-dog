# 📡 NIP Reference

Nostr Implementation Possessions (NIPs) are protocol specifications that extend the core Nostr protocol. This doc tracks which NIPs we implement and why.

## Implemented NIPs

| NIP | Name | Phase | Status | Description |
|-----|------|-------|--------|-------------|
| **NIP-01** | Basic Protocol | 2 | ✅ | Core event structure: `id`, `pubkey`, `created_at`, `kind`, `tags`, `content`. REQ/EVENT/EOSE/CLOSE message types over WebSocket |
| **NIP-05** | DNS Identifiers | 3 | ✅ | Maps pubkeys to human-readable identifiers (e.g., `name@domain.com`). Uses DNS TXT records for verification |
| **NIP-07** | Browser Extension | 4 | ✅ | `window.nostr` API for signing events and getting public keys. Used for AUTH flow |
| **NIP-11** | Relay Information | 1 | ✅ | HTTP endpoint returning relay metadata: name, description, supported NIPs, limitations. Fetched with `Accept: application/nostr+json` |
| **NIP-19** | Bech32 Encoding | 3 | ✅ | Encodes pubkeys (`npub`), event IDs (`nevent`), and profiles (`nprofile`) in human-readable bech32 format |
| **NIP-40** | Expiration Timestamp | 6 | 📋 | `["expiration", "unix_timestamp"]` tag. Events past expiration should be ignored by clients and dropped by relays |
| **NIP-42** | Relay Authentication | 4 | ✅ | AUTH challenge/response flow. Relay sends `AUTH` message, client signs and sends back. Required for auth-gated relays |
| **NIP-50** | Search Capability | 6 | 📋 | `search` field in REQ filters for content-based search. Extensions: `include:spam`, `domain:`, `language:` |
| **NIP-65** | Relay List Metadata | 5 | 📋 | `kind:10002` events containing relay URLs for read/write. Used for relay discovery and popularity metrics |
| **NIP-66** | Relay & Channel Discovery | 5 | 📋 | `kind:30166` events from relay monitors indicating relay liveness. `kind:10166` for monitor announcements. RTT, network type, requirements |
| **NIP-67** | EOSE Completeness Hint | 6 | 📋 | Extends EOSE with 3rd element: `["finish"]` (all events sent) or `["more"]` (more available). Removes pagination guesswork |

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

**Response (current spec fields):**
```json
{
  "name": "Damus Relay",
  "description": "The official Damus relay",
  "banner": "https://example.com/banner.jpg",
  "icon": "https://example.com/icon.jpg",
  "pubkey": "hex_64_byte_admin_pubkey",
  "self": "hex_64_byte_relay_pubkey",
  "contact": "mailto:admin@damus.io",
  "supported_nips": [1, 2, 4, 11, 12, 16, 20, 42],
  "software": "https://github.com/damusc/relay",
  "version": "1.0.0",
  "terms_of_service": "https://damus.io/tos",
  "limitation": {
    "max_message_length": 131072,
    "max_subscriptions": 20,
    "max_filters": 10,
    "max_limit": 5000,
    "max_event_tags": 2000,
    "auth_required": false,
    "payment_required": false
  },
  "payments_url": "https://damus.io/pay",
  "fees": {
    "admission": [{ "amount": 1000000, "unit": "msats" }],
    "subscription": [{ "amount": 5000000, "unit": "msats", "period": 2592000 }],
    "publication": [{ "kinds": [4], "amount": 100, "unit": "msats" }]
  }
}
```

**Relay must accept CORS:** Send `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`, and `Access-Control-Allow-Methods` headers.

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

### NIP-40: Expiration Timestamp

Events can declare an expiration time. Expired events should be ignored.

**Tag format:**
```
["expiration", "1600000000"]  // unix timestamp in seconds
```

**Relay behavior:** SHOULD NOT send expired events. SHOULD drop expired events on publish.
**Client behavior:** SHOULD ignore expired events. SHOULD check `supported_nips` for NIP-40 support.

---

### NIP-50: Search Capability

Adds a `search` field for content-based queries.

**REQ with search:**
```json
["REQ", "sub1", { "search": "best nostr apps", "kinds": [1] }]
```

**Extensions:**
- `include:spam` — turn off spam filtering
- `domain:` — filter by NIP-05 domain
- `language:` — filter by language
- `sentiment:` — filter by sentiment
- `nsfw:` — include/exclude NSFW events

Results returned by relevance (not `created_at`). Clients should query multiple relays.

---

### NIP-66: Relay Discovery

Monitor relays publish liveness data.

**Monitor Announcement (`kind:10166`):**
```json
{
  "kind": 10166,
  "content": "I monitor Nostr relays",
  "tags": [
    ["frequency", "3600"],
    ["timeout", "open", "5000"],
    ["timeout", "read", "3000"],
    ["c", "ws"],
    ["c", "nip11"],
    ["c", "ssl"],
    ["g", "ww8p1r4t8"]
  ]
}
```

**Relay Discovery (`kind:30166`):**
```json
{
  "kind": 30166,
  "tags": [
    ["d", "wss://some.relay/"],
    ["n", "clearnet"],
    ["N", "40"],
    ["N", "33"],
    ["R", "!payment"],
    ["R", "auth"],
    ["t", "nsfw"],
    ["k", "1"],
    ["g", "ww8p1r4t8"],
    ["rtt-open", "234"],
    ["rtt-read", "150"],
    ["rtt-write", "200"]
  ],
  "content": "{...nip11...}"
}
```

---

### NIP-67: EOSE Completeness Hint

Extends EOSE with a 3rd element indicating whether more stored events exist.

```
["EOSE", "sub_id"]              // legacy — client paginates
["EOSE", "sub_id", ["finish"]]  // all matching events sent
["EOSE", "sub_id", ["more"]]    // more events available
```

Relays SHOULD include `67` in `supported_nips` if implemented.

## Spec Links

| NIP | Spec URL |
|-----|----------|
| NIP-01 | https://nips.nostr.com/1 |
| NIP-05 | https://nips.nostr.com/5 |
| NIP-07 | https://nips.nostr.com/7 |
| NIP-11 | https://nips.nostr.com/11 |
| NIP-19 | https://nips.nostr.com/19 |
| NIP-40 | https://nips.nostr.com/40 |
| NIP-42 | https://nips.nostr.com/42 |
| NIP-50 | https://nips.nostr.com/50 |
| NIP-65 | https://nips.nostr.com/65 |
| NIP-66 | https://nips.nostr.com/66 |
| NIP-67 | https://nips.nostr.com/67 |
