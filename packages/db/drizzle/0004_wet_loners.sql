CREATE TYPE "public"."analysis_mode" AS ENUM('calibrated', 'exploratory');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('assigned', 'in_progress', 'completed', 'withdrawn', 'failed_attention');--> statement-breakpoint
CREATE TYPE "public"."dataset_export_format" AS ENUM('csv', 'json', 'bundle');--> statement-breakpoint
CREATE TYPE "public"."dataset_export_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."instrument_item_type" AS ENUM('likert', 'attention_check', 'choice', 'open_text');--> statement-breakpoint
CREATE TYPE "public"."study_status" AS ENUM('draft', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TABLE "analysis_masks" (
	"id" text PRIMARY KEY NOT NULL,
	"color_analysis_id" text NOT NULL,
	"mask_asset_version_id" text,
	"method" text NOT NULL,
	"confidence" text,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"object_key" text,
	"checksum_sha256" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "color_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"color_analysis_job_id" text,
	"asset_version_id" text,
	"sample_id" text,
	"title" text NOT NULL,
	"analysis_mode" "analysis_mode" NOT NULL,
	"is_calibrated" boolean DEFAULT false NOT NULL,
	"algorithm_name" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dependency_versions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calibration" jsonb,
	"quality_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result_checksum" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"access_policy_id" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"label_note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "color_analysis_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text,
	"asset_version_id" text,
	"sample_id" text,
	"analysis_mode" "analysis_mode" NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"algorithm_name" text,
	"algorithm_version" text,
	"input_object_key" text,
	"error_message" text,
	"created_by_user_id" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "color_comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_a_id" text NOT NULL,
	"analysis_b_id" text NOT NULL,
	"ciede2000_mean" text NOT NULL,
	"ciede2000_max" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "color_features" (
	"id" text PRIMARY KEY NOT NULL,
	"color_analysis_id" text NOT NULL,
	"mean_lightness" text NOT NULL,
	"mean_chroma" text NOT NULL,
	"color_entropy" text NOT NULL,
	"warm_cool_ratio" text NOT NULL,
	"hue_distribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"study_version_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"study_version_id" text NOT NULL,
	"export_purpose" text NOT NULL,
	"format" "dataset_export_format" DEFAULT 'json' NOT NULL,
	"status" "dataset_export_status" DEFAULT 'pending' NOT NULL,
	"object_key" text,
	"codebook_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"approved_by_user_id" text,
	"audited_at" timestamp with time zone,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instrument_items" (
	"id" text PRIMARY KEY NOT NULL,
	"instrument_id" text NOT NULL,
	"item_key" text NOT NULL,
	"prompt" text NOT NULL,
	"item_type" "instrument_item_type" DEFAULT 'likert' NOT NULL,
	"construct" text,
	"scale_min" integer,
	"scale_max" integer,
	"scale_labels" jsonb,
	"is_attention_check" boolean DEFAULT false NOT NULL,
	"expected_attention_value" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" text PRIMARY KEY NOT NULL,
	"study_version_id" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"language" text DEFAULT 'en' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palette_colors" (
	"id" text PRIMARY KEY NOT NULL,
	"palette_id" text NOT NULL,
	"rank" integer NOT NULL,
	"proportion" text NOT NULL,
	"display_hex" text NOT NULL,
	"rgb_r" integer NOT NULL,
	"rgb_g" integer NOT NULL,
	"rgb_b" integer NOT NULL,
	"lab_l" text NOT NULL,
	"lab_a" text NOT NULL,
	"lab_b" text NOT NULL,
	"lch_l" text NOT NULL,
	"lch_c" text NOT NULL,
	"lch_h" text NOT NULL,
	"hsv_h" text NOT NULL,
	"hsv_s" text NOT NULL,
	"hsv_v" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palettes" (
	"id" text PRIMARY KEY NOT NULL,
	"color_analysis_id" text NOT NULL,
	"version_label" text DEFAULT 'v1' NOT NULL,
	"color_count" integer DEFAULT 0 NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"pseudonym" text NOT NULL,
	"consent_record_id" text,
	"consent_version_label" text,
	"consent_status" "consent_status" DEFAULT 'draft' NOT NULL,
	"consent_purpose_approved" boolean DEFAULT false NOT NULL,
	"identifiable_vault_ref" text,
	"status" text DEFAULT 'active' NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reproducibility_manifests" (
	"id" text PRIMARY KEY NOT NULL,
	"dataset_export_id" text NOT NULL,
	"study_version_id" text NOT NULL,
	"software_version" text NOT NULL,
	"dataset_version" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"model_version" text,
	"prompt_policy_version" text,
	"parameters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"randomization_seed" text NOT NULL,
	"exported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" text PRIMARY KEY NOT NULL,
	"study_assignment_id" text NOT NULL,
	"instrument_item_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"value_numeric" integer,
	"value_text" text,
	"value_json" jsonb,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stimuli" (
	"id" text PRIMARY KEY NOT NULL,
	"stimulus_set_id" text NOT NULL,
	"condition_id" text NOT NULL,
	"sample_public_code" text NOT NULL,
	"motif_public_code" text,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stimulus_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"study_version_id" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studies" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"language" text DEFAULT 'en' NOT NULL,
	"status" "study_status" DEFAULT 'draft' NOT NULL,
	"organization_id" text,
	"access_policy_id" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"study_version_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"condition_id" text NOT NULL,
	"stimulus_id" text,
	"randomization_seed" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"assignment_index" integer DEFAULT 0 NOT NULL,
	"status" "assignment_status" DEFAULT 'assigned' NOT NULL,
	"attention_check_passed" boolean,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"study_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"version_label" text NOT NULL,
	"protocol_summary" text NOT NULL,
	"protocol_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"software_version" text NOT NULL,
	"dataset_version" text NOT NULL,
	"randomization_algorithm_version" text NOT NULL,
	"randomization_seed" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_masks" ADD CONSTRAINT "analysis_masks_color_analysis_id_color_analyses_id_fk" FOREIGN KEY ("color_analysis_id") REFERENCES "public"."color_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_masks" ADD CONSTRAINT "analysis_masks_mask_asset_version_id_asset_versions_id_fk" FOREIGN KEY ("mask_asset_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analyses" ADD CONSTRAINT "color_analyses_color_analysis_job_id_color_analysis_jobs_id_fk" FOREIGN KEY ("color_analysis_job_id") REFERENCES "public"."color_analysis_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analyses" ADD CONSTRAINT "color_analyses_asset_version_id_asset_versions_id_fk" FOREIGN KEY ("asset_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analyses" ADD CONSTRAINT "color_analyses_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analyses" ADD CONSTRAINT "color_analyses_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analysis_jobs" ADD CONSTRAINT "color_analysis_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analysis_jobs" ADD CONSTRAINT "color_analysis_jobs_asset_version_id_asset_versions_id_fk" FOREIGN KEY ("asset_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analysis_jobs" ADD CONSTRAINT "color_analysis_jobs_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_analysis_jobs" ADD CONSTRAINT "color_analysis_jobs_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_comparisons" ADD CONSTRAINT "color_comparisons_analysis_a_id_color_analyses_id_fk" FOREIGN KEY ("analysis_a_id") REFERENCES "public"."color_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_comparisons" ADD CONSTRAINT "color_comparisons_analysis_b_id_color_analyses_id_fk" FOREIGN KEY ("analysis_b_id") REFERENCES "public"."color_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_features" ADD CONSTRAINT "color_features_color_analysis_id_color_analyses_id_fk" FOREIGN KEY ("color_analysis_id") REFERENCES "public"."color_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_study_version_id_study_versions_id_fk" FOREIGN KEY ("study_version_id") REFERENCES "public"."study_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_exports" ADD CONSTRAINT "dataset_exports_study_version_id_study_versions_id_fk" FOREIGN KEY ("study_version_id") REFERENCES "public"."study_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_exports" ADD CONSTRAINT "dataset_exports_approved_by_user_id_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument_items" ADD CONSTRAINT "instrument_items_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instruments" ADD CONSTRAINT "instruments_study_version_id_study_versions_id_fk" FOREIGN KEY ("study_version_id") REFERENCES "public"."study_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_colors" ADD CONSTRAINT "palette_colors_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palettes" ADD CONSTRAINT "palettes_color_analysis_id_color_analyses_id_fk" FOREIGN KEY ("color_analysis_id") REFERENCES "public"."color_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_consent_record_id_consent_records_id_fk" FOREIGN KEY ("consent_record_id") REFERENCES "public"."consent_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reproducibility_manifests" ADD CONSTRAINT "reproducibility_manifests_dataset_export_id_dataset_exports_id_fk" FOREIGN KEY ("dataset_export_id") REFERENCES "public"."dataset_exports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reproducibility_manifests" ADD CONSTRAINT "reproducibility_manifests_study_version_id_study_versions_id_fk" FOREIGN KEY ("study_version_id") REFERENCES "public"."study_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_study_assignment_id_study_assignments_id_fk" FOREIGN KEY ("study_assignment_id") REFERENCES "public"."study_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_instrument_item_id_instrument_items_id_fk" FOREIGN KEY ("instrument_item_id") REFERENCES "public"."instrument_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stimuli" ADD CONSTRAINT "stimuli_stimulus_set_id_stimulus_sets_id_fk" FOREIGN KEY ("stimulus_set_id") REFERENCES "public"."stimulus_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stimuli" ADD CONSTRAINT "stimuli_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stimulus_sets" ADD CONSTRAINT "stimulus_sets_study_version_id_study_versions_id_fk" FOREIGN KEY ("study_version_id") REFERENCES "public"."study_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studies" ADD CONSTRAINT "studies_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_study_version_id_study_versions_id_fk" FOREIGN KEY ("study_version_id") REFERENCES "public"."study_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_assignments" ADD CONSTRAINT "study_assignments_stimulus_id_stimuli_id_fk" FOREIGN KEY ("stimulus_id") REFERENCES "public"."stimuli"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_versions" ADD CONSTRAINT "study_versions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_masks_analysis_idx" ON "analysis_masks" USING btree ("color_analysis_id");--> statement-breakpoint
CREATE UNIQUE INDEX "color_analyses_public_code_uidx" ON "color_analyses" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "color_analyses_mode_idx" ON "color_analyses" USING btree ("analysis_mode");--> statement-breakpoint
CREATE INDEX "color_analyses_sample_idx" ON "color_analyses" USING btree ("sample_id");--> statement-breakpoint
CREATE INDEX "color_analysis_jobs_status_idx" ON "color_analysis_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "color_analysis_jobs_asset_idx" ON "color_analysis_jobs" USING btree ("asset_version_id");--> statement-breakpoint
CREATE INDEX "color_analysis_jobs_job_idx" ON "color_analysis_jobs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "color_comparisons_a_idx" ON "color_comparisons" USING btree ("analysis_a_id");--> statement-breakpoint
CREATE INDEX "color_comparisons_b_idx" ON "color_comparisons" USING btree ("analysis_b_id");--> statement-breakpoint
CREATE UNIQUE INDEX "color_features_analysis_uidx" ON "color_features" USING btree ("color_analysis_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conditions_version_code_uidx" ON "conditions" USING btree ("study_version_id","code");--> statement-breakpoint
CREATE INDEX "conditions_version_idx" ON "conditions" USING btree ("study_version_id");--> statement-breakpoint
CREATE INDEX "dataset_exports_version_idx" ON "dataset_exports" USING btree ("study_version_id");--> statement-breakpoint
CREATE INDEX "dataset_exports_status_idx" ON "dataset_exports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "instrument_items_instrument_key_uidx" ON "instrument_items" USING btree ("instrument_id","item_key");--> statement-breakpoint
CREATE INDEX "instrument_items_instrument_idx" ON "instrument_items" USING btree ("instrument_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instruments_version_code_uidx" ON "instruments" USING btree ("study_version_id","code");--> statement-breakpoint
CREATE INDEX "instruments_version_idx" ON "instruments" USING btree ("study_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "palette_colors_palette_rank_uidx" ON "palette_colors" USING btree ("palette_id","rank");--> statement-breakpoint
CREATE INDEX "palette_colors_palette_idx" ON "palette_colors" USING btree ("palette_id");--> statement-breakpoint
CREATE INDEX "palettes_analysis_idx" ON "palettes" USING btree ("color_analysis_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_study_pseudonym_uidx" ON "participants" USING btree ("study_id","pseudonym");--> statement-breakpoint
CREATE INDEX "participants_study_idx" ON "participants" USING btree ("study_id");--> statement-breakpoint
CREATE INDEX "participants_consent_idx" ON "participants" USING btree ("consent_record_id");--> statement-breakpoint
CREATE INDEX "reproducibility_manifests_export_idx" ON "reproducibility_manifests" USING btree ("dataset_export_id");--> statement-breakpoint
CREATE INDEX "reproducibility_manifests_version_idx" ON "reproducibility_manifests" USING btree ("study_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "responses_assignment_item_uidx" ON "responses" USING btree ("study_assignment_id","instrument_item_id");--> statement-breakpoint
CREATE INDEX "responses_participant_idx" ON "responses" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "responses_item_idx" ON "responses" USING btree ("instrument_item_id");--> statement-breakpoint
CREATE INDEX "stimuli_set_idx" ON "stimuli" USING btree ("stimulus_set_id");--> statement-breakpoint
CREATE INDEX "stimuli_condition_idx" ON "stimuli" USING btree ("condition_id");--> statement-breakpoint
CREATE INDEX "stimuli_sample_code_idx" ON "stimuli" USING btree ("sample_public_code");--> statement-breakpoint
CREATE UNIQUE INDEX "stimulus_sets_version_code_uidx" ON "stimulus_sets" USING btree ("study_version_id","code");--> statement-breakpoint
CREATE INDEX "stimulus_sets_version_idx" ON "stimulus_sets" USING btree ("study_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studies_public_code_uidx" ON "studies" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "studies_status_idx" ON "studies" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "study_assignments_version_participant_uidx" ON "study_assignments" USING btree ("study_version_id","participant_id");--> statement-breakpoint
CREATE INDEX "study_assignments_condition_idx" ON "study_assignments" USING btree ("condition_id");--> statement-breakpoint
CREATE INDEX "study_assignments_status_idx" ON "study_assignments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "study_versions_study_version_uidx" ON "study_versions" USING btree ("study_id","version_number");--> statement-breakpoint
CREATE INDEX "study_versions_study_idx" ON "study_versions" USING btree ("study_id");