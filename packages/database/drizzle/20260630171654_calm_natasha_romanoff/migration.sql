CREATE TABLE "relay_discoveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"relay_url" text NOT NULL,
	"monitor_pubkey" text NOT NULL,
	"rtt_open" integer,
	"rtt_read" integer,
	"rtt_write" integer,
	"network_type" text,
	"relay_type" text,
	"supported_nips" integer[] DEFAULT '{}'::integer[],
	"requirements" text[] DEFAULT '{}'::text[],
	"topics" text[] DEFAULT '{}'::text[],
	"geohash" text,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relay_discoveries_url_monitor_key" UNIQUE("relay_url","monitor_pubkey")
);
--> statement-breakpoint
CREATE TABLE "relay_list_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"author_pubkey" text NOT NULL,
	"relay_url" text NOT NULL,
	"marker" text,
	"listed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relay_list_entries_author_relay_key" UNIQUE("author_pubkey","relay_url")
);
--> statement-breakpoint
ALTER TABLE "health_checks" ADD COLUMN "nip67_eose_hints" jsonb;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "pubkey" text;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "self" text;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "contact" text;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "terms_of_service" text;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "payments_url" text;--> statement-breakpoint
ALTER TABLE "relays" ADD COLUMN "fees" jsonb;