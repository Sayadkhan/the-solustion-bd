import {
  SelectedBuildComponents,
  validatePcBuildCompatibility,
  CompatibilityCheckResult,
  ComponentType,
} from "@solusation/shared-types";
import { db, savedPcBuilds, products, eq, inArray } from "@solusation/database";
import crypto from "crypto";

export interface BuildValidationInput {
  components: Partial<Record<ComponentType, string>>; // slot to productId map
}

export interface EstimatedFpsScore {
  gameTitle: string;
  resolution: string;
  preset: string;
  averageFps: number;
  experienceRating: "playable" | "smooth" | "competitive" | "ultra";
}

export interface ComprehensiveValidationResult extends CompatibilityCheckResult {
  totalCashPriceBdt: number;
  totalRegularPriceBdt: number;
  estimatedFps: EstimatedFpsScore[];
  resolvedComponents: Record<
    string,
    {
      id: string;
      name: string;
      sku: string;
      cashPriceBdt: number;
      regularPriceBdt: number;
      images: string[];
      compatibility: any;
    }
  >;
}

export class PcBuilderService {
  async validateBuildByProductIds(
    input: BuildValidationInput
  ): Promise<ComprehensiveValidationResult> {
    const componentEntries = Object.entries(input.components).filter(
      ([, id]) => typeof id === "string" && id.trim().length > 0
    ) as [ComponentType, string][];

    const productIds = componentEntries.map(([, id]) => id);

    let productRecords: (typeof products.$inferSelect)[] = [];
    if (productIds.length > 0) {
      productRecords = await db.query.products.findMany({
        where: inArray(products.id, productIds),
      });
    }

    const productMap = new Map<string, typeof products.$inferSelect>();
    for (const p of productRecords) {
      productMap.set(p.id, p);
    }

    const selectedBuild: SelectedBuildComponents = {};
    const resolvedComponents: ComprehensiveValidationResult["resolvedComponents"] = {};
    let totalCashPriceBdt = 0;
    let totalRegularPriceBdt = 0;

    let cpuBenchmark = 0;
    let gpuBenchmark = 0;

    for (const [slot, pId] of componentEntries) {
      const prod = productMap.get(pId);
      if (prod) {
        totalCashPriceBdt += prod.cashPriceBdt;
        totalRegularPriceBdt += prod.regularPriceBdt;

        const comp = prod.compatibility || {
          componentType: slot,
          tdpWatts: 0,
        };

        if (slot === "CPU") {
          selectedBuild.CPU = { name: prod.name, specs: comp as any };
          cpuBenchmark = comp.benchmarkScore || 15000;
        } else if (slot === "MOBO") {
          selectedBuild.MOBO = { name: prod.name, specs: comp as any };
        } else if (slot === "RAM") {
          selectedBuild.RAM = { name: prod.name, specs: comp as any };
        } else if (slot === "GPU") {
          selectedBuild.GPU = { name: prod.name, specs: comp as any };
          gpuBenchmark = comp.benchmarkScore || 10000;
        } else if (slot === "PSU") {
          selectedBuild.PSU = { name: prod.name, specs: comp as any };
        } else if (slot === "CASE") {
          selectedBuild.CASE = { name: prod.name, specs: comp as any };
        } else if (slot === "COOLER") {
          selectedBuild.COOLER = { name: prod.name, specs: comp as any };
        }

        resolvedComponents[slot] = {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          cashPriceBdt: prod.cashPriceBdt,
          regularPriceBdt: prod.regularPriceBdt,
          images: Array.isArray(prod.images) ? prod.images : [],
          compatibility: comp,
        };
      }
    }

    // 1. Run core electrical & socket checks
    const baseResult = validatePcBuildCompatibility(selectedBuild);
    const errors = [...baseResult.errors];
    const warnings = [...baseResult.warnings];

    // 2. Extra form factor check (Motherboard vs Case)
    if (selectedBuild.MOBO?.specs.formFactor && selectedBuild.CASE?.specs.formFactor) {
      const moboFF = selectedBuild.MOBO.specs.formFactor.toUpperCase();
      const caseFF = selectedBuild.CASE.specs.formFactor.toUpperCase();

      if (moboFF.includes("E-ATX") && !caseFF.includes("E-ATX")) {
        errors.push(
          `Form factor incompatibility: Extended-ATX motherboard (${selectedBuild.MOBO.name}) will not fit in selected casing (${selectedBuild.CASE.name}).`
        );
      } else if (moboFF.includes("ATX") && caseFF.includes("MINI-ITX")) {
        errors.push(
          `Form factor incompatibility: Standard ATX motherboard (${selectedBuild.MOBO.name}) will not fit in a Mini-ITX case.`
        );
      }
    }

    // 3. Estimate Gaming FPS projections
    const estimatedFps = this.calculateEstimatedFps(cpuBenchmark, gpuBenchmark);

    return {
      isCompatible: errors.length === 0,
      totalEstimatedTdpWatts: baseResult.totalEstimatedTdpWatts,
      recommendedPsuWattage: baseResult.recommendedPsuWattage,
      totalCashPriceBdt,
      totalRegularPriceBdt,
      errors,
      warnings,
      estimatedFps,
      resolvedComponents,
    };
  }

