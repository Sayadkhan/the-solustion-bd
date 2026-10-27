import { db } from "../client";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Creating banners table in PostgreSQL...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "banners" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "type" varchar(50) NOT NULL DEFAULT 'HERO',
      "tag" varchar(100),
      "title" text NOT NULL,
      "subtitle" text,
      "image" text NOT NULL,
      "button_text" varchar(100) DEFAULT 'Shop Now',
      "button_link" varchar(255) DEFAULT '/products',
      "bg_gradient" varchar(255) DEFAULT 'from-blue-700 via-indigo-900 to-slate-950',
      "sort_order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_banners_type" ON "banners" ("type");
    CREATE INDEX IF NOT EXISTS "idx_banners_is_active" ON "banners" ("is_active");
    CREATE INDEX IF NOT EXISTS "idx_banners_sort_order" ON "banners" ("sort_order");
  `);

  console.log("Checking if initial banners exist...");
  const countResult: any = await db.execute(sql`SELECT COUNT(*) as count FROM "banners"`);
  const count = parseInt(countResult[0]?.count || "0", 10);

  if (count === 0) {
    console.log("Seeding default Hero Slider & Promo Side Banners...");

    // Hero Slide 1
    await db.execute(sql`
      INSERT INTO "banners" ("type", "tag", "title", "subtitle", "image", "button_text", "button_link", "bg_gradient", "sort_order", "is_active")
      VALUES (
        'HERO',
        '10.10 MEGA SALE',
        '১০.১০ টেক মেগা অফার!',
        'Up to 40% Off on Gaming Laptops, RTX 40 Series & AMD AM5 BattleStations',
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=80',
        'Shop Mega Deals',
        '/products?deals=true',
        'from-blue-700 via-indigo-900 to-slate-950',
        1,
        true
      );
    `);

    // Hero Slide 2
    await db.execute(sql`
      INSERT INTO "banners" ("type", "tag", "title", "subtitle", "image", "button_text", "button_link", "bg_gradient", "sort_order", "is_active")
      VALUES (
        'HERO',
        'CUSTOM RIG SIMULATOR',
        'Build Your Dream BattleStation',
        'Real-time TDP wattage check, 100% box serial warranty tracking & instant quotation',
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=80',
        'Launch PC Builder',
        '/pc-builder',
        'from-blue-800 via-indigo-900 to-slate-950',
        2,
        true
      );
    `);

    // Hero Slide 3
    await db.execute(sql`
      INSERT INTO "banners" ("type", "tag", "title", "subtitle", "image", "button_text", "button_link", "bg_gradient", "sort_order", "is_active")
      VALUES (
        'HERO',
        'OFFICIAL WARRANTY',
        'AMD Ryzen 9000 & 7000X3D Series',
        'Experience world-record FPS gaming with 3D V-Cache architecture in Bangladesh',
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1000&auto=format&fit=crop&q=80',
        'Explore Processors',
        '/products?category=processor',
        'from-cyan-700 via-blue-900 to-slate-950',
        3,
        true
      );
    `);

    // Side Promo Card 1
    await db.execute(sql`
      INSERT INTO "banners" ("type", "tag", "title", "subtitle", "image", "button_text", "button_link", "bg_gradient", "sort_order", "is_active")
      VALUES (
        'PROMO_SIDE',
        'Customer Support & RMA',
        'আপনার যেকোনো অভিযোগ বা মতামত জানান',
        'বক্স সিরিয়াল ওয়ারেন্টি ও আফটার সেলস সাপোর্ট পান দ্রুততম সময়ে।',
        '',
        'জানান এখানে 👉',
        '/track-order',
        'from-[#0e3c88] to-[#122444]',
        1,
        true
      );
    `);

    // Side Promo Card 2
    await db.execute(sql`
      INSERT INTO "banners" ("type", "tag", "title", "subtitle", "image", "button_text", "button_link", "bg_gradient", "sort_order", "is_active")
      VALUES (
        'PROMO_SIDE',
        'Custom Rig & B2B Solutions',
        'Shape Your Dream Battlestation With Us!',
        'Official distributor warranty & nationwide fast delivery across Bangladesh.',
        '',
        'Build Your PC',
        '/pc-builder',
        'from-[#1e3a8a] to-[#0f172a]',
        2,
        true
      );
    `);

    console.log("Successfully seeded initial banners!");
  } else {
    console.log(`Banners table already contains ${count} rows.`);
  }

  console.log("Migration complete!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
