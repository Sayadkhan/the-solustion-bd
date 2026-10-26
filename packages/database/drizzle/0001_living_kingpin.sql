CREATE TYPE "public"."inquiry_status" AS ENUM('PENDING', 'CONTACTED', 'RESOLVED');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'BRANCH_MANAGER' BEFORE 'BRANCH_STAFF';--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"company_name" text,
	"status" "inquiry_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"user_agent" text,
	"ip_address" varchar(50),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"verification_code" varchar(10),
	"verification_code_expires_at" timestamp,
	"reset_password_token" varchar(100),
	"reset_password_expires_at" timestamp,
	"assigned_branch" "branch_code",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contact_inquiries_email" ON "contact_inquiries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_contact_inquiries_status" ON "contact_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_refresh_token_hash" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");