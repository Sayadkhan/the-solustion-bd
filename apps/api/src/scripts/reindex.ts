import { productSyncService } from "../services/productSyncService";
import { pool } from "@solusation/database";

async function main() {
  console.log("🔄 Starting Typesense Re-indexing for The Solusation BD...");
  const startTime = Date.now();

  try {
    const result = await productSyncService.syncAllProducts();
    const duration = Date.now() - startTime;
    if (result.success) {
      console.log(`✅ Successfully synced ${result.count} products into Typesense in ${duration}ms!`);
    } else {
      console.error("❌ Failed to sync products to Typesense.");
    }
  } catch (error) {
    console.error("❌ Error during reindex:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
