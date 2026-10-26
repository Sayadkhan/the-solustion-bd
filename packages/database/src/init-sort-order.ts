import { db, pool } from "./client";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const cats = await db.execute(sql`SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name;`);
    for (let i = 0; i < cats.rows.length; i++) {
      const cat = cats.rows[i] as any;
      await db.execute(sql`UPDATE categories SET sort_order = ${i + 1} WHERE id = ${cat.id};`);
      console.log(`Updated ${cat.name} to serial ${i + 1}`);
    }
    console.log("✅ Initialized sort_order for all main categories!");
  } catch (err: any) {
    console.error("Error updating sort_order:", err.message);
  } finally {
    await pool.end();
  }
}

run();
