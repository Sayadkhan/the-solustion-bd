import { Injectable, NotFoundException } from "@nestjs/common";
import {
  SelectedBuildComponents,
  validatePcBuildCompatibility,
  CompatibilityCheckResult,
  ComponentType,
} from "@solusation/shared-types";
import { db, savedPcBuilds, products, eq, inArray } from "@solusation/database";
import crypto from "crypto";

export interface BuildValidationInput {
  components: Partial<Record<ComponentType, string>>;
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

@Injectable()
export class PcBuilderService {
  async validateBuildByProductIds(
    input: BuildValidationInput
  ): Promise<ComprehensiveValidationResult> {
    const componentEntries = Object.entries(input.components).filter(
      ([, id]) => typeof id === "string" && (id as string).trim().length > 0
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

    const selectedComponents: SelectedBuildComponents = {};
    const resolvedComponents: Record<string, any> = {};
    let totalCashPriceBdt = 0;
    let totalRegularPriceBdt = 0;

    for (const [slot, prodId] of componentEntries) {
      const prod = productMap.get(prodId);
      if (prod) {
        if (slot !== "OTHER") {
          (selectedComponents as any)[slot] = {
            name: prod.name,
            specs: (prod.compatibility as any) || {},
          };
        }

        resolvedComponents[slot] = {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          cashPriceBdt: prod.cashPriceBdt,
          regularPriceBdt: prod.regularPriceBdt,
          images: Array.isArray(prod.images) ? prod.images : [],
          compatibility: prod.compatibility,
        };

        totalCashPriceBdt += prod.cashPriceBdt;
        totalRegularPriceBdt += prod.regularPriceBdt;
      }
    }

    const validation = validatePcBuildCompatibility(selectedComponents);
    const estimatedFps = this.estimateGamingFps(selectedComponents);

    return {
      ...validation,
      totalCashPriceBdt,
      totalRegularPriceBdt,
      estimatedFps,
      resolvedComponents,
    };
  }

  private estimateGamingFps(build: SelectedBuildComponents): EstimatedFpsScore[] {
    const gpu = build.GPU;
    const cpu = build.CPU;

    if (!gpu && !cpu) return [];

    let gpuScore = 0;
    if (gpu?.specs?.benchmarkScore) {
      gpuScore = gpu.specs.benchmarkScore;
    } else if (gpu?.name) {
      const name = gpu.name.toUpperCase();
      if (name.includes("4080")) gpuScore = 48000;
      else if (name.includes("4070 SUPER")) gpuScore = 32000;
      else if (name.includes("4070")) gpuScore = 27000;
      else if (name.includes("4060 TI")) gpuScore = 22000;
      else if (name.includes("4060")) gpuScore = 19500;
      else if (name.includes("7800 XT")) gpuScore = 29000;
      else if (name.includes("7700 XT")) gpuScore = 23000;
      else if (name.includes("7600")) gpuScore = 16000;
      else gpuScore = 14000;
    }

    if (gpuScore === 0) {
      return [
        {
          gameTitle: "Valorant / CS2",
          resolution: "1080p",
          preset: "Low (iGPU)",
          averageFps: 65,
          experienceRating: "playable",
        },
      ];
    }

    const factor1080p = gpuScore / 100;
    const factor1440p = gpuScore / 160;

    return [
      {
        gameTitle: "Cyberpunk 2077",
        resolution: "1080p",
        preset: "Ultra / Ray Tracing",
        averageFps: Math.round(factor1080p * 0.42),
        experienceRating: factor1080p * 0.42 > 80 ? "ultra" : factor1080p * 0.42 > 50 ? "smooth" : "playable",
      },
      {
        gameTitle: "Valorant",
        resolution: "1080p",
        preset: "Competitive High",
        averageFps: Math.min(550, Math.round(factor1080p * 1.8)),
        experienceRating: "competitive",
      },
      {
        gameTitle: "Call of Duty: Warzone",
        resolution: "1440p",
        preset: "Balanced",
        averageFps: Math.round(factor1440p * 0.72),
        experienceRating: factor1440p * 0.72 > 100 ? "ultra" : factor1440p * 0.72 > 60 ? "smooth" : "playable",
      },
      {
        gameTitle: "Black Myth: Wukong",
        resolution: "1080p",
        preset: "Very High / DLSS",
        averageFps: Math.round(factor1080p * 0.48),
        experienceRating: factor1080p * 0.48 > 75 ? "ultra" : factor1080p * 0.48 > 45 ? "smooth" : "playable",
      },
    ];
  }

  async saveBuild(data: {
    userId?: string;
    title?: string;
    componentIds: Record<string, string>;
    totalCashBdt: number;
    totalRegularBdt: number;
    estimatedTdpWatts: number;
  }) {
    const shortCode = `SOL-PC-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const [saved] = await db
      .insert(savedPcBuilds)
      .values({
        shortCode,
        userId: data.userId || null,
        components: data.componentIds,
        totalCashPriceBdt: data.totalCashBdt,
        totalWattage: data.estimatedTdpWatts,
        isSimulatorBuild: true,
      })
      .returning();

    return saved;
  }

  async getBuildByShortCode(shortCode: string) {
    const build = await db.query.savedPcBuilds.findFirst({
      where: eq(savedPcBuilds.shortCode, shortCode),
    });

    if (!build) {
      throw new NotFoundException(`PC Build quotation '${shortCode}' not found`);
    }

    const componentIds = Object.values((build.components as Record<string, string>) || {});
    let productRecords: (typeof products.$inferSelect)[] = [];

    if (componentIds.length > 0) {
      productRecords = await db.query.products.findMany({
        where: inArray(products.id, componentIds),
      });
    }

    const productMap = new Map(productRecords.map((p) => [p.id, p]));
    const resolved: Record<string, any> = {};

    for (const [slot, prodId] of Object.entries((build.components as Record<string, string>) || {})) {
      resolved[slot] = productMap.get(prodId) || null;
    }

    return {
      ...build,
      resolvedComponents: resolved,
    };
  }
}
