import { db, pool } from "./client";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;`);
    console.log("✅ Successfully ensured sort_order column in categories table!");
  } catch (err: any) {
    console.error("Error adding sort_order:", err.message);
  } finally {
    await pool.end();
  }
}

run();
