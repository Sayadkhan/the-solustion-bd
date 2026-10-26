import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  stockStatusEnum,
  branchCodeEnum,
  serialStatusEnum,
  paymentMethodEnum,
  pricingTierEnum,
  courierProviderEnum,
  orderStatusEnum,
  userRoleEnum,
  inquiryStatusEnum,
  blogStatusEnum,
} from "./enums";

// 1. Categories Table (Hierarchical tree with self-referencing parent_id)
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: text("name").notNull(),
    icon: text("icon"),
    filterableAttributes: jsonb("filterable_attributes").$type<string[]>().default([]),
    isFeaturedInMegaMenu: boolean("is_featured_in_mega_menu").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_categories_slug").on(t.slug),
    index("idx_categories_parent_id").on(t.parentId),
  ]
);

// 2. Brands Table
export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("idx_brands_slug").on(t.slug)]
);

// 3. Products Table (Bangladeshi Dual Pricing, GIN-indexed compatibility & specs)
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    brandId: uuid("brand_id").references(() => brands.id),
    categoryId: uuid("category_id").references(() => categories.id),
    images: jsonb("images").$type<string[]>().default([]),
    keyFeatures: jsonb("key_features").$type<string[]>().default([]),

    // Bangladeshi Dual Pricing columns (Stored as whole integer BDT)
    cashPriceBdt: integer("cash_price_bdt").notNull(),
    regularPriceBdt: integer("regular_price_bdt").notNull(),
    costPriceBdt: integer("cost_price_bdt"),
    isEmiAvailable: boolean("is_emi_available").notNull().default(true),

    // Stock summary
    totalStock: integer("total_stock").notNull().default(0),
    stockStatus: stockStatusEnum("stock_status").notNull().default("IN_STOCK"),

    // Specifications
    specifications: jsonb("specifications")
      .$type<Array<{ group: string; label: string; value: string }>>()
      .default([]),

    // Hardware Compatibility (Typed with GIN index for ultra-fast PC Builder lookups)
    compatibility: jsonb("compatibility").$type<{
      componentType:
        | "CPU"
        | "MOBO"
        | "RAM"
        | "GPU"
        | "STORAGE"
        | "PSU"
        | "CASE"
        | "COOLER"
        | "MONITOR"
        | "OTHER";
      socket?: string | null;
      supportedRam?: string | null;
      tdpWatts?: number;
      formFactor?: string | null;
      psuWattage?: number | null;
      benchmarkScore?: number;
    }>(),

    warrantyDurationMonths: integer("warranty_duration_months").notNull().default(12),
    warrantyTerms: text("warranty_terms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_products_sku").on(t.sku),
    index("idx_products_slug").on(t.slug),
    index("idx_products_brand_id").on(t.brandId),
    index("idx_products_category_id").on(t.categoryId),
    index("idx_products_stock_status").on(t.stockStatus),
    index("idx_products_compatibility_gin").using("gin", t.compatibility),
  ]
);

// 4. Branch Inventory Table (Multi-branch physical stock tracking)
export const branchInventory = pgTable(
  "branch_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    branchCode: branchCodeEnum("branch_code").notNull(),
    stock: integer("stock").notNull().default(0),
  },
  (t) => [
    uniqueIndex("uidx_branch_inventory_product_branch").on(t.productId, t.branchCode),
    index("idx_branch_inventory_branch").on(t.branchCode),
  ]
);

// 5. Orders Table
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNo: varchar("invoice_no", { length: 50 }).notNull().unique(),
    customerName: text("customer_name").notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    district: varchar("district", { length: 100 }).notNull(),
    area: varchar("area", { length: 100 }).notNull(),
    address: text("address").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    pricingTierUsed: pricingTierEnum("pricing_tier_used").notNull().default("CASH"),
    emiTenureMonths: integer("emi_tenure_months").notNull().default(0),
    totalPayableBdt: integer("total_payable_bdt").notNull(),
    paidAmountBdt: integer("paid_amount_bdt").notNull().default(0),
    dueAmountBdt: integer("due_amount_bdt").notNull().default(0),
    trxId: varchar("trx_id", { length: 100 }),
    courierProvider: courierProviderEnum("courier_provider").notNull().default("STEADFAST"),
    consignmentId: varchar("consignment_id", { length: 100 }),
    orderStatus: orderStatusEnum("order_status").notNull().default("PENDING"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orders_invoice_no").on(t.invoiceNo),
    index("idx_orders_customer_phone").on(t.customerPhone),
    index("idx_orders_status").on(t.orderStatus),
  ]
);

// 6. Order Items Table
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    productName: varchar("product_name", { length: 255 }).notNull(),
    qty: integer("qty").notNull().default(1),
    unitPriceBdt: integer("unit_price_bdt").notNull(),
    assignedSerials: jsonb("assigned_serials").$type<string[]>().default([]),
  },
  (t) => [
    index("idx_order_items_order_id").on(t.orderId),
    index("idx_order_items_product_id").on(t.productId),
  ]
);

// 7. Product Serials Table (Rule 4.4 Box Serial Warranty Tracking)
export const productSerials = pgTable(
  "product_serials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    supplierName: text("supplier_name").notNull(),
    status: serialStatusEnum("status").notNull().default("IN_STOCK"),
    orderId: uuid("order_id").references(() => orders.id),
    warrantyExpiresAt: timestamp("warranty_expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_product_serials_number").on(t.serialNumber),
    index("idx_product_serials_product_id").on(t.productId),
    index("idx_product_serials_status").on(t.status),
    index("idx_product_serials_order_id").on(t.orderId),
  ]
);

