CREATE TYPE "public"."claim_type" AS ENUM('documented', 'contributor_interpretation', 'inferred', 'contested');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('draft', 'active', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TABLE "attribution_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"contributor_id" text NOT NULL,
	"preferred_credit" text NOT NULL,
	"allow_public_credit" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capture_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"sample_id" text,
	"label" text NOT NULL,
	"captured_at" timestamp with time zone,
	"device_notes" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"source_fragment_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_purposes" (
	"id" text PRIMARY KEY NOT NULL,
	"consent_record_id" text NOT NULL,
	"purpose_code" text NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" text PRIMARY KEY NOT NULL,
	"contributor_id" text,
	"rights_holder_id" text,
	"version_label" text NOT NULL,
	"status" "consent_status" DEFAULT 'draft' NOT NULL,
	"summary" text NOT NULL,
	"access_policy_id" text,
	"license_id" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributors" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"user_id" text,
	"community" text,
	"notes" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"motif_id" text,
	"sample_id" text,
	"statement" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"claim_type" "claim_type" DEFAULT 'documented' NOT NULL,
	"confidence" text DEFAULT 'low' NOT NULL,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"access_policy_id" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_collection_items" (
	"id" text PRIMARY KEY NOT NULL,
	"personal_collection_id" text NOT NULL,
	"motif_id" text,
	"sample_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rights_holders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_email" text,
	"notes" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_fragments" (
	"id" text PRIMARY KEY NOT NULL,
	"source_version_id" text NOT NULL,
	"fragment_key" text NOT NULL,
	"text_excerpt" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"access_policy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"citation" text NOT NULL,
	"content_checksum" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"title" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"access_policy_id" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tier_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"access_tier" "access_tier" NOT NULL,
	"reason" text,
	"granted_by_user_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "samples" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attribution_preferences" ADD CONSTRAINT "attribution_preferences_contributor_id_contributors_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capture_sessions" ADD CONSTRAINT "capture_sessions_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_claim_id_knowledge_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."knowledge_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_source_fragment_id_source_fragments_id_fk" FOREIGN KEY ("source_fragment_id") REFERENCES "public"."source_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_purposes" ADD CONSTRAINT "consent_purposes_consent_record_id_consent_records_id_fk" FOREIGN KEY ("consent_record_id") REFERENCES "public"."consent_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_contributor_id_contributors_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."contributors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_rights_holder_id_rights_holders_id_fk" FOREIGN KEY ("rights_holder_id") REFERENCES "public"."rights_holders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_claims" ADD CONSTRAINT "knowledge_claims_motif_id_motifs_id_fk" FOREIGN KEY ("motif_id") REFERENCES "public"."motifs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_claims" ADD CONSTRAINT "knowledge_claims_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_claims" ADD CONSTRAINT "knowledge_claims_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_collection_items" ADD CONSTRAINT "personal_collection_items_personal_collection_id_personal_collections_id_fk" FOREIGN KEY ("personal_collection_id") REFERENCES "public"."personal_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_collection_items" ADD CONSTRAINT "personal_collection_items_motif_id_motifs_id_fk" FOREIGN KEY ("motif_id") REFERENCES "public"."motifs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_collection_items" ADD CONSTRAINT "personal_collection_items_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_collections" ADD CONSTRAINT "personal_collections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_fragments" ADD CONSTRAINT "source_fragments_source_version_id_source_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."source_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_fragments" ADD CONSTRAINT "source_fragments_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_grants" ADD CONSTRAINT "tier_grants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_grants" ADD CONSTRAINT "tier_grants_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attribution_preferences_contributor_uidx" ON "attribution_preferences" USING btree ("contributor_id");--> statement-breakpoint
CREATE INDEX "capture_sessions_sample_idx" ON "capture_sessions" USING btree ("sample_id");--> statement-breakpoint
CREATE UNIQUE INDEX "claim_sources_claim_fragment_uidx" ON "claim_sources" USING btree ("claim_id","source_fragment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_purposes_consent_purpose_uidx" ON "consent_purposes" USING btree ("consent_record_id","purpose_code");--> statement-breakpoint
CREATE INDEX "consent_records_status_idx" ON "consent_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consent_records_contributor_idx" ON "consent_records" USING btree ("contributor_id");--> statement-breakpoint
CREATE INDEX "contributors_user_idx" ON "contributors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_claims_motif_idx" ON "knowledge_claims" USING btree ("motif_id");--> statement-breakpoint
CREATE INDEX "knowledge_claims_review_idx" ON "knowledge_claims" USING btree ("review_status");--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_code_uidx" ON "licenses" USING btree ("code");--> statement-breakpoint
CREATE INDEX "personal_collection_items_collection_idx" ON "personal_collection_items" USING btree ("personal_collection_id");--> statement-breakpoint
CREATE INDEX "personal_collections_user_idx" ON "personal_collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rights_holders_name_idx" ON "rights_holders" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "source_fragments_version_key_uidx" ON "source_fragments" USING btree ("source_version_id","fragment_key");--> statement-breakpoint
CREATE UNIQUE INDEX "source_versions_source_version_uidx" ON "source_versions" USING btree ("source_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_public_code_uidx" ON "sources" USING btree ("public_code");--> statement-breakpoint
CREATE UNIQUE INDEX "tier_grants_user_tier_uidx" ON "tier_grants" USING btree ("user_id","access_tier");--> statement-breakpoint
CREATE INDEX "tier_grants_user_idx" ON "tier_grants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "samples_status_idx" ON "samples" USING btree ("status");