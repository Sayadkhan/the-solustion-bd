import { z } from "zod";
import { COMPONENT_TYPES, type ComponentType } from "../constants";

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
  /** The parts behind each error, so a UI can point at them. */
  conflicts: ComponentType[];
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

type BoardSize = "ITX" | "MATX" | "ATX";

const BOARD_SIZE_ORDER: BoardSize[] = ["ITX", "MATX", "ATX"];

/** Reads a form factor such as "Micro-ATX" or "E-ATX". Unknown text returns null. */
export function normalizeFormFactor(formFactor?: string | null): BoardSize | null {
  const value = formFactor?.toLowerCase().replace(/[\s_-]/g, "");
  if (!value) return null;
  if (value.includes("itx")) return "ITX";
  if (value.includes("micro") || value.includes("matx") || value.includes("uatx")) return "MATX";
  if (value.includes("atx") || value.includes("tower")) return "ATX";
  return null;
}

/**
 * Enforces Bangladeshi Tech PC Compatibility Rules (Rule 4.3):
 * 1. CPU.socket === MOBO.socket
 * 2. MOBO.supportedRam === RAM.supportedRam
 * 3. PSU.wattage >= (Total System TDP * 1.25)
 * 4. The motherboard fits inside the case
 */
export function validatePcBuildCompatibility(
  build: SelectedBuildComponents
): CompatibilityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const conflicts = new Set<ComponentType>();

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
      conflicts.add("CPU").add("MOBO");
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
      conflicts.add("MOBO").add("RAM");
    }
  }

  // Rule 3: PSU Wattage headroom
  if (build.PSU) {
    const psuWatts = build.PSU.specs.psuWattage || 0;
    if (psuWatts < totalTdp * 1.25) {
      errors.push(
        `Insufficient Power Supply: Selected PSU is ${psuWatts}W, but the system needs at least ${recommendedPsuWattage}W (Total TDP ${totalTdp}W + 25% safety headroom).`
      );
      conflicts.add("PSU");
    }
  } else {
    warnings.push(
      `No Power Supply selected yet. Recommended minimum PSU: ${recommendedPsuWattage}W.`
    );
  }

  // Rule 4: Motherboard fits the case
  if (build.MOBO && build.CASE) {
    const board = normalizeFormFactor(build.MOBO.specs.formFactor);
    const chassis = normalizeFormFactor(build.CASE.specs.formFactor);
    if (board && chassis && BOARD_SIZE_ORDER.indexOf(board) > BOARD_SIZE_ORDER.indexOf(chassis)) {
      errors.push(
        `Size mismatch: Motherboard (${build.MOBO.name}) is ${build.MOBO.specs.formFactor}, which does not fit the ${build.CASE.specs.formFactor} case (${build.CASE.name}).`
      );
      conflicts.add("MOBO").add("CASE");
    }
  }

  return {
    isCompatible: errors.length === 0,
    totalEstimatedTdpWatts: totalTdp,
    recommendedPsuWattage,
    errors,
    warnings,
    conflicts: [...conflicts],
  };
}
