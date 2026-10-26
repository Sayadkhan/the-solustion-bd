export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  cashPriceBdt: number;
  regularPriceBdt: number;
  costPriceBdt?: number;
  isEmiAvailable: boolean;
  totalStock: number;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "UPCOMING" | "PRE_ORDER" | "CALL_FOR_PRICE";
  thumbnailUrl: string;
  images: string[];
  keyFeatures: string[];
  warrantyDurationMonths: number;
  warrantyNotice: string;
  branchStocks: Record<string, number>;
  specifications: Array<{ group: string; label: string; value: string }>;
  compatibility: {
    componentType: "CPU" | "MOBO" | "RAM" | "GPU" | "STORAGE" | "PSU" | "CASE" | "COOLER" | "MONITOR" | "OTHER";
    socket?: string | null;
    supportedRam?: string | null;
    tdpWatts?: number;
    formFactor?: string | null;
    psuWattage?: number | null;
    benchmarkScore?: number;
  };
}

export const CATALOG_PRODUCTS: Product[] = [
  // 1. AMD Ryzen 7 7800X3D
  {
    id: "p1",
    name: "AMD Ryzen 7 7800X3D Gaming Processor",
    slug: "amd-ryzen-7-7800x3d-gaming-processor",
    sku: "CPU-AMD-7800X3D",
    brand: "AMD",
    categorySlug: "processor",
    categoryName: "Processors (CPU)",
    cashPriceBdt: 49500,
    regularPriceBdt: 52500,
    isEmiAvailable: true,
    totalStock: 30,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80",
    ],
    keyFeatures: [
      "8 Cores & 16 Threads, Up to 5.0 GHz Max Boost",
      "96MB L3 3D V-Cache (World's Best Gaming CPU)",
      "Socket AM5, DDR5 & PCIe 5.0 Ready",
      "120W TDP High-Efficiency Zen 4 Architecture",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Official Warranty",
    branchStocks: {
      IDB: 10,
      MULTIPLAN: 8,
      UTTARA: 4,
      AGRABAD: 3,
      ONLINE_WAREHOUSE: 5,
    },
    specifications: [
      { group: "General", label: "Series", value: "Ryzen 7000" },
      { group: "General", label: "Socket", value: "AM5" },
      { group: "CPU Specs", label: "Cores / Threads", value: "8 / 16" },
      { group: "CPU Specs", label: "Base Clock", value: "4.2 GHz" },
      { group: "CPU Specs", label: "Boost Clock", value: "Up to 5.0 GHz" },
      { group: "CPU Specs", label: "L3 Cache", value: "96MB (3D V-Cache)" },
      { group: "CPU Specs", label: "TDP", value: "120W" },
      { group: "Memory Support", label: "Supported Memory", value: "DDR5-5200 (Dual Channel)" },
    ],
    compatibility: {
      componentType: "CPU",
      socket: "AM5",
      supportedRam: "DDR5",
      tdpWatts: 120,
      benchmarkScore: 34500,
    },
  },

  // 2. AMD Ryzen 5 7600
  {
    id: "p2",
    name: "AMD Ryzen 5 7600 6-Core AM5 Processor",
    slug: "amd-ryzen-5-7600-processor",
    sku: "CPU-AMD-7600",
    brand: "AMD",
    categorySlug: "processor",
    categoryName: "Processors (CPU)",
    cashPriceBdt: 21500,
    regularPriceBdt: 23200,
    isEmiAvailable: true,
    totalStock: 45,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "6 Cores & 12 Threads, Up to 5.1 GHz Boost",
      "AMD Wraith Stealth Cooler Included",
      "AMD Radeon Graphics Built-In",
      "Socket AM5, DDR5 Native Support",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Official Warranty",
    branchStocks: {
      IDB: 15,
      MULTIPLAN: 12,
      UTTARA: 8,
      AGRABAD: 5,
      ONLINE_WAREHOUSE: 5,
    },
    specifications: [
      { group: "General", label: "Socket", value: "AM5" },
      { group: "CPU Specs", label: "Cores / Threads", value: "6 / 12" },
      { group: "CPU Specs", label: "Base Clock", value: "3.8 GHz" },
      { group: "CPU Specs", label: "Boost Clock", value: "5.1 GHz" },
      { group: "CPU Specs", label: "TDP", value: "65W" },
      { group: "Memory Support", label: "Supported Memory", value: "DDR5" },
    ],
    compatibility: {
      componentType: "CPU",
      socket: "AM5",
      supportedRam: "DDR5",
      tdpWatts: 65,
      benchmarkScore: 27000,
    },
  },

  // 3. Intel Core i7-14700K
  {
    id: "p3",
    name: "Intel 14th Gen Core i7-14700K 20-Core Processor",
    slug: "intel-core-i7-14700k-processor",
    sku: "CPU-INT-14700K",
    brand: "Intel",
    categorySlug: "processor",
    categoryName: "Processors (CPU)",
    cashPriceBdt: 47500,
    regularPriceBdt: 50500,
    isEmiAvailable: true,
    totalStock: 25,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "20 Cores (8P + 12E) & 28 Threads",
      "Up to 5.6 GHz Max Turbo Frequency",
      "Intel UHD Graphics 770 Integrated",
      "LGA1700 Socket, DDR4 & DDR5 Dual Support",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Official Warranty",
    branchStocks: {
      IDB: 8,
      MULTIPLAN: 6,
      UTTARA: 4,
      AGRABAD: 2,
      ONLINE_WAREHOUSE: 5,
    },
    specifications: [
      { group: "General", label: "Socket", value: "LGA1700" },
      { group: "CPU Specs", label: "Cores / Threads", value: "20 / 28" },
      { group: "CPU Specs", label: "Turbo Frequency", value: "5.6 GHz" },
      { group: "CPU Specs", label: "TDP", value: "125W (253W Max)" },
      { group: "Memory Support", label: "Supported Memory", value: "DDR5 & DDR4" },
    ],
    compatibility: {
      componentType: "CPU",
      socket: "LGA1700",
      supportedRam: "DDR5, DDR4",
      tdpWatts: 253,
      benchmarkScore: 53000,
    },
  },

  // 4. MSI B650 Gaming Plus WiFi
  {
    id: "p4",
    name: "MSI B650 Gaming Plus WiFi Motherboard",
    slug: "msi-b650-gaming-plus-wifi-motherboard",
    sku: "MOBO-MSI-B650GP",
    brand: "MSI",
    categorySlug: "motherboard",
    categoryName: "Motherboards",
    cashPriceBdt: 22500,
    regularPriceBdt: 24200,
    isEmiAvailable: true,
    totalStock: 35,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "Supports AMD Ryzen 9000 / 8000 / 7000 Series (AM5)",
      "Supports Dual Channel DDR5 Memory up to 7200+ MHz (OC)",
      "Lightning Gen 4 M.2 with Shield Frozr",
      "2.5G LAN and AMD Wi-Fi 6E Solution",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Replacement Warranty",
    branchStocks: {
      IDB: 12,
      MULTIPLAN: 9,
      UTTARA: 6,
      AGRABAD: 4,
      ONLINE_WAREHOUSE: 4,
    },
    specifications: [
      { group: "General", label: "Socket", value: "AM5" },
      { group: "General", label: "Chipset", value: "AMD B650" },
      { group: "General", label: "Form Factor", value: "ATX" },
      { group: "Memory Support", label: "Supported RAM", value: "DDR5" },
      { group: "Memory Support", label: "Max RAM Capacity", value: "192GB" },
    ],
    compatibility: {
      componentType: "MOBO",
      socket: "AM5",
      supportedRam: "DDR5",
      formFactor: "ATX",
      tdpWatts: 25,
    },
  },

  // 5. Gigabyte Z790 Aorus Elite AX
  {
    id: "p5",
    name: "Gigabyte Z790 AORUS ELITE AX Motherboard",
    slug: "gigabyte-z790-aorus-elite-ax-motherboard",
    sku: "MOBO-GB-Z790EL",
    brand: "Gigabyte",
    categorySlug: "motherboard",
    categoryName: "Motherboards",
    cashPriceBdt: 33500,
    regularPriceBdt: 35800,
    isEmiAvailable: true,
    totalStock: 20,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "Supports Intel 14th/13th/12th Gen (LGA1700)",
      "Twin 16+1+2 Digital VRM Design",
      "4x PCIe 4.0 x4 M.2 Connectors with Thermal Guards",
      "2.5GbE LAN & Wi-Fi 6E 802.11ax",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Official Warranty",
    branchStocks: {
      IDB: 6,
      MULTIPLAN: 5,
      UTTARA: 3,
      AGRABAD: 2,
      ONLINE_WAREHOUSE: 4,
    },
    specifications: [
      { group: "General", label: "Socket", value: "LGA1700" },
      { group: "General", label: "Chipset", value: "Intel Z790" },
      { group: "General", label: "Form Factor", value: "ATX" },
      { group: "Memory Support", label: "Supported RAM", value: "DDR5" },
    ],
    compatibility: {
      componentType: "MOBO",
      socket: "LGA1700",
      supportedRam: "DDR5",
      formFactor: "ATX",
      tdpWatts: 30,
    },
  },

  // 6. ZOTAC Gaming GeForce RTX 4070 Super Twin Edge 12GB
  {
    id: "p6",
    name: "ZOTAC Gaming GeForce RTX 4070 SUPER Twin Edge 12GB",
    slug: "zotac-rtx-4070-super-twin-edge-12gb",
    sku: "GPU-ZOT-4070S",
    brand: "ZOTAC",
    categorySlug: "graphics-card",
    categoryName: "Graphics Cards (GPU)",
    cashPriceBdt: 82500,
    regularPriceBdt: 87900,
    isEmiAvailable: true,
    totalStock: 18,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "12GB GDDR6X 192-bit Memory, 7168 CUDA Cores",
      "Ada Lovelace Architecture, DLSS 3 & Ray Tracing",
      "IceStorm 2.0 Advanced Cooling with FREEZE Fan Stop",
      "Compact Twin-Fan Design fits 99% PC cases",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Official Warranty + 2 Years Extended",
    branchStocks: {
      IDB: 5,
      MULTIPLAN: 4,
      UTTARA: 3,
      AGRABAD: 2,
      ONLINE_WAREHOUSE: 4,
    },
    specifications: [
      { group: "GPU Specs", label: "CUDA Cores", value: "7168" },
      { group: "GPU Specs", label: "VRAM", value: "12GB GDDR6X" },
      { group: "GPU Specs", label: "TDP", value: "220W" },
      { group: "GPU Specs", label: "Power Connectors", value: "1x 12VHPWR (adapter included)" },
    ],
    compatibility: {
      componentType: "GPU",
      tdpWatts: 220,
      benchmarkScore: 21500,
    },
  },

  // 7. ASUS Dual GeForce RTX 4060 EVO OC 8GB
  {
    id: "p7",
    name: "ASUS Dual GeForce RTX 4060 EVO OC Edition 8GB",
    slug: "asus-dual-geforce-rtx-4060-evo-oc-8gb",
    sku: "GPU-ASUS-4060EVO",
    brand: "ASUS",
    categorySlug: "graphics-card",
    categoryName: "Graphics Cards (GPU)",
    cashPriceBdt: 38500,
    regularPriceBdt: 41200,
    isEmiAvailable: true,
    totalStock: 32,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "8GB GDDR6 128-bit Memory",
      "Axial-tech Fan Design with Dual Ball Bearings",
      "0dB Technology for Silent Gaming at Low Loads",
      "Low 115W Power Consumption",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Replacement Warranty",
    branchStocks: {
      IDB: 10,
      MULTIPLAN: 8,
      UTTARA: 5,
      AGRABAD: 4,
      ONLINE_WAREHOUSE: 5,
    },
    specifications: [
      { group: "GPU Specs", label: "CUDA Cores", value: "3072" },
      { group: "GPU Specs", label: "VRAM", value: "8GB GDDR6" },
      { group: "GPU Specs", label: "TDP", value: "115W" },
    ],
    compatibility: {
      componentType: "GPU",
      tdpWatts: 115,
      benchmarkScore: 10500,
    },
  },

  // 8. Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz
  {
    id: "p8",
    name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL36",
    slug: "corsair-vengeance-32gb-ddr5-6000mhz",
    sku: "RAM-COR-D5-32",
    brand: "Corsair",
    categorySlug: "ram",
    categoryName: "RAM (Memory)",
    cashPriceBdt: 13500,
    regularPriceBdt: 14700,
    isEmiAvailable: true,
    totalStock: 50,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "32GB (2 x 16GB) Dual Channel Kit",
      "DDR5 6000MHz High-Speed Frequency",
      "Intel XMP 3.0 & AMD EXPO Dual Profile Support",
      "Solid Aluminum Heatspreader for Fast Heat Dissipation",
    ],
    warrantyDurationMonths: 999,
    warrantyNotice: "Lifetime Official Warranty",
    branchStocks: {
      IDB: 15,
      MULTIPLAN: 12,
      UTTARA: 8,
      AGRABAD: 5,
      ONLINE_WAREHOUSE: 10,
    },
    specifications: [
      { group: "RAM Specs", label: "Capacity", value: "32GB (2x16GB)" },
      { group: "RAM Specs", label: "Speed", value: "6000 MHz" },
      { group: "RAM Specs", label: "Generation", value: "DDR5" },
      { group: "RAM Specs", label: "Latency", value: "CL36" },
    ],
    compatibility: {
      componentType: "RAM",
      supportedRam: "DDR5",
      tdpWatts: 10,
    },
  },

  // 9. Samsung 990 Pro 1TB PCIe 4.0 NVMe SSD
  {
    id: "p9",
    name: "Samsung 990 PRO 1TB PCIe 4.0 M.2 NVMe SSD",
    slug: "samsung-990-pro-1tb-nvme-ssd",
    sku: "SSD-SAM-990P-1T",
    brand: "Samsung",
    categorySlug: "storage",
    categoryName: "Storage (SSD / HDD)",
    cashPriceBdt: 14200,
    regularPriceBdt: 15400,
    isEmiAvailable: true,
    totalStock: 40,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "Sequential Read Speeds up to 7,450 MB/s",
      "Sequential Write Speeds up to 6,900 MB/s",
      "Samsung Pascal Controller with Thermal Control Algorithm",
      "PlayStation 5 & High-End PC Gaming Compatible",
    ],
    warrantyDurationMonths: 60,
    warrantyNotice: "5 Years Official Warranty",
    branchStocks: {
      IDB: 12,
      MULTIPLAN: 10,
      UTTARA: 7,
      AGRABAD: 4,
      ONLINE_WAREHOUSE: 7,
    },
    specifications: [
      { group: "Storage Specs", label: "Capacity", value: "1TB" },
      { group: "Storage Specs", label: "Interface", value: "PCIe Gen 4.0 x4, NVMe 2.0" },
      { group: "Storage Specs", label: "Form Factor", value: "M.2 (2280)" },
    ],
    compatibility: {
      componentType: "STORAGE",
      tdpWatts: 8,
    },
  },

  // 10. Corsair RM750e 750W 80+ Gold Fully Modular PSU
  {
    id: "p10",
    name: "Corsair RM750e 750W 80 PLUS Gold Fully Modular Power Supply",
    slug: "corsair-rm750e-750w-gold-modular-power-supply",
    sku: "PSU-COR-RM750E",
    brand: "Corsair",
    categorySlug: "power-supply",
    categoryName: "Power Supply (PSU)",
    cashPriceBdt: 11800,
    regularPriceBdt: 12900,
    isEmiAvailable: true,
    totalStock: 25,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "750 Watts Continuous Power, 80 PLUS Gold Certified",
      "ATX 3.0 & PCIe 5.0 Ready (12VHPWR Cable Included)",
      "120mm Rifle Bearing Fan with Zero RPM Mode",
      "100% Japanese 105°C Electrolytic Capacitors",
    ],
    warrantyDurationMonths: 84,
    warrantyNotice: "7 Years Replacement Warranty",
    branchStocks: {
      IDB: 7,
      MULTIPLAN: 6,
      UTTARA: 4,
      AGRABAD: 3,
      ONLINE_WAREHOUSE: 5,
    },
    specifications: [
      { group: "PSU Specs", label: "Total Wattage", value: "750 Watts" },
      { group: "PSU Specs", label: "Efficiency Rating", value: "80 PLUS Gold" },
      { group: "PSU Specs", label: "Modularity", value: "Fully Modular" },
    ],
    compatibility: {
      componentType: "PSU",
      psuWattage: 750,
      tdpWatts: 0,
    },
  },

  // 11. Lian Li O11 Dynamic EVO Mid-Tower Case
  {
    id: "p11",
    name: "Lian Li O11 Dynamic EVO Mid-Tower Gaming Casing (Black)",
    slug: "lian-li-o11-dynamic-evo-casing-black",
    sku: "CASE-LIAN-O11DEVO",
    brand: "Lian Li",
    categorySlug: "casing",
    categoryName: "Casings",
    cashPriceBdt: 17500,
    regularPriceBdt: 18900,
    isEmiAvailable: true,
    totalStock: 15,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "Dual-Chamber Mid-Tower Chassis with Reversible Design",
      "Seamless Dual Tempered Glass Panels",
      "Supports E-ATX, ATX, Micro-ATX, Mini-ITX",
      "Supports up to 3x 360mm Radiators & 10x 120mm Fans",
    ],
    warrantyDurationMonths: 12,
    warrantyNotice: "1 Year Official Warranty",
    branchStocks: {
      IDB: 4,
      MULTIPLAN: 4,
      UTTARA: 3,
      AGRABAD: 2,
      ONLINE_WAREHOUSE: 2,
    },
    specifications: [
      { group: "Case Specs", label: "Motherboard Support", value: "E-ATX, ATX, Micro-ATX, Mini-ITX" },
      { group: "Case Specs", label: "Max GPU Length", value: "426 mm" },
      { group: "Case Specs", label: "Max CPU Cooler Height", value: "167 mm" },
    ],
    compatibility: {
      componentType: "CASE",
      formFactor: "E-ATX, ATX, Micro-ATX, Mini-ITX",
      tdpWatts: 0,
    },
  },

  // 12. LG UltraGear 27GR75Q 27" 2K 165Hz IPS Gaming Monitor
  {
    id: "p12",
    name: "LG UltraGear 27GR75Q-B 27\" QHD 165Hz IPS Gaming Monitor",
    slug: "lg-ultragear-27gr75q-27-inch-2k-165hz-ips-monitor",
    sku: "MON-LG-27GR75Q",
    brand: "LG",
    categorySlug: "monitor",
    categoryName: "Monitors",
    cashPriceBdt: 34500,
    regularPriceBdt: 37200,
    isEmiAvailable: true,
    totalStock: 22,
    stockStatus: "IN_STOCK",
    thumbnailUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80"],
    keyFeatures: [
      "27-inch QHD (2560 x 1440) IPS Display",
      "165Hz Rapid Refresh Rate & 1ms (GtG) Response Time",
      "AMD FreeSync Premium & NVIDIA G-SYNC Compatible",
      "sRGB 99% Color Gamut with HDR10 Support",
    ],
    warrantyDurationMonths: 36,
    warrantyNotice: "3 Years Full Official Warranty",
    branchStocks: {
      IDB: 6,
      MULTIPLAN: 6,
      UTTARA: 4,
      AGRABAD: 2,
      ONLINE_WAREHOUSE: 4,
    },
    specifications: [
      { group: "Display Specs", label: "Screen Size", value: "27 Inch" },
      { group: "Display Specs", label: "Resolution", value: "2560 x 1440 (2K QHD)" },
      { group: "Display Specs", label: "Panel Type", value: "IPS" },
      { group: "Display Specs", label: "Refresh Rate", value: "165Hz" },
    ],
    compatibility: {
      componentType: "MONITOR",
      tdpWatts: 35,
    },
  },
];

