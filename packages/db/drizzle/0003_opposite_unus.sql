CREATE TABLE "garment_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"canvas_width" integer DEFAULT 800 NOT NULL,
	"canvas_height" integer DEFAULT 1000 NOT NULL,
	"silhouette_svg" text,
	"access_policy_id" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garment_regions" (
	"id" text PRIMARY KEY NOT NULL,
	"garment_template_id" text NOT NULL,
	"region_key" text NOT NULL,
	"label" text NOT NULL,
	"clip_polygon" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"public_code" text NOT NULL,
	"title" text NOT NULL,
	"garment_template_id" text NOT NULL,
	"owner_user_id" text,
	"access_policy_id" text,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"design_project_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"version_label" text NOT NULL,
	"design_json" jsonb NOT NULL,
	"content_checksum" text NOT NULL,
	"parent_version_id" text,
	"created_by_user_id" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_layers" (
	"id" text PRIMARY KEY NOT NULL,
	"design_version_id" text NOT NULL,
	"layer_key" text NOT NULL,
	"motif_id" text,
	"asset_version_id" text,
	"region_key" text NOT NULL,
	"transform" jsonb NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_palette_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"design_version_id" text NOT NULL,
	"layer_key" text NOT NULL,
	"source_palette_ref" text,
	"mapped_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_previews" (
	"id" text PRIMARY KEY NOT NULL,
	"design_version_id" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"mime_type" text DEFAULT 'image/png' NOT NULL,
	"object_key" text,
	"checksum_sha256" text,
	"attribution_text" text NOT NULL,
	"watermark_applied" boolean DEFAULT true NOT NULL,
	"export_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"design_version_id" text NOT NULL,
	"author_user_id" text,
	"body" text NOT NULL,
	"is_demo_fictional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"design_version_id" text NOT NULL,
	"reviewer_user_id" text,
	"review_status" "review_status" DEFAULT 'pending_review' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "garment_templates" ADD CONSTRAINT "garment_templates_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garment_regions" ADD CONSTRAINT "garment_regions_garment_template_id_garment_templates_id_fk" FOREIGN KEY ("garment_template_id") REFERENCES "public"."garment_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_projects" ADD CONSTRAINT "design_projects_garment_template_id_garment_templates_id_fk" FOREIGN KEY ("garment_template_id") REFERENCES "public"."garment_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_projects" ADD CONSTRAINT "design_projects_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_projects" ADD CONSTRAINT "design_projects_access_policy_id_access_policies_id_fk" FOREIGN KEY ("access_policy_id") REFERENCES "public"."access_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_versions" ADD CONSTRAINT "design_versions_design_project_id_design_projects_id_fk" FOREIGN KEY ("design_project_id") REFERENCES "public"."design_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_versions" ADD CONSTRAINT "design_versions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_layers" ADD CONSTRAINT "design_layers_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_layers" ADD CONSTRAINT "design_layers_motif_id_motifs_id_fk" FOREIGN KEY ("motif_id") REFERENCES "public"."motifs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_layers" ADD CONSTRAINT "design_layers_asset_version_id_asset_versions_id_fk" FOREIGN KEY ("asset_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_palette_mappings" ADD CONSTRAINT "design_palette_mappings_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_previews" ADD CONSTRAINT "design_previews_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_comments" ADD CONSTRAINT "design_comments_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_comments" ADD CONSTRAINT "design_comments_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_reviews" ADD CONSTRAINT "design_reviews_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_reviews" ADD CONSTRAINT "design_reviews_reviewer_user_id_user_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "garment_templates_public_code_uidx" ON "garment_templates" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "garment_templates_status_idx" ON "garment_templates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "garment_regions_template_key_uidx" ON "garment_regions" USING btree ("garment_template_id","region_key");--> statement-breakpoint
CREATE INDEX "garment_regions_template_idx" ON "garment_regions" USING btree ("garment_template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "design_projects_public_code_uidx" ON "design_projects" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "design_projects_template_idx" ON "design_projects" USING btree ("garment_template_id");--> statement-breakpoint
CREATE INDEX "design_projects_owner_idx" ON "design_projects" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "design_versions_project_version_uidx" ON "design_versions" USING btree ("design_project_id","version_number");--> statement-breakpoint
CREATE INDEX "design_versions_project_idx" ON "design_versions" USING btree ("design_project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "design_layers_version_key_uidx" ON "design_layers" USING btree ("design_version_id","layer_key");--> statement-breakpoint
CREATE INDEX "design_layers_version_idx" ON "design_layers" USING btree ("design_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "design_palette_mappings_version_layer_uidx" ON "design_palette_mappings" USING btree ("design_version_id","layer_key");--> statement-breakpoint
CREATE INDEX "design_palette_mappings_version_idx" ON "design_palette_mappings" USING btree ("design_version_id");--> statement-breakpoint
CREATE INDEX "design_previews_version_idx" ON "design_previews" USING btree ("design_version_id");--> statement-breakpoint
CREATE INDEX "design_comments_version_idx" ON "design_comments" USING btree ("design_version_id");--> statement-breakpoint
CREATE INDEX "design_reviews_version_idx" ON "design_reviews" USING btree ("design_version_id");
