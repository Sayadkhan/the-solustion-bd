import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeBlogHtml } from "./sanitize-blog-html";

describe("sanitizeBlogHtml", () => {
  it("removes scripts and inline event handlers", () => {
    const clean = sanitizeBlogHtml(`<p onclick="steal()">Hi</p><script>steal()</script><img src="https://x.test/a.png" onerror="steal()">`);
    assert.ok(!clean.includes("script"));
    assert.ok(!clean.includes("onclick"));
    assert.ok(!clean.includes("onerror"));
    assert.ok(clean.includes("Hi"));
    assert.ok(clean.includes("https://x.test/a.png"));
  });

  it("removes javascript: links", () => {
    assert.ok(!sanitizeBlogHtml(`<a href="javascript:steal()">x</a>`).includes("javascript"));
  });

  it("allows YouTube embeds but no other iframes", () => {
    assert.ok(sanitizeBlogHtml(`<iframe src="https://www.youtube.com/embed/abc"></iframe>`).includes("youtube.com/embed/abc"));
    assert.ok(!sanitizeBlogHtml(`<iframe src="https://evil.example/x"></iframe>`).includes("evil.example"));
  });

  it("keeps the formatting the admin editor produces", () => {
    const html = `<table class="w-full"><tr><td class="p-2">x</td></tr></table><h2>Title</h2><a href="https://a.test" target="_blank">l</a>`;
    const clean = sanitizeBlogHtml(html);
    assert.ok(clean.includes(`class="w-full"`));
    assert.ok(clean.includes("<h2>"));
    assert.ok(clean.includes(`rel="noopener noreferrer"`));
  });
});