// 8. Saved PC Builds Table
export const savedPcBuilds = pgTable(
  "saved_pc_builds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortCode: varchar("short_code", { length: 50 }).notNull().unique(),
    userId: uuid("user_id"),
    isSimulatorBuild: boolean("is_simulator_build").notNull().default(false),
    components: jsonb("components").$type<Record<string, string>>().notNull(), // Slot to productId map
    totalWattage: integer("total_wattage").notNull().default(0),
    totalCashPriceBdt: integer("total_cash_price_bdt").notNull().default(0),
    unlockedPromoCode: varchar("unlocked_promo_code", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_saved_pc_builds_code").on(t.shortCode)]
);

// 9. Site Settings Table (Single-row configuration)
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  logoLightUrl: text("logo_light_url").notNull().default("/logo.png"),
  logoDarkUrl: text("logo_dark_url").notNull().default("/logo.png"),
  contactEmail: text("contact_email").notNull().default("thesolutionsbd@gmail.com"),
  whatsappNumber: text("whatsapp_number").notNull().default("01922-730343"),
  hotlineNumber: text("hotline_number").notNull().default("01711-319090"),
  secondaryPhone: text("secondary_phone").default("01711-319090"),
  landlinePhone: text("landline_phone").default("9183295"),
  ceoName: text("ceo_name").default("Md. Raihan Kabir"),
  ceoDesignation: text("ceo_designation").default("CEO, BSC. Eng (Hons.) in CSE"),
  ceoPhone: text("ceo_phone").default("01922-730343"),
  gulshanAddress: text("gulshan_address").default(
    "House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212"
  ),
  idbAddress: text("idb_address").default(
    "SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207"
  ),
  websiteUrl: text("website_url").default("https://thesolutionsbd.com"),
  headerNoticeText: text("header_notice_text")
    .notNull()
    .default(
      "⚡ Special Flash Sale: Get instant cash discount on selected Intel 14th Gen & AMD Ryzen 9000 Processors!"
    ),
  usdToBdtRate: numeric("usd_to_bdt_rate", { precision: 10, scale: 2 })
    .notNull()
    .default("122.50"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 9.1 Banners Table (Hero Carousel & Promotional Banners)
export const banners = pgTable(
  "banners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 50 }).notNull().default("HERO"), // 'HERO' | 'PROMO_SIDE' | 'POPUP'
    tag: varchar("tag", { length: 100 }),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    image: text("image").notNull(),
    buttonText: varchar("button_text", { length: 100 }).default("Shop Now"),
    buttonLink: varchar("button_link", { length: 255 }).default("/products"),
    bgGradient: varchar("bg_gradient", { length: 255 }).default(
      "from-blue-700 via-indigo-900 to-slate-950"
    ),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_banners_type").on(t.type),
    index("idx_banners_is_active").on(t.isActive),
    index("idx_banners_sort_order").on(t.sortOrder),
  ]
);

// 10. Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("CUSTOMER"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    verificationCode: varchar("verification_code", { length: 10 }),
    verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
    resetPasswordToken: varchar("reset_password_token", { length: 100 }),
    resetPasswordExpiresAt: timestamp("reset_password_expires_at"),
    assignedBranch: branchCodeEnum("assigned_branch"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_users_email").on(t.email),
    index("idx_users_phone").on(t.phone),
    index("idx_users_role").on(t.role),
  ]
);

// 11. Sessions Table (HTTP-Only Refresh Token & Session Management)
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 50 }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_sessions_user_id").on(t.userId),
    index("idx_sessions_refresh_token_hash").on(t.refreshTokenHash),
  ]
);

// 12. Contact Inquiries Table (Customer / Corporate B2B quotation inquiries)
export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    companyName: text("company_name"),
    status: inquiryStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_contact_inquiries_email").on(t.email),
    index("idx_contact_inquiries_status").on(t.status),
  ]
);

// 13. Blogs Table (SEO & Content Marketing with Backlinks Support)
export const blogs = pgTable(
  "blogs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    featuredImage: text("featured_image"),
    authorId: uuid("author_id").references(() => users.id),
    authorName: text("author_name").notNull().default("The Solusation BD Editorial"),
    category: varchar("category", { length: 100 }).notNull().default("Tech Guide"),
    tags: jsonb("tags").$type<string[]>().default([]),
    status: blogStatusEnum("status").notNull().default("DRAFT"),
    viewCount: integer("view_count").notNull().default(0),
    readingTimeMinutes: integer("reading_time_minutes").notNull().default(3),

    // Advanced SEO & Canonical Authority
    metaTitle: varchar("meta_title", { length: 150 }),
    metaDescription: text("meta_description"),
    metaKeywords: jsonb("meta_keywords").$type<string[]>().default([]),
    canonicalUrl: text("canonical_url"),
    ogImage: text("og_image"),

    // Backlink Tracking Registry
    backlinks: jsonb("backlinks").$type<Array<{
      anchorText: string;
      url: string;
      rel: "dofollow" | "nofollow" | "sponsored" | "ugc";
      targetBlank: boolean;
    }>>().default([]),

    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_blogs_slug").on(t.slug),
    index("idx_blogs_status").on(t.status),
    index("idx_blogs_category").on(t.category),
    index("idx_blogs_created_at").on(t.createdAt),
  ]
);


