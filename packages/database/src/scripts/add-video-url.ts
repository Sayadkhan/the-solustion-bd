import { sql } from "drizzle-orm";
import { db } from "../client";

async function main() {
  console.log("Adding video_url column to products table...");
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "video_url" text;
  `);
  console.log("Successfully ensured video_url column exists on products table!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
