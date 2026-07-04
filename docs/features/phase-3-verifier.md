---
title: "🔐 Phase 3: Event Verifier"
version: "0.10.0"
status: "complete"
last_updated: "2026-07-04"
author: "Saad Tayyab"
---

# 🔐 Phase 3: Event Verifier

> **v0.10.0** · **Complete** · Updated 2026-07-04 by Saad Tayyab
>
> [📋 Changelog](../changelog.md) · [📖 Docs Hub](../README.md)

---


## Status

**Complete** ✅ (2026-06-30)

## Overview

For any Nostr event, verify its signature, decode its fields, and explain what it means. Makes the tool useful for debugging broken events.

## User Stories

1. **As a developer**, I want to paste event JSON and verify its Schnorr signature so I can confirm it's authentic.
2. **As a developer**, I want to decode a pubkey to npub format so I can identify the author.
3. **As a developer**, I want each tag explained with context so I can understand what `e`, `p`, `t`, etc. mean.
4. **As a developer**, I want to verify the event ID (SHA-256 of canonical serialization) so I can check for tampering.

## Features

### Signature Verification
- Paste raw event JSON
- Client-side Schnorr signature verification
- Visual pass/fail indicator
- Show the signing pubkey

### Event ID Verification
- Compute SHA-256 of canonical event serialization
- Compare with the event's `id` field
- Highlight mismatches

### Tag Decoder
- Explain each tag type:
  - `e` → Event reference (with linked event lookup)
  - `p` → Profile/pubkey reference (with npub conversion)
  - `t` → Hashtag
  - `d` → Replaceable event coordinate
  - `expiration` → Event expiration time
  - Custom tags → Raw display

### NIP-05 Verification
- Check author's NIP-05 identifier
- Verify DNS-based identity
- Display verification status

### Contextual Explanations
- Event kind explanations (kind 0 = metadata, kind 1 = note, etc.)
- Content type detection (text, JSON, base64, etc.)
- Tag relationship mapping

## Technical Details

### Client-Side Crypto

```typescript
// Using @noble/curves for Schnorr signatures
import { schnorr } from '@noble/curves/secp256k1'

function verifyEventSignature(event: NostrEvent): boolean {
  const hash = sha256(serializeEvent(event))
  return schnorr.verify(event.sig, hash, event.pubkey)
}
```

### Event Serialization (NIP-01)

```typescript
function serializeEvent(event: NostrEvent): Uint8Array {
  return JSON.stringify([
    0,                    // reserved
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ])
}
```

### Component Structure

```
verifier/
├── EventVerifier.svelte       # Main verifier container
├── EventInput.svelte          # Paste JSON textarea
├── VerificationPanel.svelte   # Signature + ID verification results
├── EventDetails.svelte        # Decoded event fields
├── TagDecoder.svelte          # Tag explanations
└── KindBadge.svelte           # Event kind display

utils/
├── nostrVerify.ts             # Signature + event ID verification logic
└── nip05.ts                   # NIP-05 DNS identity verification
```

### Dependencies

- `nostr-tools`: Event verification, NIP-19 bech32 encoding
- NIP-05 DNS lookup (browser `fetch` via `utils/nip05.ts`)

## Testing

1. Paste a valid event → signature should verify ✅
2. Modify one character → signature should fail ❌
3. Paste event with `p` tag → should show npub conversion
4. Paste kind 0 event → should explain "metadata"
5. Check event ID → should match computed hash

---

*Previous: [Phase 2 — Live Event Stream](phase-2-events.md)*

---
