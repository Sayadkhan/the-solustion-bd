import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesImageSignature } from "./upload.service";

describe("matchesImageSignature", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const html = Buffer.from("<html><script>alert(1)</script></html>");

  it("accepts files whose content matches their type", () => {
    assert.equal(matchesImageSignature("image/png", png), true);
    assert.equal(matchesImageSignature("image/jpeg", jpeg), true);
    assert.equal(matchesImageSignature("image/gif", Buffer.from("GIF89a")), true);
    assert.equal(matchesImageSignature("image/webp", Buffer.from("RIFF0000WEBPVP8 ")), true);
    assert.equal(matchesImageSignature("image/svg+xml", Buffer.from(`<?xml version="1.0"?><svg xmlns="x"></svg>`)), true);
  });

  it("refuses a file pretending to be an image", () => {
    assert.equal(matchesImageSignature("image/png", html), false);
    assert.equal(matchesImageSignature("image/jpeg", png), false);
    assert.equal(matchesImageSignature("image/svg+xml", html), false);
    assert.equal(matchesImageSignature("text/html", html), false);
  });
});
