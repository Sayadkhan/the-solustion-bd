import { pool } from "../index";

async function run() {
  try {
    await pool.query(`
      ALTER TABLE site_settings 
      ADD COLUMN IF NOT EXISTS secondary_phone text DEFAULT '01711-319090',
      ADD COLUMN IF NOT EXISTS landline_phone text DEFAULT '9183295',
      ADD COLUMN IF NOT EXISTS ceo_name text DEFAULT 'Md. Raihan Kabir',
      ADD COLUMN IF NOT EXISTS ceo_designation text DEFAULT 'CEO, BSC. Eng (Hons.) in CSE',
      ADD COLUMN IF NOT EXISTS ceo_phone text DEFAULT '01922-730343',
      ADD COLUMN IF NOT EXISTS gulshan_address text DEFAULT 'House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212',
      ADD COLUMN IF NOT EXISTS idb_address text DEFAULT 'SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207',
      ADD COLUMN IF NOT EXISTS website_url text DEFAULT 'https://thesolutionsbd.com';

      UPDATE site_settings SET 
        contact_email = 'thesolutionsbd@gmail.com',
        hotline_number = '01711-319090',
        whatsapp_number = '01922-730343',
        secondary_phone = '01711-319090',
        landline_phone = '9183295',
        ceo_name = 'Md. Raihan Kabir',
        ceo_designation = 'CEO, BSC. Eng (Hons.) in CSE',
        ceo_phone = '01922-730343',
        gulshan_address = 'House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212',
        idb_address = 'SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207',
        website_url = 'https://thesolutionsbd.com',
        logo_light_url = '/logo.png',
        logo_dark_url = '/logo.png';
    `);
    console.log("✅ Successfully updated site_settings table with visiting card information!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

run();