export const CATEGORIES = [
  { slug: "processor", name: "Processors (CPU)", icon: "Cpu", count: 42 },
  { slug: "motherboard", name: "Motherboards", icon: "CircuitBoard", count: 38 },
  { slug: "graphics-card", name: "Graphics Cards (GPU)", icon: "Layers", count: 29 },
  { slug: "ram", name: "RAM (Memory)", icon: "Box", count: 54 },
  { slug: "storage", name: "Storage (SSD / HDD)", icon: "HardDrive", count: 48 },
  { slug: "power-supply", name: "Power Supply (PSU)", icon: "Zap", count: 31 },
  { slug: "casing", name: "Casings", icon: "Box", count: 26 },
  { slug: "monitor", name: "Monitors", icon: "Monitor", count: 35 },
];

export function getProductBySlug(slug: string): Product | undefined {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const exact = CATALOG_PRODUCTS.find((p) => p.slug.toLowerCase() === decoded);
  if (exact) return exact;

  // Match by cleaning common keywords
  const clean = decoded.replace(/-processor|-am5|-gaming|-intel|-amd/g, "");
  return CATALOG_PRODUCTS.find((p) => {
    const pClean = p.slug.toLowerCase().replace(/-processor|-am5|-gaming|-intel|-amd/g, "");
    return (
      p.slug.toLowerCase().includes(clean) ||
      clean.includes(pClean) ||
      p.name.toLowerCase().includes(clean.replace(/-/g, " "))
    );
  });
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return CATALOG_PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}
