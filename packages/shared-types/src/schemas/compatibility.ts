import { z } from "zod";
import { COMPONENT_TYPES } from "../constants";

export const CompatibilitySchema = z.object({
  componentType: z.enum(COMPONENT_TYPES),
  socket: z.string().nullable().optional(), // e.g. "LGA1700", "AM5", "AM4"
  supportedRam: z.string().nullable().optional(), // e.g. "DDR5", "DDR4"
  tdpWatts: z.number().int().nonnegative().optional().default(0),
  formFactor: z.string().nullable().optional(), // e.g. "ATX", "Micro-ATX", "Mini-ITX"
  psuWattage: z.number().int().positive().nullable().optional(), // e.g. 750, 850
  benchmarkScore: z.number().int().nonnegative().optional(),
});

export type HardwareCompatibility = z.infer<typeof CompatibilitySchema>;
export type CompatibilitySpecs = HardwareCompatibility;

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  totalEstimatedTdpWatts: number;
  recommendedPsuWattage: number;
  errors: string[];
  warnings: string[];
}

export interface SelectedBuildComponents {
  CPU?: { name: string; specs: HardwareCompatibility };
  MOBO?: { name: string; specs: HardwareCompatibility };
  RAM?: { name: string; specs: HardwareCompatibility; quantity?: number };
  GPU?: { name: string; specs: HardwareCompatibility };
  STORAGE?: { name: string; specs: HardwareCompatibility }[];
  PSU?: { name: string; specs: HardwareCompatibility };
  CASE?: { name: string; specs: HardwareCompatibility };
  COOLER?: { name: string; specs: HardwareCompatibility };
  MONITOR?: { name: string; specs: HardwareCompatibility };
}

/**
 * Enforces Bangladeshi Tech PC Compatibility Rules (Rule 4.3):
 * 1. CPU.socket === MOBO.socket
 * 2. MOBO.supportedRam === RAM.supportedRam
 * 3. PSU.wattage >= (Total System TDP * 1.25)
 */
export function validatePcBuildCompatibility(
  build: SelectedBuildComponents
): CompatibilityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let totalTdp = 50; // Base system motherboard & peripheral overhead

  // 1. CPU TDP
  if (build.CPU?.specs.tdpWatts) {
    totalTdp += build.CPU.specs.tdpWatts;
  }

  // 2. GPU TDP
  if (build.GPU?.specs.tdpWatts) {
    totalTdp += build.GPU.specs.tdpWatts;
  }

  // 3. Storage / RAM TDP
  if (build.RAM) totalTdp += (build.RAM.quantity || 1) * 5;
  if (build.STORAGE) totalTdp += build.STORAGE.length * 8;
  if (build.COOLER?.specs.tdpWatts) totalTdp += 10;

  // 1.25x safety overhead rule
  const recommendedPsuWattage = Math.ceil((totalTdp * 1.25) / 50) * 50;

  // Rule 1: Socket match
  if (build.CPU && build.MOBO) {
    const cpuSocket = build.CPU.specs.socket?.trim().toLowerCase();
    const moboSocket = build.MOBO.specs.socket?.trim().toLowerCase();
    if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
      errors.push(
        `Socket mismatch: Processor (${build.CPU.name}) uses ${build.CPU.specs.socket}, but Motherboard (${build.MOBO.name}) has ${build.MOBO.specs.socket} socket.`
      );
    }
  }

  // Rule 2: RAM Generation match
  if (build.MOBO && build.RAM) {
    const moboRam = build.MOBO.specs.supportedRam?.trim().toUpperCase();
    const ramGen = build.RAM.specs.supportedRam?.trim().toUpperCase();
    if (moboRam && ramGen && !moboRam.includes(ramGen)) {
      errors.push(
        `Memory mismatch: Motherboard (${build.MOBO.name}) requires ${moboRam}, but selected RAM is ${ramGen}.`
      );
    }
  }

  // Rule 3: PSU Wattage headroom
  if (build.PSU) {
    const psuWatts = build.PSU.specs.psuWattage || 0;
    if (psuWatts < totalTdp * 1.25) {
      errors.push(
        `Insufficient Power Supply: Selected PSU is ${psuWatts}W, but the system needs at least ${recommendedPsuWattage}W (Total TDP ${totalTdp}W + 25% safety headroom).`
      );
    }
  } else {
    warnings.push(
      `No Power Supply selected yet. Recommended minimum PSU: ${recommendedPsuWattage}W.`
    );
  }

  return {
    isCompatible: errors.length === 0,
    totalEstimatedTdpWatts: totalTdp,
    recommendedPsuWattage,
    errors,
    warnings,
  };
}
