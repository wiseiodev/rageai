CREATE TYPE "public"."host_app" AS ENUM('claude', 'codex');--> statement-breakpoint
CREATE TYPE "public"."rage_intensity" AS ENUM('mild', 'standard', 'strong');--> statement-breakpoint
CREATE TYPE "public"."window_kind" AS ENUM('daily', 'weekly', 'all_time');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp with time zone,
	"enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	"request_count" integer DEFAULT 0 NOT NULL,
	"remaining" integer,
	"last_request" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"permissions" text,
	"metadata" jsonb,
	CONSTRAINT "api_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "device_auth_request" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code_hash" text NOT NULL,
	"user_code_hash" text NOT NULL,
	"install_id_hash" text NOT NULL,
	"device_label" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text,
	"api_key_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_auth_request_device_code_hash_unique" UNIQUE("device_code_hash"),
	CONSTRAINT "device_auth_request_user_code_hash_unique" UNIQUE("user_code_hash")
);
--> statement-breakpoint
CREATE TABLE "leaderboard_row" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"user_id" text NOT NULL,
	"install_id_hash" text NOT NULL,
	"handle" text NOT NULL,
	"host_app" "host_app" NOT NULL,
	"window" "window_kind" NOT NULL,
	"window_start" timestamp with time zone,
	"window_end" timestamp with time zone,
	"user_message_count" integer NOT NULL,
	"user_word_count" integer NOT NULL,
	"scored_profanity_count" integer NOT NULL,
	"rate_per_thousand_words" numeric(12, 2) NOT NULL,
	"top_intensity" "rage_intensity",
	"rank_eligible" boolean NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_action" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_abuse_bucket" (
	"bucket_hash" text NOT NULL,
	"bucket_kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "private_abuse_bucket_bucket_hash_bucket_kind_pk" PRIMARY KEY("bucket_hash","bucket_kind")
);
--> statement-breakpoint
CREATE TABLE "rage_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"handle_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"install_id_hash" text NOT NULL,
	"ip_bucket_hash" text,
	"host_app" "host_app" NOT NULL,
	"handle" text NOT NULL,
	"plugin_version" text NOT NULL,
	"ruleset_version" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"accepted" boolean DEFAULT true NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_auth_request" ADD CONSTRAINT "device_auth_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_row" ADD CONSTRAINT "leaderboard_row_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_row" ADD CONSTRAINT "leaderboard_row_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_action" ADD CONSTRAINT "moderation_action_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rage_profile" ADD CONSTRAINT "rage_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_user_id_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_auth_request_status_idx" ON "device_auth_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "device_auth_request_expires_at_idx" ON "device_auth_request" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_row_replacement_key" ON "leaderboard_row" USING btree ("user_id","install_id_hash","host_app","window");--> statement-breakpoint
CREATE INDEX "leaderboard_row_ranking_idx" ON "leaderboard_row" USING btree ("window","host_app","rank_eligible","hidden","rate_per_thousand_words");--> statement-breakpoint
CREATE INDEX "private_abuse_bucket_expires_at_idx" ON "private_abuse_bucket" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rage_profile_handle_idx" ON "rage_profile" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submission_user_install_host_idx" ON "submission" USING btree ("user_id","install_id_hash","host_app");--> statement-breakpoint
CREATE INDEX "submission_created_at_idx" ON "submission" USING btree ("created_at");