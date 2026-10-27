import { sql } from "drizzle-orm";
import { db } from "../client";

async function main() {
  console.log("Seeding sample YouTube video links to products...");
  
  // Set Ryzen 5 7600 review video
  await db.execute(sql`
    UPDATE "products" 
    SET "video_url" = 'https://www.youtube.com/watch?v=1b_j-L8u_iA' 
    WHERE "slug" = 'amd-ryzen-5-7600-am5-processor' OR "slug" LIKE '%7600%';
  `);

  // Set Ryzen 7 7800X3D review video
  await db.execute(sql`
    UPDATE "products" 
    SET "video_url" = 'https://www.youtube.com/watch?v=7LhWpydI_uM' 
    WHERE "slug" = 'amd-ryzen-7-7800x3d-gaming-processor' OR "slug" LIKE '%7800x3d%';
  `);

  console.log("Sample YouTube videos attached successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding sample video:", err);
  process.exit(1);
});
