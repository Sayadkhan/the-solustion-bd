import { db, categories, eq } from "./index.js";

async function migrateStarTechCategories() {
  console.log("=================================================");
  console.log("⭐ Migrating to Star Tech Main & Sub-Category Tree");
  console.log("=================================================");

  // 1. Define Main Categories (Star Tech style)
  // Some will have sub-categories, some will be STANDALONE without sub-categories
  const mainCategoriesData = [
    {
      slug: "component",
      name: "Component",
      icon: "Cpu",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Brand", "Warranty"],
    },
    {
      slug: "desktop",
      name: "Desktop",
      icon: "Monitor",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Processor Type", "RAM", "Graphics", "Form Factor"],
    },
    {
      slug: "laptop",
      name: "Laptop",
      icon: "Laptop",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Processor", "Display Size", "RAM", "Storage"],
    },
    {
      slug: "monitor-main",
      name: "Monitor",
      icon: "Tv",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Screen Size", "Refresh Rate", "Resolution", "Panel Type"],
    },
    {
      slug: "networking",
      name: "Networking",
      icon: "Wifi",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Network Standard", "Speed", "Antenna"],
    },
    {
      slug: "accessories",
      name: "Accessories",
      icon: "Headphones",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Type", "Interface", "Color"],
    },
    {
      slug: "ups",
      name: "Power / UPS",
      icon: "Zap",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["Capacity VA", "Backup Time"],
    },
    // Standalone Main Categories without Sub-Categories (Star Tech style)
    {
      slug: "software",
      name: "Software",
      icon: "Code",
      isFeaturedInMegaMenu: true,
      filterableAttributes: ["License Type", "Platform"],
    },
    {
      slug: "server-storage",
      name: "Server & Storage",
      icon: "Server",
      isFeaturedInMegaMenu: false,
      filterableAttributes: ["Rack Units", "Drive Bays"],
    },
    {
      slug: "gadget",
      name: "Gadget",
      icon: "Sparkles",
      isFeaturedInMegaMenu: false,
      filterableAttributes: ["Type", "Connectivity"],
    },
  ];

  const mainCategoryMap = new Map<string, string>();

  for (const mainCat of mainCategoriesData) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, mainCat.slug),
    });

    if (existing) {
      mainCategoryMap.set(mainCat.slug, existing.id);
      console.log(`  ✓ Main category exists: ${mainCat.name} (${existing.id})`);
    } else {
      const [inserted] = await db
        .insert(categories)
        .values({
          id: crypto.randomUUID(),
          slug: mainCat.slug,
          name: mainCat.name,
          icon: mainCat.icon,
          isFeaturedInMegaMenu: mainCat.isFeaturedInMegaMenu,
          filterableAttributes: mainCat.filterableAttributes,
          parentId: null, // Root/Main category
        })
        .returning();
      mainCategoryMap.set(mainCat.slug, inserted.id);
      console.log(`  + Created main category: ${mainCat.name} (${inserted.id})`);
    }
  }

  const componentId = mainCategoryMap.get("component")!;
  const desktopId = mainCategoryMap.get("desktop")!;
  const laptopId = mainCategoryMap.get("laptop")!;
  const monitorMainId = mainCategoryMap.get("monitor-main")!;
  const networkingId = mainCategoryMap.get("networking")!;
  const accessoriesId = mainCategoryMap.get("accessories")!;

  // 2. Attach existing component sub-categories under "Component"
  const existingComponentSlugs = [
    "processor",
    "motherboard",
    "graphics-card",
    "ram",
    "storage",
    "power-supply",
    "casing",
    "cooling",
  ];

  for (const slug of existingComponentSlugs) {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    if (cat) {
      await db
        .update(categories)
        .set({ parentId: componentId })
        .where(eq(categories.id, cat.id));
      console.log(`  -> Linked sub-category "${cat.name}" under Component`);
    }
  }

  // Also link existing 'monitor' under 'monitor-main'
  const monitorCat = await db.query.categories.findFirst({
    where: eq(categories.slug, "monitor"),
  });
  if (monitorCat) {
    await db
      .update(categories)
      .set({ parentId: monitorMainId, name: "Gaming & Desktop Monitors" })
      .where(eq(categories.id, monitorCat.id));
    console.log(`  -> Linked sub-category "Gaming & Desktop Monitors" under Monitor`);
  }

  // 3. Add Star Tech Sub-categories for Desktop, Laptop, Networking, Accessories
  const newSubCategories = [
    // Desktop Sub-categories
    {
      slug: "gaming-desktop",
      name: "Gaming Desktop PC",
      parentId: desktopId,
      icon: "Monitor",
      filterableAttributes: ["CPU", "GPU", "RAM"],
    },
    {
      slug: "brand-pc",
      name: "Brand PC (HP, Dell, Asus)",
      parentId: desktopId,
      icon: "Monitor",
      filterableAttributes: ["Brand", "Processor"],
    },
    {
      slug: "all-in-one-pc",
      name: "All-in-One PC",
      parentId: desktopId,
      icon: "Monitor",
      filterableAttributes: ["Display Size", "Processor"],
    },
    // Laptop Sub-categories
    {
      slug: "gaming-laptop",
      name: "Gaming Laptop",
      parentId: laptopId,
      icon: "Laptop",
      filterableAttributes: ["GPU", "Refresh Rate", "Screen Size"],
    },
    {
      slug: "ultrabook",
      name: "Premium Ultrabook",
      parentId: laptopId,
      icon: "Laptop",
      filterableAttributes: ["Battery Life", "Weight", "Screen Size"],
    },
    // Networking Sub-categories
    {
      slug: "wifi-router",
      name: "WiFi Routers (WiFi 6 / 7)",
      parentId: networkingId,
      icon: "Wifi",
      filterableAttributes: ["Band", "Speed", "Coverage"],
    },
    {
      slug: "network-switch",
      name: "Network Switches",
      parentId: networkingId,
      icon: "Layers",
      filterableAttributes: ["Port Count", "Gigabit / 10G"],
    },
    // Accessories Sub-categories
    {
      slug: "gaming-keyboard",
      name: "Mechanical Keyboards",
      parentId: accessoriesId,
      icon: "Keyboard",
      filterableAttributes: ["Switch Type", "Backlight", "Connection"],
    },
    {
      slug: "gaming-mouse",
      name: "Gaming Mice",
      parentId: accessoriesId,
      icon: "Mouse",
      filterableAttributes: ["DPI", "Sensor", "Wireless"],
    },
    {
      slug: "gaming-headphone",
      name: "Headphones & Headsets",
      parentId: accessoriesId,
      icon: "Headphones",
      filterableAttributes: ["Surround Sound", "Mic", "Wireless"],
    },
  ];

  for (const sub of newSubCategories) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, sub.slug),
    });
    if (!existing) {
      await db.insert(categories).values({
        id: crypto.randomUUID(),
        slug: sub.slug,
        name: sub.name,
        parentId: sub.parentId,
        icon: sub.icon,
        isFeaturedInMegaMenu: true,
        filterableAttributes: sub.filterableAttributes,
      });
      console.log(`  + Created new sub-category: ${sub.name}`);
    }
  }

  console.log("=================================================");
  console.log("✅ Star Tech Category Hierarchy migration complete!");
  console.log("=================================================");
}

migrateStarTechCategories()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
