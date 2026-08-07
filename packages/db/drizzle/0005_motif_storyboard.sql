CREATE TABLE "artisans" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text NOT NULL,
	"region" text,
	"origin_lat" double precision,
	"origin_lng" double precision,
	"visual_seed" text DEFAULT 'demo-artisan' NOT NULL,
	"access_policy_id" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linen_items" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"fiber_type" text,
	"weave_notes" text,
	"region" text,
	"visual_seed" text DEFAULT 'demo-linen' NOT NULL,
	"access_policy_id" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "era" text;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "symbolism" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "fabric_type" text;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "color_palette" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "story" text;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "artisan_id" text;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "linen_item_id" text;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "origin_lat" double precision;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "origin_lng" double precision;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "motifs" ADD COLUMN "visual_seed" text DEFAULT 'demo-motif' NOT NULL;--> statement-breakpoint
ALTER TABLE "artisans" ADD CONSTRAINT "artisans_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linen_items" ADD CONSTRAINT "linen_items_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motifs" ADD CONSTRAINT "motifs_artisan_id_artisans_id_fk" FOREIGN KEY ("artisan_id") REFERENCES "public"."artisans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motifs" ADD CONSTRAINT "motifs_linen_item_id_linen_items_id_fk" FOREIGN KEY ("linen_item_id") REFERENCES "public"."linen_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artisans_public_code_uidx" ON "artisans" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "artisans_region_idx" ON "artisans" USING btree ("region");--> statement-breakpoint
CREATE UNIQUE INDEX "linen_items_public_code_uidx" ON "linen_items" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "linen_items_region_idx" ON "linen_items" USING btree ("region");--> statement-breakpoint
CREATE INDEX "motifs_region_idx" ON "motifs" USING btree ("region");--> statement-breakpoint
CREATE INDEX "motifs_artisan_idx" ON "motifs" USING btree ("artisan_id");--> statement-breakpoint
CREATE INDEX "motifs_featured_idx" ON "motifs" USING btree ("is_featured");