  private calculateEstimatedFps(cpuScore: number, gpuScore: number): EstimatedFpsScore[] {
    if (gpuScore === 0) {
      return [
        {
          gameTitle: "Valorant / CS2",
          resolution: "1080p",
          preset: "Low / Competitive",
          averageFps: cpuScore > 0 ? Math.min(Math.round(cpuScore / 300), 75) : 30,
          experienceRating: "playable",
        },
      ];
    }

    const gpuFactor = gpuScore / 1000;
    const cpuFactor = (cpuScore || 15000) / 1000;
    const combinedWeight = gpuFactor * 0.75 + cpuFactor * 0.25;

    const fpsCompetitive = Math.round(combinedWeight * 18);
    const fpsCyberpunk = Math.round(combinedWeight * 4.8);
    const fpsWarzone = Math.round(combinedWeight * 8.5);
    const fpsWukong = Math.round(combinedWeight * 5.2);

    return [
      {
        gameTitle: "Valorant / CS2",
        resolution: "1080p",
        preset: "High / Competitive",
        averageFps: fpsCompetitive,
        experienceRating: fpsCompetitive >= 240 ? "ultra" : fpsCompetitive >= 144 ? "competitive" : "smooth",
      },
      {
        gameTitle: "Call of Duty: Warzone",
        resolution: "1440p",
        preset: "Balanced",
        averageFps: fpsWarzone,
        experienceRating: fpsWarzone >= 120 ? "ultra" : fpsWarzone >= 60 ? "smooth" : "playable",
      },
      {
        gameTitle: "Cyberpunk 2077",
        resolution: "1080p",
        preset: "Ultra (RT Off)",
        averageFps: fpsCyberpunk,
        experienceRating: fpsCyberpunk >= 90 ? "ultra" : fpsCyberpunk >= 60 ? "smooth" : "playable",
      },
      {
        gameTitle: "Black Myth: Wukong",
        resolution: "1080p",
        preset: "High / TSR",
        averageFps: fpsWukong,
        experienceRating: fpsWukong >= 80 ? "ultra" : fpsWukong >= 60 ? "smooth" : "playable",
      },
    ];
  }

  async saveBuild(data: {
    userId?: string;
    isSimulatorBuild?: boolean;
    components: Partial<Record<ComponentType, string>>;
  }) {
    // Validate and calculate totals
    const validation = await this.validateBuildByProductIds({
      components: data.components,
    });

    const shortCode = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "9F4B2C1A"

    // Bonus Promo Code for builds over ৳1,00,000
    let unlockedPromoCode: string | undefined = undefined;
    if (validation.totalCashPriceBdt >= 100000) {
      unlockedPromoCode = `PCBUILD-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    }

    const [record] = await db
      .insert(savedPcBuilds)
      .values({
        shortCode,
        userId: data.userId,
        isSimulatorBuild: data.isSimulatorBuild || false,
        components: data.components as Record<string, string>,
        totalWattage: validation.totalEstimatedTdpWatts,
        totalCashPriceBdt: validation.totalCashPriceBdt,
        unlockedPromoCode,
      })
      .returning();

    return {
      ...record,
      validation,
    };
  }

  async getBuildByShortCode(shortCode: string) {
    const cleanCode = shortCode.trim().toUpperCase();
    const build = await db.query.savedPcBuilds.findFirst({
      where: eq(savedPcBuilds.shortCode, cleanCode),
      with: {
        user: true,
      },
    });

    if (!build) return null;

    const validation = await this.validateBuildByProductIds({
      components: build.components as any,
    });

    return {
      ...build,
      validation,
      shareableUrl: `/pc-builder?build=${build.shortCode}`,
    };
  }

  // Backward compatible alias
  async getBuildByShareId(shareId: string) {
    return this.getBuildByShortCode(shareId);
  }
}

export const pcBuilderService = new PcBuilderService();
