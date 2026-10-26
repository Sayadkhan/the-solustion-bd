import { db, pool } from "./client";
import {
  categories,
  brands,
  products,
  branchInventory,
  productSerials,
  siteSettings,
} from "./schema";
import { BRANCH_CODES } from "@solusation/shared-types";
import crypto from "crypto";

async function main() {
  console.log("🌱 Starting idempotent database seed for The Solusation BD...");

  await db.transaction(async (tx) => {
    // 1. Site Settings (Idempotent single configuration row)
    console.log("  -> Seeding site_settings...");
    const existingSettings = await tx.select().from(siteSettings).limit(1);
    if (existingSettings.length === 0) {
      await tx.insert(siteSettings).values({
        id: crypto.randomUUID(),
        logoLightUrl: "/images/logo-light.png",
        logoDarkUrl: "/images/logo-dark.png",
        contactEmail: "support@thesolusationbd.com",
        whatsappNumber: "+8801700000000",
        hotlineNumber: "+8801700000000",
        headerNoticeText:
          "⚡ Special Flash Sale: Get instant cash discount on selected Intel 14th Gen & AMD Ryzen 9000 Processors!",
        usdToBdtRate: "122.50",
      });
    }

    // 2. Categories
    console.log("  -> Seeding categories...");
    const categoryData = [
      {
        slug: "processor",
        name: "Processors (CPU)",
        icon: "Cpu",
        filterableAttributes: ["Socket", "Generation", "Cores", "Series"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "motherboard",
        name: "Motherboards",
        icon: "CircuitBoard",
        filterableAttributes: ["Socket", "Chipset", "Form Factor", "Supported RAM"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "graphics-card",
        name: "Graphics Cards (GPU)",
        icon: "Layers",
        filterableAttributes: ["GPU Chipset", "VRAM Size", "Memory Type"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "ram",
        name: "RAM (Memory)",
        icon: "Box",
        filterableAttributes: ["Memory Type", "Capacity", "Bus Speed"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "storage",
        name: "Storage (SSD / HDD)",
        icon: "HardDrive",
        filterableAttributes: ["Form Factor", "Interface", "Capacity"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "power-supply",
        name: "Power Supplies (PSU)",
        icon: "Zap",
        filterableAttributes: ["Wattage", "Efficiency Rating", "Modularity"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "casing",
        name: "Casings",
        icon: "Box",
        filterableAttributes: ["Form Factor", "Motherboard Support", "Max GPU Length"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "cooling",
        name: "CPU Coolers",
        icon: "Fan",
        filterableAttributes: ["Cooler Type", "Socket Support", "Fan Size"],
        isFeaturedInMegaMenu: true,
      },
      {
        slug: "monitor",
        name: "Gaming Monitors",
        icon: "Monitor",
        filterableAttributes: ["Display Size", "Refresh Rate", "Resolution", "Panel Type"],
        isFeaturedInMegaMenu: true,
      },
    ];

    const categoryMap = new Map<string, string>();
    for (const cat of categoryData) {
      const [inserted] = await tx
        .insert(categories)
        .values({
          id: crypto.randomUUID(),
          ...cat,
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: cat.name,
            icon: cat.icon,
            filterableAttributes: cat.filterableAttributes,
            isFeaturedInMegaMenu: cat.isFeaturedInMegaMenu,
            updatedAt: new Date(),
          },
        })
        .returning();
      categoryMap.set(cat.slug, inserted.id);
    }

    // 3. Brands
    console.log("  -> Seeding brands...");
    const brandData = [
      { name: "AMD", slug: "amd", logoUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea" },
      { name: "Intel", slug: "intel", logoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475" },
      { name: "ASUS", slug: "asus", logoUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7" },
      { name: "MSI", slug: "msi", logoUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c" },
      { name: "Gigabyte", slug: "gigabyte", logoUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b" },
      { name: "G.Skill", slug: "gskill", logoUrl: "https://images.unsplash.com/photo-1562976540-1502c2145186" },
      { name: "Corsair", slug: "corsair", logoUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c" },
      { name: "Samsung", slug: "samsung", logoUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b" },
      { name: "Kingston", slug: "kingston", logoUrl: "https://images.unsplash.com/photo-1562976540-1502c2145186" },
      { name: "Western Digital", slug: "wd", logoUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b" },
      { name: "Lian Li", slug: "lian-li", logoUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c" },
      { name: "LG", slug: "lg", logoUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf" },
    ];

    const brandMap = new Map<string, string>();
    for (const b of brandData) {
      const [inserted] = await tx
        .insert(brands)
        .values({
          id: crypto.randomUUID(),
          ...b,
        })
        .onConflictDoUpdate({
          target: brands.slug,
          set: {
            name: b.name,
            logoUrl: b.logoUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      brandMap.set(b.slug, inserted.id);
    }

    // 4. Realistic 25 Bangladeshi PC Hardware Products (Star Tech & TechLand BD modeled)
    console.log("  -> Seeding 25 realistic PC hardware products with Bangladeshi BDT Dual Pricing...");

    const productList = [
      // CPUs (AMD & Intel)
      {
        sku: "CPU-AMD-7800X3D",
        name: "AMD Ryzen 7 7800X3D Gaming Processor",
        slug: "amd-ryzen-7-7800x3d-gaming-processor",
        brandSlug: "amd",
        categorySlug: "processor",
        cashPriceBdt: 46500,
        regularPriceBdt: 49500,
        costPriceBdt: 42000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800"],
        keyFeatures: [
          "8 Cores & 16 Threads, Up to 5.0 GHz Max Boost",
          "96MB L3 3D V-Cache Technology",
          "AMD Socket AM5 Platform with PCIe 5.0",
        ],
        specifications: [
          { group: "General", label: "Cores / Threads", value: "8 / 16" },
          { group: "Performance", label: "Max Boost Clock", value: "Up to 5.0 GHz" },
          { group: "Socket", label: "CPU Socket", value: "AM5" },
        ],
        compatibility: {
          componentType: "CPU" as const,
          socket: "AM5",
          supportedRam: "DDR5",
          tdpWatts: 120,
          benchmarkScore: 34500,
        },
      },
      {
        sku: "CPU-AMD-9800X3D",
        name: "AMD Ryzen 7 9800X3D Next-Gen Gaming Processor",
        slug: "amd-ryzen-7-9800x3d-gaming-processor",
        brandSlug: "amd",
        categorySlug: "processor",
        cashPriceBdt: 58500,
        regularPriceBdt: 62000,
        costPriceBdt: 53000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800"],
        keyFeatures: [
          "Zen 5 Architecture, 8 Cores / 16 Threads",
          "2nd Gen 3D V-Cache, Up to 5.2 GHz Boost",
          "Ultra-low latency for competitive esports",
        ],
        specifications: [
          { group: "General", label: "Cores / Threads", value: "8 / 16" },
          { group: "Architecture", label: "Zen Generation", value: "Zen 5" },
          { group: "Socket", label: "CPU Socket", value: "AM5" },
        ],
        compatibility: {
          componentType: "CPU" as const,
          socket: "AM5",
          supportedRam: "DDR5",
          tdpWatts: 120,
          benchmarkScore: 41200,
        },
      },
      {
        sku: "CPU-AMD-7600",
        name: "AMD Ryzen 5 7600 6-Core AM5 Processor",
        slug: "amd-ryzen-5-7600-am5-processor",
        brandSlug: "amd",
        categorySlug: "processor",
        cashPriceBdt: 21500,
        regularPriceBdt: 23000,
        costPriceBdt: 19500,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800"],
        keyFeatures: ["6 Cores & 12 Threads, Up to 5.1 GHz", "65W Low TDP with Wraith Stealth Cooler"],
        specifications: [
          { group: "General", label: "Cores", value: "6" },
          { group: "Socket", label: "CPU Socket", value: "AM5" },
        ],
        compatibility: {
          componentType: "CPU" as const,
          socket: "AM5",
          supportedRam: "DDR5",
          tdpWatts: 65,
          benchmarkScore: 27100,
        },
      },
      {
        sku: "CPU-INTEL-14700K",
        name: "Intel 14th Gen Core i7-14700K Raptor Lake Refresh",
        slug: "intel-core-i7-14700k-processor",
        brandSlug: "intel",
        categorySlug: "processor",
        cashPriceBdt: 48000,
        regularPriceBdt: 51500,
        costPriceBdt: 44000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: [
          "20 Cores (8 P-Cores + 12 E-Cores) & 28 Threads",
          "Max Turbo Frequency up to 5.6 GHz",
          "Intel LGA1700 Socket Support",
        ],
        specifications: [
          { group: "General", label: "Total Cores", value: "20" },
          { group: "Socket", label: "Socket", value: "LGA1700" },
        ],
        compatibility: {
          componentType: "CPU" as const,
          socket: "LGA1700",
          supportedRam: "DDR5",
          tdpWatts: 253,
          benchmarkScore: 53800,
        },
      },
      {
        sku: "CPU-INTEL-14600K",
        name: "Intel 14th Gen Core i5-14600K Processor",
        slug: "intel-core-i5-14600k-processor",
        brandSlug: "intel",
        categorySlug: "processor",
        cashPriceBdt: 34000,
        regularPriceBdt: 36500,
        costPriceBdt: 31000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: ["14 Cores (6 P-Cores + 8 E-Cores) & 20 Threads", "Turbo Frequency up to 5.3 GHz"],
        specifications: [
          { group: "General", label: "Total Cores", value: "14" },
          { group: "Socket", label: "Socket", value: "LGA1700" },
        ],
        compatibility: {
          componentType: "CPU" as const,
          socket: "LGA1700",
          supportedRam: "DDR5",
          tdpWatts: 181,
          benchmarkScore: 39500,
        },
      },
      {
        sku: "CPU-INTEL-13400",
        name: "Intel 13th Gen Core i5-13400 10-Core Processor",
        slug: "intel-core-i5-13400-processor",
        brandSlug: "intel",
        categorySlug: "processor",
        cashPriceBdt: 23500,
        regularPriceBdt: 25000,
        costPriceBdt: 21500,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: ["10 Cores (6 P-Cores + 4 E-Cores)", "LGA1700, 65W Base Power"],
        specifications: [
          { group: "General", label: "Total Cores", value: "10" },
          { group: "Socket", label: "Socket", value: "LGA1700" },
        ],
        compatibility: {
          componentType: "CPU" as const,
          socket: "LGA1700",
          supportedRam: "DDR5",
          tdpWatts: 65,
          benchmarkScore: 25600,
        },
      },

      // Motherboards
      {
        sku: "MOBO-MSI-B650-TOMAHAWK",
        name: "MSI MAG B650 TOMAHAWK WIFI AM5 ATX Motherboard",
        slug: "msi-mag-b650-tomahawk-wifi-motherboard",
        brandSlug: "msi",
        categorySlug: "motherboard",
        cashPriceBdt: 27500,
        regularPriceBdt: 29500,
        costPriceBdt: 25000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: [
          "Supports AMD Ryzen 7000/8000/9000 Series",
          "14+2+1 Duet Rail Power System, DDR5 7600+ MHz (OC)",
          "Lightning Gen 4 M.2 and Wi-Fi 6E",
        ],
        specifications: [
          { group: "Chipset", label: "Chipset", value: "AMD B650" },
          { group: "Socket", label: "Socket", value: "AM5" },
          { group: "Memory", label: "RAM Slots", value: "4x DDR5" },
        ],
        compatibility: {
          componentType: "MOBO" as const,
          socket: "AM5",
          supportedRam: "DDR5",
          formFactor: "ATX",
          tdpWatts: 45,
        },
      },
      {
        sku: "MOBO-ASUS-B650A-STRIX",
        name: "ASUS ROG STRIX B650-A GAMING WIFI Motherboard",
        slug: "asus-rog-strix-b650-a-gaming-wifi",
        brandSlug: "asus",
        categorySlug: "motherboard",
        cashPriceBdt: 31500,
        regularPriceBdt: 33500,
        costPriceBdt: 28500,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: ["12+2 Power Stages, DDR5, PCIe 5.0 M.2", "Sleek White/Silver Aesthetic with WiFi 6E"],
        specifications: [
          { group: "Socket", label: "CPU Socket", value: "AM5" },
          { group: "Form Factor", label: "Form Factor", value: "ATX" },
        ],
        compatibility: {
          componentType: "MOBO" as const,
          socket: "AM5",
          supportedRam: "DDR5",
          formFactor: "ATX",
          tdpWatts: 45,
        },
      },
      {
        sku: "MOBO-GIGABYTE-B650M-DS3H",
        name: "Gigabyte B650M DS3H Micro-ATX Motherboard",
        slug: "gigabyte-b650m-ds3h-micro-atx",
        brandSlug: "gigabyte",
        categorySlug: "motherboard",
        cashPriceBdt: 17500,
        regularPriceBdt: 19000,
        costPriceBdt: 15800,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: ["Affordable AM5 Platform, Dual M.2 PCIe 4.0", "4x DDR5 DIMMs, 2.5GbE LAN"],
        specifications: [
          { group: "Socket", label: "Socket", value: "AM5" },
          { group: "Form Factor", label: "Form Factor", value: "Micro-ATX" },
        ],
        compatibility: {
          componentType: "MOBO" as const,
          socket: "AM5",
          supportedRam: "DDR5",
          formFactor: "Micro-ATX",
          tdpWatts: 40,
        },
      },
      {
        sku: "MOBO-ASUS-Z790-TUF",
        name: "ASUS TUF GAMING Z790-PLUS WIFI LGA1700 ATX",
        slug: "asus-tuf-gaming-z790-plus-wifi",
        brandSlug: "asus",
        categorySlug: "motherboard",
        cashPriceBdt: 36500,
        regularPriceBdt: 39000,
        costPriceBdt: 33000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: ["16+1 DrMOS Power Stages, DDR5 7200+", "PCIe 5.0 x16 SafeSlot, WiFi 6E"],
        specifications: [
          { group: "Socket", label: "Socket", value: "LGA1700" },
          { group: "Chipset", label: "Chipset", value: "Intel Z790" },
        ],
        compatibility: {
          componentType: "MOBO" as const,
          socket: "LGA1700",
          supportedRam: "DDR5",
          formFactor: "ATX",
          tdpWatts: 50,
        },
      },
      {
        sku: "MOBO-MSI-B760M-A",
        name: "MSI PRO B760M-A WIFI DDR5 Motherboard",
        slug: "msi-pro-b760m-a-wifi-ddr5",
        brandSlug: "msi",
        categorySlug: "motherboard",
        cashPriceBdt: 18500,
        regularPriceBdt: 20000,
        costPriceBdt: 16500,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"],
        keyFeatures: ["Intel LGA1700, DDR5 Boost up to 6800+", "Lightning Gen 4 M.2, Intel Wi-Fi 6E"],
        specifications: [
          { group: "Socket", label: "Socket", value: "LGA1700" },
          { group: "Form Factor", label: "Form Factor", value: "Micro-ATX" },
        ],
        compatibility: {
          componentType: "MOBO" as const,
          socket: "LGA1700",
          supportedRam: "DDR5",
          formFactor: "Micro-ATX",
          tdpWatts: 40,
        },
      },

      // RAM
      {
        sku: "RAM-GSKILL-TZ5-32-6000",
        name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz CL30",
        slug: "gskill-trident-z5-rgb-32gb-ddr5-6000mhz",
        brandSlug: "gskill",
        categorySlug: "ram",
        cashPriceBdt: 15200,
        regularPriceBdt: 16500,
        costPriceBdt: 13500,
        warrantyDurationMonths: 120,
        warrantyTerms: "Product Lifetime Warranty",
        images: ["https://images.unsplash.com/photo-1562976540-1502c2145186?w=800"],
        keyFeatures: ["32GB (2x16GB) Dual Channel, 6000MHz CL30", "AMD EXPO & Intel XMP 3.0 Ready"],
        specifications: [
          { group: "Memory", label: "Capacity", value: "32GB (2x16GB)" },
          { group: "Speed", label: "Bus Speed", value: "6000 MHz" },
          { group: "Latency", label: "CAS Latency", value: "CL30-38-38-96" },
        ],
        compatibility: {
          componentType: "RAM" as const,
          supportedRam: "DDR5",
          tdpWatts: 15,
        },
      },
      {
        sku: "RAM-CORSAIR-VEN-32-6000",
        name: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz",
        slug: "corsair-vengeance-rgb-32gb-ddr5-6000mhz",
        brandSlug: "corsair",
        categorySlug: "ram",
        cashPriceBdt: 14500,
        regularPriceBdt: 15800,
        costPriceBdt: 12900,
        warrantyDurationMonths: 120,
        warrantyTerms: "Product Lifetime Warranty",
        images: ["https://images.unsplash.com/photo-1562976540-1502c2145186?w=800"],
        keyFeatures: ["Dynamic Ten-Zone RGB Lighting", "Custom Intel XMP 3.0 / AMD EXPO Profiles"],
        specifications: [
          { group: "Memory", label: "Type", value: "DDR5" },
          { group: "Speed", label: "Frequency", value: "6000 MHz" },
        ],
        compatibility: {
          componentType: "RAM" as const,
          supportedRam: "DDR5",
          tdpWatts: 15,
        },
      },
      {
        sku: "RAM-KINGSTON-BEAST-16-5600",
        name: "Kingston Fury Beast 16GB DDR5 5600MHz Desktop RAM",
        slug: "kingston-fury-beast-16gb-ddr5-5600mhz",
        brandSlug: "kingston",
        categorySlug: "ram",
        cashPriceBdt: 6800,
        regularPriceBdt: 7500,
        costPriceBdt: 5900,
        warrantyDurationMonths: 120,
        warrantyTerms: "Product Lifetime Warranty",
        images: ["https://images.unsplash.com/photo-1562976540-1502c2145186?w=800"],
        keyFeatures: ["16GB Single Module, 5600MHz Low Latency", "Plug N Play automatic overclocking"],
        specifications: [
          { group: "Memory", label: "Capacity", value: "16GB" },
          { group: "Type", label: "RAM Type", value: "DDR5" },
        ],
        compatibility: {
          componentType: "RAM" as const,
          supportedRam: "DDR5",
          tdpWatts: 8,
        },
      },

      // Graphics Cards
      {
        sku: "GPU-MSI-4060-VENTUS",
        name: "MSI GeForce RTX 4060 Ventus 2X 8GB OC Graphics Card",
        slug: "msi-geforce-rtx-4060-ventus-2x-8gb",
        brandSlug: "msi",
        categorySlug: "graphics-card",
        cashPriceBdt: 38500,
        regularPriceBdt: 41500,
        costPriceBdt: 34500,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Replacement Warranty",
        images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800"],
        keyFeatures: ["8GB GDDR6 128-bit, DLSS 3.5 Frame Generation", "TORX Fan 4.0 Compact Dual Fan Design"],
        specifications: [
          { group: "Memory", label: "VRAM", value: "8GB GDDR6" },
          { group: "Power", label: "TDP", value: "115 Watts" },
        ],
        compatibility: {
          componentType: "GPU" as const,
          tdpWatts: 115,
          benchmarkScore: 19500,
        },
      },
      {
        sku: "GPU-GIGABYTE-4060TI-8GB",
        name: "Gigabyte GeForce RTX 4060 Ti Gaming OC 8GB GPU",
        slug: "gigabyte-geforce-rtx-4060-ti-gaming-oc-8gb",
        brandSlug: "gigabyte",
        categorySlug: "graphics-card",
        cashPriceBdt: 54500,
        regularPriceBdt: 58000,
        costPriceBdt: 49000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800"],
        keyFeatures: ["WINDFORCE 3X Cooling System with RGB Fusion", "Metal Backplate, Dual BIOS"],
        specifications: [
          { group: "Memory", label: "VRAM", value: "8GB GDDR6" },
          { group: "TDP", label: "Power Consumption", value: "160W" },
        ],
        compatibility: {
          componentType: "GPU" as const,
          tdpWatts: 160,
          benchmarkScore: 22800,
        },
      },
      {
        sku: "GPU-ASUS-4070S-TUF",
        name: "ASUS TUF Gaming GeForce RTX 4070 Super 12GB OC Edition",
        slug: "asus-tuf-gaming-rtx-4070-super-12gb",
        brandSlug: "asus",
        categorySlug: "graphics-card",
        cashPriceBdt: 88500,
        regularPriceBdt: 94000,
        costPriceBdt: 81000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800"],
        keyFeatures: [
          "12GB GDDR6X 192-bit, 7168 CUDA Cores",
          "Military-grade Capacitors with Axial-tech Fans",
        ],
        specifications: [
          { group: "Memory", label: "VRAM", value: "12GB GDDR6X" },
          { group: "Length", label: "Card Length", value: "301 mm" },
        ],
        compatibility: {
          componentType: "GPU" as const,
          tdpWatts: 220,
          benchmarkScore: 31200,
        },
      },
      {
        sku: "GPU-MSI-4080S-SLIM",
        name: "MSI GeForce RTX 4080 Super 16GB Gaming X Slim",
        slug: "msi-geforce-rtx-4080-super-16gb-gaming-x-slim",
        brandSlug: "msi",
        categorySlug: "graphics-card",
        cashPriceBdt: 145000,
        regularPriceBdt: 153500,
        costPriceBdt: 134000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Replacement Warranty",
        images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800"],
        keyFeatures: [
          "16GB GDDR6X 256-bit, Ada Lovelace Architecture",
          "TRI FROZR 3 Thermal Cooling, Extreme 4K Gaming",
        ],
        specifications: [
          { group: "Memory", label: "VRAM", value: "16GB GDDR6X" },
          { group: "Length", label: "Card Length", value: "322 mm" },
        ],
        compatibility: {
          componentType: "GPU" as const,
          tdpWatts: 320,
          benchmarkScore: 48900,
        },
      },

      // Storage (NVMe SSD)
      {
        sku: "SSD-SAM-990PRO-2TB",
        name: "Samsung 990 PRO 2TB PCIe 4.0 M.2 NVMe SSD",
        slug: "samsung-990-pro-2tb-pcie-4-nvme-ssd",
        brandSlug: "samsung",
        categorySlug: "storage",
        cashPriceBdt: 24500,
        regularPriceBdt: 26200,
        costPriceBdt: 21800,
        warrantyDurationMonths: 60,
        warrantyTerms: "5 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800"],
        keyFeatures: [
          "Sequential Read: 7,450 MB/s, Write: 6,900 MB/s",
          "Samsung In-house Nickel Coated Controller",
        ],
        specifications: [
          { group: "Capacity", label: "Capacity", value: "2TB" },
          { group: "Speed", label: "Sequential Read", value: "7,450 MB/s" },
        ],
        compatibility: {
          componentType: "STORAGE" as const,
          tdpWatts: 8,
        },
      },
      {
        sku: "SSD-KINGSTON-KC3000-1TB",
        name: "Kingston KC3000 1TB PCIe 4.0 NVMe M.2 SSD",
        slug: "kingston-kc3000-1tb-pcie-4-nvme-ssd",
        brandSlug: "kingston",
        categorySlug: "storage",
        cashPriceBdt: 12500,
        regularPriceBdt: 13500,
        costPriceBdt: 11000,
        warrantyDurationMonths: 60,
        warrantyTerms: "5 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800"],
        keyFeatures: ["Phison E18 Controller, Speeds up to 7,000 MB/s", "Graphene Aluminum Heat Spreader"],
        specifications: [
          { group: "Capacity", label: "Storage", value: "1TB" },
          { group: "Speed", label: "Read Speed", value: "7,000 MB/s" },
        ],
        compatibility: {
          componentType: "STORAGE" as const,
          tdpWatts: 7,
        },
      },
      {
        sku: "SSD-WD-SN770-1TB",
        name: "Western Digital Black SN770 1TB NVMe Gaming SSD",
        slug: "wd-black-sn770-1tb-nvme-ssd",
        brandSlug: "wd",
        categorySlug: "storage",
        cashPriceBdt: 9200,
        regularPriceBdt: 10000,
        costPriceBdt: 8100,
        warrantyDurationMonths: 60,
        warrantyTerms: "5 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800"],
        keyFeatures: ["PCIe Gen4 Interface, Speeds up to 5,150 MB/s", "WD Black Gaming Dashboard Support"],
        specifications: [{ group: "Capacity", label: "Capacity", value: "1TB" }],
        compatibility: {
          componentType: "STORAGE" as const,
          tdpWatts: 6,
        },
      },

      // Power Supplies
      {
        sku: "PSU-CORSAIR-RM750E",
        name: "Corsair RM750e 750W 80 PLUS Gold Fully Modular PSU",
        slug: "corsair-rm750e-750w-gold-modular-psu",
        brandSlug: "corsair",
        categorySlug: "power-supply",
        cashPriceBdt: 13500,
        regularPriceBdt: 14800,
        costPriceBdt: 11900,
        warrantyDurationMonths: 84,
        warrantyTerms: "7 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800"],
        keyFeatures: [
          "750 Watts Continuous Power, 80 PLUS Gold Efficiency",
          "ATX 3.0 & PCIe 5.0 12VHPWR Cable Included",
        ],
        specifications: [
          { group: "Wattage", label: "Wattage", value: "750W" },
          { group: "Efficiency", label: "Rating", value: "80 PLUS Gold" },
        ],
        compatibility: {
          componentType: "PSU" as const,
          psuWattage: 750,
          tdpWatts: 0,
        },
      },
      {
        sku: "PSU-CORSAIR-RM1000X",
        name: "Corsair RM1000x 1000W 80 PLUS Gold Fully Modular",
        slug: "corsair-rm1000x-1000w-gold-modular-psu",
        brandSlug: "corsair",
        categorySlug: "power-supply",
        cashPriceBdt: 21800,
        regularPriceBdt: 23500,
        costPriceBdt: 19400,
        warrantyDurationMonths: 120,
        warrantyTerms: "10 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800"],
        keyFeatures: [
          "1000W 80 PLUS Gold Certified with Zero RPM Fan Mode",
          "100% Japanese 105°C Electrolytic Capacitors",
        ],
        specifications: [
          { group: "Wattage", label: "Wattage", value: "1000W" },
          { group: "Warranty", label: "Duration", value: "10 Years" },
        ],
        compatibility: {
          componentType: "PSU" as const,
          psuWattage: 1000,
          tdpWatts: 0,
        },
      },

      // Casings & Monitors
      {
        sku: "CASE-LIANLI-O11-VISION",
        name: "Lian Li O11 Vision Chrome Tempered Glass Gaming Casing",
        slug: "lian-li-o11-vision-chrome-casing",
        brandSlug: "lian-li",
        categorySlug: "casing",
        cashPriceBdt: 17500,
        regularPriceBdt: 19000,
        costPriceBdt: 15500,
        warrantyDurationMonths: 12,
        warrantyTerms: "1 Year Official Warranty",
        images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800"],
        keyFeatures: [
          "Three Sides of Column-less Tempered Glass Panels",
          "Supports up to 2x 360mm Radiators & E-ATX Motherboards",
        ],
        specifications: [
          { group: "Dimensions", label: "Max GPU Length", value: "455 mm" },
          { group: "Form Factor", label: "Mobo Support", value: "E-ATX, ATX, M-ATX" },
        ],
        compatibility: {
          componentType: "CASE" as const,
          formFactor: "ATX",
          tdpWatts: 0,
        },
      },
      {
        sku: "MON-LG-27GR75Q",
        name: "LG UltraGear 27GR75Q-B 27\" QHD 165Hz IPS Gaming Monitor",
        slug: "lg-ultragear-27gr75q-b-27-inch-qhd-165hz-gaming-monitor",
        brandSlug: "lg",
        categorySlug: "monitor",
        cashPriceBdt: 36500,
        regularPriceBdt: 39000,
        costPriceBdt: 32000,
        warrantyDurationMonths: 36,
        warrantyTerms: "3 Years Official Warranty",
        images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"],
        keyFeatures: [
          "27\" QHD (2560 x 1440) IPS Panel with 1ms (GtG)",
          "165Hz Refresh Rate with NVIDIA G-SYNC & AMD FreeSync",
        ],
        specifications: [
          { group: "Display", label: "Resolution", value: "2560 x 1440" },
          { group: "Speed", label: "Refresh Rate", value: "165 Hz" },
        ],
        compatibility: {
          componentType: "MONITOR" as const,
          tdpWatts: 45,
        },
      },
    ];

    for (const prod of productList) {
      const categoryId = categoryMap.get(prod.categorySlug);
      const brandId = brandMap.get(prod.brandSlug);

      const [insertedProduct] = await tx
        .insert(products)
        .values({
          id: crypto.randomUUID(),
          sku: prod.sku,
          name: prod.name,
          slug: prod.slug,
          brandId,
          categoryId,
          cashPriceBdt: prod.cashPriceBdt,
          regularPriceBdt: prod.regularPriceBdt,
          costPriceBdt: prod.costPriceBdt,
          isEmiAvailable: true,
          totalStock: 50,
          stockStatus: "IN_STOCK",
          images: prod.images,
          keyFeatures: prod.keyFeatures,
          specifications: prod.specifications,
          compatibility: prod.compatibility,
          warrantyDurationMonths: prod.warrantyDurationMonths,
          warrantyTerms: prod.warrantyTerms,
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: prod.name,
            cashPriceBdt: prod.cashPriceBdt,
            regularPriceBdt: prod.regularPriceBdt,
            costPriceBdt: prod.costPriceBdt,
            images: prod.images,
            keyFeatures: prod.keyFeatures,
            specifications: prod.specifications,
            compatibility: prod.compatibility,
            updatedAt: new Date(),
          },
        })
        .returning();

      // Seed Branch Inventory across all physical branches
      for (const branch of BRANCH_CODES) {
        const branchStock =
          branch === "ONLINE_WAREHOUSE" ? 25 : branch === "IDB" ? 10 : 8;

        await tx
          .insert(branchInventory)
          .values({
            id: crypto.randomUUID(),
            productId: insertedProduct.id,
            branchCode: branch,
            stock: branchStock,
          })
          .onConflictDoUpdate({
            target: [branchInventory.productId, branchInventory.branchCode],
            set: {
              stock: branchStock,
            },
          });
      }

      // Seed 2 sample Serial Numbers for box warranty tracking
      const sampleSerials = [
        `SN-${prod.sku.replace(/[^A-Z0-9]/g, "")}-001`,
        `SN-${prod.sku.replace(/[^A-Z0-9]/g, "")}-002`,
      ];

      for (const sn of sampleSerials) {
        await tx
          .insert(productSerials)
          .values({
            id: crypto.randomUUID(),
            serialNumber: sn,
            productId: insertedProduct.id,
            supplierName: "Official Smart Technologies BD / UCC / Star Tech BD",
            status: "IN_STOCK",
          })
          .onConflictDoNothing();
      }
    }
  });

  console.log("✅ Database seed completed successfully!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed with error:", err);
  process.exit(1);
});
