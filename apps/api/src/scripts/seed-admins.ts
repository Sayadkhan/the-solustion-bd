import { pool } from "@solusation/database";
import bcrypt from "bcryptjs";

/**
 * Creates the staff accounts from environment variables. Passwords are never
 * stored in this repository.
 *
 *   SEED_ADMIN_PASSWORD=... SEED_SEO_PASSWORD=... pnpm --filter @solusation/api seed:admins
 *
 * An existing account keeps its password, so re-running this is safe. To replace
 * a password, also set SEED_RESET_PASSWORDS=true.
 */
const MIN_PASSWORD_LENGTH = 12;
const resetExisting = process.env.SEED_RESET_PASSWORDS === "true";

const ACCOUNTS = [
  {
    envVar: "SEED_ADMIN_PASSWORD",
    name: "Super Administrator",
    email: "admin@thesolutionsbd.com",
    phone: "01711319090",
    role: "SUPER_ADMIN",
  },
  {
    envVar: "SEED_SEO_PASSWORD",
    name: "SEO & Growth Sub-Admin",
    email: "seo@thesolutionsbd.com",
    phone: "01922730343",
    role: "SEO_MANAGER",
  },
] as const;

async function main() {
  // Checked first, so that a weak password changes nothing.
  for (const account of ACCOUNTS) {
    const password = process.env[account.envVar];
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`${account.envVar} must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }
  }

  await pool.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SEO_MANAGER'");

  for (const account of ACCOUNTS) {
    const password = process.env[account.envVar];

    if (!password) {
      console.log(`Skipping ${account.email}: ${account.envVar} is not set.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const onConflict = resetExisting
      ? "UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name"
      : "UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name";

    await pool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_email_verified)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO ${onConflict}`,
      [account.name, account.email, account.phone, passwordHash, account.role]
    );

    console.log(`${account.email}: account synced${resetExisting ? " and password replaced" : ""}.`);
  }

  // Password changes must end any session opened with the old password.
  if (resetExisting) {
    const emails = ACCOUNTS.filter((a) => process.env[a.envVar]).map((a) => a.email);
    await pool.query(
      `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))`,
      [emails]
    );
  }

  console.log("Setup completed successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Setup error:", e.message);
  process.exit(1);
});
