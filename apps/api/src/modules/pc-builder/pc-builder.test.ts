import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeFormFactor, validatePcBuildCompatibility } from "@solusation/shared-types";
import { classifyPart } from "./part-classifier";

const part = (name: string, specs: Record<string, unknown>) => ({
  name,
  specs: { componentType: "OTHER", tdpWatts: 0, ...specs } as any,
});

describe("classifyPart", () => {
  it("trusts the product's own component type", () => {
    assert.equal(classifyPart({ componentType: "GPU", categorySlug: "storage" }), "GPU");
  });

  it("falls back to the category for products without compatibility details", () => {
    assert.equal(classifyPart({ categorySlug: "graphics-card" }), "GPU");
    assert.equal(classifyPart({ categorySlug: "power-supply" }), "PSU");
    assert.equal(classifyPart({ categorySlug: "casing" }), "CASE");
    assert.equal(classifyPart({ categorySlug: "cooling" }), "COOLER");
    assert.equal(classifyPart({ componentType: "OTHER", categorySlug: "motherboard" }), "MOBO");
  });

  it("uses the parent category for subcategories", () => {
    assert.equal(classifyPart({ categorySlug: "intel-series", parentCategorySlug: "processor" }), "CPU");
  });

  it("does not mistake a CPU cooler for a CPU", () => {
    assert.equal(classifyPart({ categorySlug: "cpu-cooler" }), "COOLER");
  });

  it("leaves unrelated products out", () => {
    assert.equal(classifyPart({ categorySlug: "smart-watch" }), null);
    assert.equal(classifyPart({}), null);
  });
});

describe("normalizeFormFactor", () => {
  it("reads the common ways of writing a size", () => {
    assert.equal(normalizeFormFactor("Micro-ATX"), "MATX");
    assert.equal(normalizeFormFactor("mATX"), "MATX");
    assert.equal(normalizeFormFactor("Mini ITX"), "ITX");
    assert.equal(normalizeFormFactor("ATX"), "ATX");
    assert.equal(normalizeFormFactor("E-ATX"), "ATX");
    assert.equal(normalizeFormFactor(null), null);
  });
});

describe("validatePcBuildCompatibility", () => {
  it("names the parts behind a socket mismatch", () => {
    const result = validatePcBuildCompatibility({
      CPU: part("Ryzen", { socket: "AM5" }),
      MOBO: part("Z790", { socket: "LGA1700" }),
    });
    assert.equal(result.isCompatible, false);
    assert.deepEqual(result.conflicts.sort(), ["CPU", "MOBO"]);
  });

  it("refuses a motherboard too large for the case", () => {
    const result = validatePcBuildCompatibility({
      MOBO: part("Big board", { formFactor: "ATX" }),
      CASE: part("Tiny case", { formFactor: "Mini-ITX" }),
    });
    assert.equal(result.isCompatible, false);
    assert.deepEqual(result.conflicts.sort(), ["CASE", "MOBO"]);
  });

  it("allows a smaller motherboard in a larger case", () => {
    const result = validatePcBuildCompatibility({
      MOBO: part("Small board", { formFactor: "Micro-ATX" }),
      CASE: part("Tower", { formFactor: "ATX" }),
    });
    assert.equal(result.errors.length, 0);
  });

  it("does not guess when a size is unknown", () => {
    const result = validatePcBuildCompatibility({
      MOBO: part("Board", { formFactor: null }),
      CASE: part("Case", { formFactor: "Mini-ITX" }),
    });
    assert.equal(result.errors.length, 0);
  });

  it("counts storage power without producing NaN", () => {
    const result = validatePcBuildCompatibility({ STORAGE: [part("SSD", {})] });
    assert.equal(result.totalEstimatedTdpWatts, 58);
  });
});
