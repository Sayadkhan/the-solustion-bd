CREATE TYPE "public"."branch_code" AS ENUM('IDB', 'MULTIPLAN', 'UTTARA', 'AGRABAD', 'ONLINE_WAREHOUSE');--> statement-breakpoint
CREATE TYPE "public"."component_type" AS ENUM('CPU', 'MOBO', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'MONITOR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."courier_provider" AS ENUM('PATHAO', 'STEADFAST', 'REDX', 'STORE_PICKUP');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ_CARD', 'BANK_EMI');--> statement-breakpoint
CREATE TYPE "public"."pricing_tier" AS ENUM('CASH', 'REGULAR');--> statement-breakpoint
CREATE TYPE "public"."serial_status" AS ENUM('IN_STOCK', 'SOLD', 'RMA_CLAIMED', 'REPLACED');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('IN_STOCK', 'OUT_OF_STOCK', 'UPCOMING', 'PRE_ORDER', 'CALL_FOR_PRICE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'BRANCH_STAFF', 'CUSTOMER');--> statement-breakpoint
CREATE TABLE "branch_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_code" "branch_code" NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"slug" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"filterable_attributes" jsonb DEFAULT '[]'::jsonb,
	"is_featured_in_mega_menu" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_bdt" integer NOT NULL,
	"assigned_serials" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_no" varchar(50) NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_email" varchar(255),
	"district" varchar(100) NOT NULL,
	"area" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"pricing_tier_used" "pricing_tier" DEFAULT 'CASH' NOT NULL,
	"emi_tenure_months" integer DEFAULT 0 NOT NULL,
	"total_payable_bdt" integer NOT NULL,
	"paid_amount_bdt" integer DEFAULT 0 NOT NULL,
	"due_amount_bdt" integer DEFAULT 0 NOT NULL,
	"trx_id" varchar(100),
	"courier_provider" "courier_provider" DEFAULT 'STEADFAST' NOT NULL,
	"consignment_id" varchar(100),
	"order_status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_invoice_no_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "product_serials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_name" text NOT NULL,
	"status" serial_status DEFAULT 'IN_STOCK' NOT NULL,
	"order_id" uuid,
	"warranty_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_serials_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"brand_id" uuid,
	"category_id" uuid,
	"images" jsonb DEFAULT '[]'::jsonb,
	"key_features" jsonb DEFAULT '[]'::jsonb,
	"cash_price_bdt" integer NOT NULL,
	"regular_price_bdt" integer NOT NULL,
	"cost_price_bdt" integer,
	"is_emi_available" boolean DEFAULT true NOT NULL,
	"total_stock" integer DEFAULT 0 NOT NULL,
	"stock_status" "stock_status" DEFAULT 'IN_STOCK' NOT NULL,
	"specifications" jsonb DEFAULT '[]'::jsonb,
	"compatibility" jsonb,
	"warranty_duration_months" integer DEFAULT 12 NOT NULL,
	"warranty_terms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_pc_builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_code" varchar(50) NOT NULL,
	"user_id" uuid,
	"is_simulator_build" boolean DEFAULT false NOT NULL,
	"components" jsonb NOT NULL,
	"total_wattage" integer DEFAULT 0 NOT NULL,
	"total_cash_price_bdt" integer DEFAULT 0 NOT NULL,
	"unlocked_promo_code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_pc_builds_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo_light_url" text DEFAULT '/images/logo-light.png' NOT NULL,
	"logo_dark_url" text DEFAULT '/images/logo-dark.png' NOT NULL,
	"contact_email" text DEFAULT 'support@thesolusationbd.com' NOT NULL,
	"whatsapp_number" text DEFAULT '+8801700000000' NOT NULL,
	"hotline_number" text DEFAULT '+8801700000000' NOT NULL,
	"header_notice_text" text DEFAULT '⚡ Special Flash Sale: Get instant cash discount on selected Intel 14th Gen & AMD Ryzen 9000 Processors!' NOT NULL,
	"usd_to_bdt_rate" numeric(10, 2) DEFAULT '122.50' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_branch_inventory_product_branch" ON "branch_inventory" USING btree ("product_id","branch_code");--> statement-breakpoint
CREATE INDEX "idx_branch_inventory_branch" ON "branch_inventory" USING btree ("branch_code");--> statement-breakpoint
CREATE INDEX "idx_brands_slug" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_categories_parent_id" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orders_invoice_no" ON "orders" USING btree ("invoice_no");--> statement-breakpoint
CREATE INDEX "idx_orders_customer_phone" ON "orders" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "idx_product_serials_number" ON "product_serials" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "idx_product_serials_product_id" ON "product_serials" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_serials_status" ON "product_serials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_product_serials_order_id" ON "product_serials" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_products_sku" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_products_slug" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_products_brand_id" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_stock_status" ON "products" USING btree ("stock_status");--> statement-breakpoint
CREATE INDEX "idx_products_compatibility_gin" ON "products" USING gin ("compatibility");--> statement-breakpoint
CREATE INDEX "idx_saved_pc_builds_code" ON "saved_pc_builds" USING btree ("short_code");