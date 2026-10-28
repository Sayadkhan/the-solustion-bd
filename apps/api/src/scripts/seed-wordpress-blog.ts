import { pool } from "@solusation/database";

async function main() {
  console.log("Seeding comprehensive WordPress-style formatted blog post...");

  const title = "AMD Ryzen 7 7800X3D Gaming PC Build Guide: Ultimate Bangladesh Benchmark & Price (2026)";
  const slug = "amd-ryzen-7-7800x3d-gaming-pc-build-guide-bangladesh";
  const category = "Buying Guide";
  const excerpt = "Complete 2026 buying guide for building an elite AMD Ryzen 7 7800X3D gaming PC in Bangladesh with official distributor warranty, benchmarks, specs table, and motherboard matching.";
  const featuredImage = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1200&auto=format&fit=crop";

  const content = `
    <h1>The Undisputed Gaming King in Bangladesh: AMD Ryzen 7 7800X3D</h1>
    <p>
      When building a top-tier competitive esports and AAA gaming battle-station in Bangladesh, the <strong>AMD Ryzen 7 7800X3D</strong> remains the undisputed champion. Thanks to AMD's cutting-edge 3D V-Cache architecture, this 8-core, 16-thread powerhouse delivers blistering frame rates that outpace even higher power consumption flagships. At <a href="https://thesolutionsbd.com" target="_blank" rel="dofollow" class="text-primary font-bold underline">The Solutions BD</a>, we guarantee 100% authentic box processors with verified serial numbers and 3-years official distributor replacement warranty.
    </p>

    <h2>Why 3D V-Cache Dominates Modern Gaming Titles</h2>
    <p>
      Traditional processors suffer from memory latency bottlenecks when high-refresh gaming requires millisecond draw calls. With a massive <strong>96MB of stacked L3 cache</strong>, the Ryzen 7 7800X3D keeps crucial game assets directly on the chip, virtually eliminating 1% low frame dips in competitive games like <em>Valorant, CS2, Cyberpunk 2077: Phantom Liberty, and Call of Duty: Warzone</em>.
    </p>

    <figure class="my-6 text-center">
      <img
        src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop"
        alt="AMD Ryzen Processor on High-End Motherboard"
        class="max-w-full rounded-2xl mx-auto shadow-xl border border-border"
        loading="lazy"
      />
      <figcaption class="text-xs text-muted-foreground mt-2 italic font-mono">
        Figure 1.0: Authentic AMD Ryzen AM5 Processor installed in an ATX Gaming Rig at The Solutions BD IDB Branch.
      </figcaption>
    </figure>

    <h3>Optimal Component Pairing & Specs Breakdown</h3>
    <p>
      To extract maximum clock boost headroom from your CPU, pairing it with the correct motherboard and ultra-fast DDR5 RAM is crucial. Check out our live <a href="https://thesolutionsbd.com/products?category=processor" target="_blank" rel="dofollow" class="text-primary font-bold underline">Processor Collection</a> to compare real-time cash discount prices across Bangladesh branches.
    </p>

    <div class="overflow-x-auto my-5">
      <table class="w-full text-xs text-left border border-border border-collapse rounded-xl overflow-hidden shadow-sm">
        <thead class="bg-muted/70 text-foreground font-bold">
          <tr>
            <th class="p-3 border border-border">Component Type</th>
            <th class="p-3 border border-border">Recommended Model</th>
            <th class="p-3 border border-border">Key Advantage</th>
            <th class="p-3 border border-border text-right">Approx. Cash Price (BDT)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr>
            <td class="p-3 border border-border font-semibold">Processor (CPU)</td>
            <td class="p-3 border border-border">AMD Ryzen 7 7800X3D (8C/16T)</td>
            <td class="p-3 border border-border">96MB 3D V-Cache, 5.0 GHz Max Boost</td>
            <td class="p-3 border border-border font-mono text-emerald-500 font-bold text-right">৳ 51,500</td>
          </tr>
          <tr>
            <td class="p-3 border border-border font-semibold">Motherboard</td>
            <td class="p-3 border border-border">MSI B650 Gaming Plus WiFi</td>
            <td class="p-3 border border-border">12+2+1 Duet Rail VRM, PCIe 4.0 M.2</td>
            <td class="p-3 border border-border font-mono text-emerald-500 font-bold text-right">৳ 23,500</td>
          </tr>
          <tr>
            <td class="p-3 border border-border font-semibold">Graphics Card (GPU)</td>
            <td class="p-3 border border-border">GeForce RTX 4070 Ti Super 16GB</td>
            <td class="p-3 border border-border">16GB VRAM, DLSS 3.5 Frame Gen, Ray Tracing</td>
            <td class="p-3 border border-border font-mono text-emerald-500 font-bold text-right">৳ 1,08,000</td>
          </tr>
          <tr>
            <td class="p-3 border border-border font-semibold">Memory (RAM)</td>
            <td class="p-3 border border-border">G.Skill Flare X5 32GB (2x16GB) DDR5</td>
            <td class="p-3 border border-border">6000MHz CL30 EXPO Optimized</td>
            <td class="p-3 border border-border font-mono text-emerald-500 font-bold text-right">৳ 14,800</td>
          </tr>
          <tr>
            <td class="p-3 border border-border font-semibold">Power Supply (PSU)</td>
            <td class="p-3 border border-border">Corsair RM850e 850W 80+ Gold</td>
            <td class="p-3 border border-border">ATX 3.0 & PCIe 5.0 Native 12VHPWR Cable</td>
            <td class="p-3 border border-border font-mono text-emerald-500 font-bold text-right">৳ 15,200</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h4>Thermal Management & Cooling Requirements</h4>
    <p>
      Despite its staggering gaming performance, the 7800X3D operates at a frugal 120W TDP. A quality 240mm or 360mm AIO liquid cooler or dual-tower air cooler will easily maintain core temperatures below 72°C even under sustained summer load in Dhaka.
    </p>

    <div class="p-4 my-5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-foreground flex items-start gap-3">
      <span class="text-blue-500 font-bold text-base">💡 Pro Tip for Buyers:</span>
      <div class="text-xs leading-relaxed">
        When purchasing in Bangladesh, verify that the serial number on the outer packaging carton matches the laser-etched IHS on the processor to ensure full warranty support through our <a href="https://thesolutionsbd.com/track-order" target="_blank" rel="nofollow" class="text-primary font-semibold underline">Online Serial RMA Tracker</a>.
      </div>
    </div>

    <p>
      Ready to assemble your dream gaming rig? Visit our flagship showroom at <strong>IDB Bhaban (SR-140)</strong> or use our interactive <a href="https://thesolutionsbd.com/pc-builder" target="_blank" rel="dofollow" class="text-primary font-bold underline">PC Builder Engine</a> with live wattage calculator!
    </p>
  `;

  const metaTitle = "AMD Ryzen 7 7800X3D Gaming PC Build Guide BD | Price & Specs (2026)";
  const metaDescription = "Build the ultimate AMD Ryzen 7 7800X3D gaming PC in Bangladesh. View benchmarks, component pricing, motherboards, and official warranty details.";
  const metaKeywords = ["ryzen 7 7800x3d price in bd", "gaming pc build bangladesh", "the solutions bd", "b650 motherboard bd"];
  const canonicalUrl = `https://thesolutionsbd.com/blogs/${slug}`;
  const backlinks = [
    {
      anchorText: "The Solutions BD",
      url: "https://thesolutionsbd.com",
      rel: "dofollow",
      targetBlank: true
    },
    {
      anchorText: "Processor Collection",
      url: "https://thesolutionsbd.com/products?category=processor",
      rel: "dofollow",
      targetBlank: true
    },
    {
      anchorText: "PC Builder Engine",
      url: "https://thesolutionsbd.com/pc-builder",
      rel: "dofollow",
      targetBlank: true
    }
  ];

  // Insert or Update
  await pool.query(
    `INSERT INTO blogs (
      id, title, slug, excerpt, content, featured_image, author_name, category,
      tags, status, view_count, reading_time_minutes, meta_title, meta_description,
      meta_keywords, canonical_url, backlinks, published_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, 'The Solutions BD Editorial', $6,
      $7, 'PUBLISHED', 1420, 5, $8, $9, $10, $11, $12, NOW(), NOW(), NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = $1,
      excerpt = $3,
      content = $4,
      featured_image = $5,
      category = $6,
      tags = $7,
      status = 'PUBLISHED',
      meta_title = $8,
      meta_description = $9,
      meta_keywords = $10,
      canonical_url = $11,
      backlinks = $12,
      updated_at = NOW()`,
    [
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      JSON.stringify(["AMD", "Ryzen 7 7800X3D", "Gaming PC", "Benchmarks", "Bangladesh"]),
      metaTitle,
      metaDescription,
      JSON.stringify(metaKeywords),
      canonicalUrl,
      JSON.stringify(backlinks)
    ]
  );

  console.log("Successfully seeded WordPress-style blog post!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
