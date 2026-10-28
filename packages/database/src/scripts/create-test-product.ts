import { db, products, branchInventory, categories, brands, eq } from "../index";

async function run() {
  const gpuCat = await db.query.categories.findFirst({
    where: eq(categories.name, "Graphics Cards (GPU)"),
  });
  const msiBrand = await db.query.brands.findFirst({
    where: eq(brands.name, "MSI"),
  });

  const categoryId = gpuCat ? gpuCat.id : undefined;
  const brandId = msiBrand ? msiBrand.id : undefined;

  const slug = "msi-geforce-rtx-4070-ti-super-16g-gaming-x-slim";
  const existing = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });

  if (existing) {
    console.log("Product already exists with ID:", existing.id);
    return;
  }

  const uploadedImageUrl = "http://localhost:4000/uploads/products/307136125_595271112073653_2620018587711158776_n-1793142187832-02d743cd.jpg";

  const [newProduct] = await db
    .insert(products)
    .values({
      name: "MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM",
      sku: "GPU-MSI-4070TIS-16G",
      slug,
      categoryId,
      brandId,
      cashPriceBdt: 118000,
      regularPriceBdt: 125000,
      costPriceBdt: 110000,
      isEmiAvailable: false,
      totalStock: 15,
      stockStatus: "IN_STOCK",
      warrantyDurationMonths: 36,
      warrantyTerms: "Official 3 Years MSI Manufacturer Warranty",
      videoUrl: "https://www.youtube.com/watch?v=0hC0JzB7r4E",
      images: [uploadedImageUrl],
      keyFeatures: [
        "Powered by NVIDIA DLSS 3 and Ada Lovelace Architecture",
        "16GB GDDR6X 256-Bit Ultra-High Speed Memory",
        "TRI FROZR 3 Thermal System with TORX FAN 5.0",
        "Official 3 Years MSI Bangladesh Warranty",
      ],
      compatibility: {
        componentType: "GPU",
        tdpWatts: 285,
      },
    })
    .returning();

  console.log("Successfully created product:", newProduct.id, newProduct.name);

  // Add branch inventory
  await db.insert(branchInventory).values([
    {
      productId: newProduct.id,
      branchCode: "IDB",
      stock: 5,
    },
    {
      productId: newProduct.id,
      branchCode: "MULTIPLAN",
      stock: 5,
    },
    {
      productId: newProduct.id,
      branchCode: "ONLINE_WAREHOUSE",
      stock: 5,
    },
  ]);

  console.log("Branch inventory initialized!");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error creating product:", e);
    process.exit(1);
  });
