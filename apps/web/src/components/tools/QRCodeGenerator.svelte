<script lang="ts">
import QRCode from "qrcode";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Label } from "$lib/components/ui/label";
import { Spinner } from "$lib/components/ui/spinner";
import { Textarea } from "$lib/components/ui/textarea";
import * as ToggleGroup from "$lib/components/ui/toggle-group";
import { detectKeyFormat } from "../../utils/keys";

let input = $state("");
let qrDataUrl = $state<string | null>(null);
let size = $state<200 | 300 | 500>(300);
let detectedType = $state<string>("text");
let generating = $state(false);

function generateQR() {
	if (!input.trim()) {
		qrDataUrl = null;
		return;
	}

	generating = true;
	qrDataUrl = null;

	QRCode.toDataURL(input.trim(), {
		width: size,
		margin: 2,
		color: {
			dark: "#ffffff",
			light: "#1a1a2e",
		},
	})
		.then((url) => {
			qrDataUrl = url;
		})
		.finally(() => {
			generating = false;
		});
}

function detectType(value: string): string {
	if (detectKeyFormat(value) === "npub") return "npub";
	if (value.startsWith("wss://") || value.startsWith("ws://")) return "relay";
	try {
		JSON.parse(value);
		return "event";
	} catch {
		return "text";
	}
}

function handleInput() {
	detectedType = detectType(input);
	generateQR();
}

function downloadQR() {
	if (!qrDataUrl) return;
	const a = document.createElement("a");
	a.href = qrDataUrl;
	a.download = `nostr-qr-${detectedType}.png`;
	a.click();
}

async function copyImage() {
	if (!qrDataUrl) return;
	try {
		const res = await fetch(qrDataUrl);
		const blob = await res.blob();
		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
	} catch {
		// Clipboard API not available or denied
	}
}
</script>

<Card.Root class="rounded-xl border-dark-border bg-dark-card">
  <Card.Content class="space-y-4 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text-primary">QR Code Generator</h3>
      <Badge variant="outline" class="border-dark-border bg-dark-surface text-text-muted">{detectedType}</Badge>
    </div>

    <!-- Input -->
    <div>
      <Label for="qr-input" class="mb-1 block text-xs text-text-muted">
        Enter npub, relay URL, event JSON, or any text
      </Label>
      <Textarea
        id="qr-input"
        bind:value={input}
        oninput={handleInput}
        placeholder={"npub1... or wss://relay.example.com or event json"}
        rows={3}
        class="border-dark-border bg-dark-surface px-3 font-mono text-sm text-text-primary placeholder:text-text-muted"
      />
    </div>

    <!-- Size Selector -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-text-muted">Size:</span>
      <ToggleGroup.Root type="single" value={String(size)} onValueChange={(v) => { if (v) { size = Number(v) as 200 | 300 | 500; generateQR(); } }}>
        <ToggleGroup.Item value="200">200px</ToggleGroup.Item>
        <ToggleGroup.Item value="300">300px</ToggleGroup.Item>
        <ToggleGroup.Item value="500">500px</ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>

    <!-- QR Code Preview -->
    {#if generating}
      <div class="flex items-center justify-center py-12 text-text-muted text-xs">
        <span class="flex items-center gap-2">
          <Spinner class="text-text-muted" />
          Generating QR code...
        </span>
      </div>
    {:else if qrDataUrl}
      <div class="flex flex-col items-center gap-4">
        <div class="p-4 rounded-xl bg-white shadow-lg">
          <img src={qrDataUrl} alt="QR code for: {input.slice(0, 50)}{input.length > 50 ? '...' : ''}" width={size} height={size} />
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Download QR code as PNG"
            onclick={downloadQR}
            class="min-h-[44px] border-dark-border bg-dark-surface text-xs text-text-primary hover:text-accent"
          >
            Download PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Copy QR code image to clipboard"
            onclick={copyImage}
            class="min-h-[44px] border-dark-border bg-dark-surface text-xs text-text-primary hover:text-accent"
          >
            Copy Image
          </Button>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12 text-text-muted text-xs">
        Enter content above to generate QR code
      </div>
    {/if}
  </Card.Content>
</Card.Root>
