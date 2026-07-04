CREATE TABLE "health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"relay_id" uuid NOT NULL,
	"http_reachable" boolean NOT NULL,
	"cors_configured" boolean NOT NULL,
	"websocket_connectable" boolean NOT NULL,
	"latency_ms" integer,
	"http_status_code" integer,
	"error_message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"relay_id" uuid NOT NULL UNIQUE,
	"enabled" boolean DEFAULT true NOT NULL,
	"interval_ms" integer DEFAULT 60000 NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relay_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"relay_id" uuid NOT NULL,
	"nostr_event_id" text NOT NULL,
	"pubkey" text NOT NULL,
	"kind" integer NOT NULL,
	"content" text,
	"tags" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relay_info_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"relay_id" uuid NOT NULL,
	"nip11" jsonb NOT NULL,
	"raw_json" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"url" text NOT NULL UNIQUE,
	"name" text,
	"description" text,
	"icon" text,
	"software" text,
	"version" text,
	"supported_nips" integer[] DEFAULT '{}'::integer[],
	"limitations" jsonb,
	"country" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "health_checks_relay_id_idx" ON "health_checks" ("relay_id");--> statement-breakpoint
CREATE INDEX "health_checks_checked_at_idx" ON "health_checks" ("checked_at");--> statement-breakpoint
CREATE INDEX "monitoring_jobs_enabled_idx" ON "monitoring_jobs" ("enabled");--> statement-breakpoint
CREATE INDEX "relay_events_relay_id_idx" ON "relay_events" ("relay_id");--> statement-breakpoint
CREATE INDEX "relay_events_kind_idx" ON "relay_events" ("kind");--> statement-breakpoint
CREATE INDEX "relay_events_nostr_event_id_idx" ON "relay_events" ("nostr_event_id");--> statement-breakpoint
CREATE INDEX "relay_events_created_at_idx" ON "relay_events" ("created_at");--> statement-breakpoint
CREATE INDEX "relay_info_relay_id_idx" ON "relay_info_snapshots" ("relay_id");--> statement-breakpoint
CREATE INDEX "relay_info_fetched_at_idx" ON "relay_info_snapshots" ("fetched_at");--> statement-breakpoint
CREATE INDEX "relays_url_idx" ON "relays" ("url");--> statement-breakpoint
CREATE INDEX "relays_nips_idx" ON "relays" ("supported_nips");--> statement-breakpoint
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_relay_id_relays_id_fkey" FOREIGN KEY ("relay_id") REFERENCES "relays"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "monitoring_jobs" ADD CONSTRAINT "monitoring_jobs_relay_id_relays_id_fkey" FOREIGN KEY ("relay_id") REFERENCES "relays"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "relay_events" ADD CONSTRAINT "relay_events_relay_id_relays_id_fkey" FOREIGN KEY ("relay_id") REFERENCES "relays"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "relay_info_snapshots" ADD CONSTRAINT "relay_info_snapshots_relay_id_relays_id_fkey" FOREIGN KEY ("relay_id") REFERENCES "relays"("id") ON DELETE CASCADE;