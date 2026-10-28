import { pool, db, users } from "@solusation/database";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Checking user_role enum...");
  const enumResult = await pool.query(
    "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'user_role'"
  );
  console.log("Current user_role values:", enumResult.rows.map((r: any) => r.enumlabel));

  // Add SEO_MANAGER if not present
  try {
    await pool.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SEO_MANAGER'");
    console.log("Ensured 'SEO_MANAGER' is present in user_role enum.");
  } catch (err: any) {
    console.log("Notice on ALTER TYPE:", err.message);
  }

  // Create or update Super Admin
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `INSERT INTO users (id, name, email, phone, password_hash, role, is_email_verified)
     VALUES (gen_random_uuid(), 'Super Administrator', 'admin@thesolutionsbd.com', '01711319090', $1, 'SUPER_ADMIN', true)
     ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'SUPER_ADMIN', name = 'Super Administrator'`,
    [adminPasswordHash]
  );
  console.log("Admin account synced: admin@thesolutionsbd.com / admin123");

  // Create or update SEO Manager (Sub Admin)
  const seoPasswordHash = await bcrypt.hash("seo123", 10);
  await pool.query(
    `INSERT INTO users (id, name, email, phone, password_hash, role, is_email_verified)
     VALUES (gen_random_uuid(), 'SEO & Growth Sub-Admin', 'seo@thesolutionsbd.com', '01922730343', $1, 'SEO_MANAGER', true)
     ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'SEO_MANAGER', name = 'SEO & Growth Sub-Admin'`,
    [seoPasswordHash]
  );
  console.log("SEO Manager account synced: seo@thesolutionsbd.com / seo123");

  // Also update admin@solusationbd.com with admin123 password just in case
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE email = 'admin@solusationbd.com'`,
    [adminPasswordHash]
  );

  console.log("Setup completed successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Setup error:", e);
  process.exit(1);
});
