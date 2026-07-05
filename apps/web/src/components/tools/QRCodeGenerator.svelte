<script lang="ts">
import QRCode from "qrcode";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Dialog from "$lib/components/ui/dialog";
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
let previewOpen = $state(false);

/**
 * Read QR foreground/background colors from CSS custom properties.
 * Uses dedicated --qr-fg / --qr-bg tokens (hex) since the qrcode library
 * requires hex color strings and can't consume OKLCH values.
 */
function getQrThemeColors(): { dark: string; light: string } {
	const style = getComputedStyle(document.documentElement);
	const fg = style.getPropertyValue("--qr-fg").trim() || "#374151";
	const bg = style.getPropertyValue("--qr-bg").trim() || "#ffffff";
	return { dark: fg, light: bg };
}

function generateQR() {
	if (!input.trim()) {
		qrDataUrl = null;
		return;
	}

	generating = true;
	qrDataUrl = null;

	const { dark, light } = getQrThemeColors();
	QRCode.toDataURL(input.trim(), {
		width: size,
		margin: 2,
		color: { dark, light },
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

<Card.Root class="rounded-xl border-border bg-card">
  <Card.Content class="flex flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-foreground">QR Code Generator</h3>
      <Badge variant="outline" class="border-border bg-muted text-muted-foreground">{detectedType}</Badge>
    </div>

    <!-- Input -->
    <div>
      <Label for="qr-input" class="mb-1 block text-xs text-muted-foreground">
        Enter npub, relay URL, event JSON, or any text
      </Label>
      <Textarea
        id="qr-input"
        bind:value={input}
        oninput={handleInput}
        placeholder={"npub1... or wss://relay.example.com or event json"}
        rows={3}
        class="border-border bg-muted px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>

    <!-- Size Selector -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground">Size:</span>
      <ToggleGroup.Root type="single" value={String(size)} onValueChange={(v) => { if (v) { size = Number(v) as 200 | 300 | 500; generateQR(); } }}>
        <ToggleGroup.Item value="200">200px</ToggleGroup.Item>
        <ToggleGroup.Item value="300">300px</ToggleGroup.Item>
        <ToggleGroup.Item value="500">500px</ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>

    <!-- QR Code Preview -->
    {#if generating}
      <div class="flex items-center justify-center py-12 text-muted-foreground text-xs">
        <span class="flex items-center gap-2">
          <Spinner class="text-muted-foreground" />
          Generating QR code...
        </span>
      </div>
    {:else if qrDataUrl}
      <div class="flex flex-col items-center gap-4">
        <div class="p-4 rounded-xl bg-background border border-border shadow-lg">
          <img src={qrDataUrl} alt="QR code for: {input.slice(0, 50)}{input.length > 50 ? '...' : ''}" width={size} height={size} />
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Preview QR code full size"
            onclick={() => (previewOpen = true)}
            class="min-h-[44px] border-border bg-muted text-xs text-foreground hover:text-primary"
          >
            Full Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Download QR code as PNG"
            onclick={downloadQR}
            class="min-h-[44px] border-border bg-muted text-xs text-foreground hover:text-primary"
          >
            Download PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Copy QR code image to clipboard"
            onclick={copyImage}
            class="min-h-[44px] border-border bg-muted text-xs text-foreground hover:text-primary"
          >
            Copy Image
          </Button>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12 text-muted-foreground text-xs">
        Enter content above to generate QR code
      </div>
    {/if}
  </Card.Content>
</Card.Root>

<!-- Full-size QR Preview Dialog -->
<Dialog.Root bind:open={previewOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>QR Code Preview</Dialog.Title>
      <Dialog.Description>
        {size}px — {detectedType}
      </Dialog.Description>
    </Dialog.Header>
    {#if qrDataUrl}
      <div class="flex justify-center p-4 rounded-xl bg-background border border-border">
        <img src={qrDataUrl} alt="QR code full preview" width={size} height={size} class="max-w-full h-auto" />
      </div>
      <Dialog.Footer class="flex flex-row gap-2 sm:justify-center">
        <Button
          variant="outline"
          size="sm"
          aria-label="Download QR code as PNG"
          onclick={downloadQR}
          class="min-h-[44px]"
        >
          Download PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Copy QR code image to clipboard"
          onclick={copyImage}
          class="min-h-[44px]"
        >
          Copy Image
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
