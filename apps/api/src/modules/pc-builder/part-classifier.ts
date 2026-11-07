import type { ComponentType } from "@solusation/shared-types";

export const PC_BUILDER_SLOTS = [
  "CASE",
  "MOBO",
  "CPU",
  "COOLER",
  "RAM",
  "GPU",
  "STORAGE",
  "PSU",
  "MONITOR",
] as const;

export type PcBuilderSlot = (typeof PC_BUILDER_SLOTS)[number];

// Checked in order: "liquid-cooler" must not match a broader word first.
const SLOT_BY_CATEGORY_KEYWORD: Array<[RegExp, PcBuilderSlot]> = [
  [/cool|aio|liquid/, "COOLER"],
  [/processor|^cpu|-cpu/, "CPU"],
  [/mother-?board/, "MOBO"],
  [/graphics|gpu|video-card/, "GPU"],
  [/ram|memory/, "RAM"],
  [/storage|ssd|hdd|hard-disk|nvme/, "STORAGE"],
  [/power-supply|psu/, "PSU"],
  [/casing|^case|pc-case/, "CASE"],
  [/monitor|display/, "MONITOR"],
];

function slotFromCategory(slug?: string | null): PcBuilderSlot | null {
  if (!slug) return null;
  const value = slug.toLowerCase();
  return SLOT_BY_CATEGORY_KEYWORD.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

/**
 * Decides which builder slot a product belongs to. The product's own component
 * type wins; its category covers products added without compatibility details.
 */
export function classifyPart(product: {
  componentType?: ComponentType | null;
  categorySlug?: string | null;
  parentCategorySlug?: string | null;
}): PcBuilderSlot | null {
  const { componentType } = product;
  if (componentType && (PC_BUILDER_SLOTS as readonly string[]).includes(componentType)) {
    return componentType as PcBuilderSlot;
  }
  return slotFromCategory(product.categorySlug) ?? slotFromCategory(product.parentCategorySlug);
}
