CREATE TYPE "public"."blog_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SEO_MANAGER' BEFORE 'BRANCH_MANAGER';--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) DEFAULT 'HERO' NOT NULL,
	"tag" varchar(100),
	"title" text NOT NULL,
	"subtitle" text,
	"image" text NOT NULL,
	"button_text" varchar(100) DEFAULT 'Shop Now',
	"button_link" varchar(255) DEFAULT '/products',
	"bg_gradient" varchar(255) DEFAULT 'from-blue-700 via-indigo-900 to-slate-950',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image" text,
	"author_id" uuid,
	"author_name" text DEFAULT 'The Solutions BD Editorial' NOT NULL,
	"category" varchar(100) DEFAULT 'Tech Guide' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" "blog_status" DEFAULT 'DRAFT' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"reading_time_minutes" integer DEFAULT 3 NOT NULL,
	"meta_title" varchar(150),
	"meta_description" text,
	"meta_keywords" jsonb DEFAULT '[]'::jsonb,
	"canonical_url" text,
	"og_image" text,
	"backlinks" jsonb DEFAULT '[]'::jsonb,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "logo_light_url" SET DEFAULT '/logo.png';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "logo_dark_url" SET DEFAULT '/logo.png';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "contact_email" SET DEFAULT 'thesolutionsbd@gmail.com';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "whatsapp_number" SET DEFAULT '01922-730343';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "hotline_number" SET DEFAULT '01711-319090';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "secondary_phone" text DEFAULT '01711-319090';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "landline_phone" text DEFAULT '9183295';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "ceo_name" text DEFAULT 'Md. Raihan Kabir';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "ceo_designation" text DEFAULT 'CEO, BSC. Eng (Hons.) in CSE';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "ceo_phone" text DEFAULT '01922-730343';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "gulshan_address" text DEFAULT 'House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "idb_address" text DEFAULT 'SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "website_url" text DEFAULT 'https://thesolutionsbd.com';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "gtm_id" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "ga_measurement_id" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "google_search_console_code" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "facebook_pixel_id" varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_meta_title" text DEFAULT 'The Solutions BD | High-Performance PC & Tech Store in Bangladesh';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_meta_description" text DEFAULT 'Buy authentic Processors, Graphics Cards, Motherboards, Gaming PCs & Tech Hardware in Bangladesh at lowest prices with official warranty from The Solutions BD.';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_meta_keywords" text DEFAULT 'computer shop bd, pc price bangladesh, gaming pc bd, ryzen processor price bd, graphics card bd';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "robots_txt" text DEFAULT 'User-agent: *
Allow: /
Sitemap: https://thesolutionsbd.com/sitemap.xml';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "custom_head_script" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "custom_body_script" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_banners_type" ON "banners" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_banners_is_active" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_banners_sort_order" ON "banners" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_blogs_slug" ON "blogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_blogs_status" ON "blogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_blogs_category" ON "blogs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_blogs_created_at" ON "blogs" USING btree ("created_at");