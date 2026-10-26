import { pool } from "./client";

async function run() {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();

  try {
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "blog_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "blogs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "excerpt" text,
        "content" text NOT NULL,
        "featured_image" text,
        "author_id" uuid REFERENCES "users"("id"),
        "author_name" text DEFAULT 'The Solusation BD Editorial' NOT NULL,
        "category" varchar(100) DEFAULT 'Tech Guide' NOT NULL,
        "tags" jsonb DEFAULT '[]'::jsonb,
        "status" "blog_status" DEFAULT 'DRAFT' NOT NULL,
        "view_count" integer DEFAULT 0 NOT NULL,
        "reading_time_minutes" integer DEFAULT 3 NOT NULL,
        "meta_title" varchar(150),
        "meta_description" text,
        "meta_keywords" jsonb DEFAULT '[]'::jsonb,
        "canonical_url" text,
        "og_image" text,
        "backlinks" jsonb DEFAULT '[]'::jsonb,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS "idx_blogs_slug" ON "blogs" ("slug");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_blogs_status" ON "blogs" ("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_blogs_category" ON "blogs" ("category");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_blogs_created_at" ON "blogs" ("created_at");`);

    console.log("✅ Blogs table, indexes, and blog_status enum created successfully in PostgreSQL!");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
