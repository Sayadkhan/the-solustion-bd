import { pool } from "@solusation/database";

async function runMigration() {
  const queries = [
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS gtm_id VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS ga_measurement_id VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_search_console_code TEXT DEFAULT ''`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS default_meta_title TEXT DEFAULT 'The Solutions BD | High-Performance PC & Tech Store in Bangladesh'`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS default_meta_description TEXT DEFAULT 'Buy authentic Processors, Graphics Cards, Motherboards, Gaming PCs & Tech Hardware in Bangladesh at lowest prices with official warranty from The Solutions BD.'`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS default_meta_keywords TEXT DEFAULT 'computer shop bd, pc price bangladesh, gaming pc bd, ryzen processor price bd, graphics card bd'`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS robots_txt TEXT DEFAULT 'User-agent: *\nAllow: /\nSitemap: https://thesolutionsbd.com/sitemap.xml'`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_head_script TEXT DEFAULT ''`,
    `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_body_script TEXT DEFAULT ''`,
  ];

  for (const q of queries) {
    await pool.query(q);
  }

  console.log("Migration executed successfully!");
  process.exit(0);
}

runMigration().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
