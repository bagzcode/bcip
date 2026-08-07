CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."grounding_result" AS ENUM('grounded', 'insufficient_evidence', 'refused', 'contested');--> statement-breakpoint
CREATE TYPE "public"."evidence_label" AS ENUM('documented_claim', 'contributor_interpretation', 'inference', 'contested_claim', 'insufficient_evidence');--> statement-breakpoint
CREATE TYPE "public"."answer_feedback_kind" AS ENUM('useful', 'incorrect', 'incomplete', 'culturally_inappropriate', 'permission_concern');--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_message_id" text,
	"assistant_message_id" text,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"policy_version" text NOT NULL,
	"grounding_result" "grounding_result" NOT NULL,
	"evidence_label" "evidence_label" NOT NULL,
	"confidence" text DEFAULT 'none' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retrieval_results" (
	"id" text PRIMARY KEY NOT NULL,
	"assistant_run_id" text NOT NULL,
	"source_fragment_id" text NOT NULL,
	"rank" integer NOT NULL,
	"score" text NOT NULL,
	"access_tier_snapshot" "access_tier" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answer_citations" (
	"id" text PRIMARY KEY NOT NULL,
	"assistant_run_id" text NOT NULL,
	"source_fragment_id" text NOT NULL,
	"claim_id" text,
	"evidence_label" "evidence_label" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answer_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"assistant_run_id" text NOT NULL,
	"user_id" text,
	"kind" "answer_feedback_kind" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_runs" ADD CONSTRAINT "assistant_runs_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_runs" ADD CONSTRAINT "assistant_runs_user_message_id_chat_messages_id_fk" FOREIGN KEY ("user_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_runs" ADD CONSTRAINT "assistant_runs_assistant_message_id_chat_messages_id_fk" FOREIGN KEY ("assistant_message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_results" ADD CONSTRAINT "retrieval_results_assistant_run_id_assistant_runs_id_fk" FOREIGN KEY ("assistant_run_id") REFERENCES "public"."assistant_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_results" ADD CONSTRAINT "retrieval_results_source_fragment_id_source_fragments_id_fk" FOREIGN KEY ("source_fragment_id") REFERENCES "public"."source_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_citations" ADD CONSTRAINT "answer_citations_assistant_run_id_assistant_runs_id_fk" FOREIGN KEY ("assistant_run_id") REFERENCES "public"."assistant_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_citations" ADD CONSTRAINT "answer_citations_source_fragment_id_source_fragments_id_fk" FOREIGN KEY ("source_fragment_id") REFERENCES "public"."source_fragments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_citations" ADD CONSTRAINT "answer_citations_claim_id_knowledge_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."knowledge_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_feedback" ADD CONSTRAINT "answer_feedback_assistant_run_id_assistant_runs_id_fk" FOREIGN KEY ("assistant_run_id") REFERENCES "public"."assistant_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_feedback" ADD CONSTRAINT "answer_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_sessions_user_idx" ON "chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_session_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "assistant_runs_session_idx" ON "assistant_runs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "assistant_runs_grounding_idx" ON "assistant_runs" USING btree ("grounding_result");--> statement-breakpoint
CREATE INDEX "retrieval_results_run_idx" ON "retrieval_results" USING btree ("assistant_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "retrieval_results_run_fragment_uidx" ON "retrieval_results" USING btree ("assistant_run_id","source_fragment_id");--> statement-breakpoint
CREATE INDEX "answer_citations_run_idx" ON "answer_citations" USING btree ("assistant_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "answer_citations_run_fragment_uidx" ON "answer_citations" USING btree ("assistant_run_id","source_fragment_id");--> statement-breakpoint
CREATE INDEX "answer_feedback_run_idx" ON "answer_feedback" USING btree ("assistant_run_id");--> statement-breakpoint
CREATE INDEX "answer_feedback_user_idx" ON "answer_feedback" USING btree ("user_id");
