// Runs against the real Nest app with the real guards. No database is needed:
// every request asserted here is decided before any query runs.
import "./test-env";
import "reflect-metadata";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { NestFactory, Reflector, DiscoveryService, DiscoveryModule } from "@nestjs/core";
import { Module } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import jwt from "jsonwebtoken";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { IS_PUBLIC_KEY } from "./common/decorators/public.decorator";
import { ROLES_KEY } from "./common/decorators/roles.decorator";

@Module({ imports: [AppModule, DiscoveryModule] })
class TestModule {}

let app: NestExpressApplication;
let base: string;

const tokenFor = (role: string) =>
  jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "t@example.com", role }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "5m",
  });

const call = (method: string, path: string, options: { role?: string; origin?: string; body?: unknown } = {}) =>
  fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.role ? { Authorization: `Bearer ${tokenFor(options.role)}` } : {}),
      ...(options.origin ? { Origin: options.origin } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

before(async () => {
  app = await NestFactory.create<NestExpressApplication>(TestModule, { logger: false });
  configureApp(app);
  await app.listen(0, "127.0.0.1");
  base = `${await app.getUrl()}/api/v1`.replace("[::1]", "127.0.0.1");
});

after(async () => {
  await app.close();
});

describe("route access", () => {
  // Staff routes reject the request in the guards, before reaching the database.
  const STAFF_ONLY: Array<[string, string]> = [
    ["GET", "/orders"],
    ["GET", "/orders/SOL-2026-AAAA"],
    ["PATCH", "/orders/SOL-2026-AAAA/status"],
    ["PATCH", "/orders/SOL-2026-AAAA/deposit"],
    ["POST", "/products"],
    ["DELETE", "/products/some-id"],
    ["PATCH", "/products/some-id/stock"],
    ["POST", "/products/categories"],
    ["DELETE", "/products/categories/some-id"],
    ["POST", "/products/brands"],
    ["PUT", "/settings"],
    ["GET", "/settings/inquiries"],
    ["PATCH", "/settings/inquiries/some-id/status"],
    ["POST", "/blogs"],
    ["PUT", "/blogs/some-id"],
    ["DELETE", "/blogs/some-id"],
    ["GET", "/blogs/admin/all"],
    ["POST", "/banners"],
    ["GET", "/banners/admin"],
    ["GET", "/serials"],
    ["POST", "/serials"],
    ["POST", "/upload/single"],
    ["POST", "/upload/multiple"],
    ["POST", "/search/reindex"],
    ["GET", "/bkash/query/some-id"],
  ];

  for (const [method, path] of STAFF_ONLY) {
    it(`${method} ${path} refuses anonymous and customer requests`, async () => {
      assert.equal((await call(method, path)).status, 401);
      assert.equal((await call(method, path, { role: "CUSTOMER" })).status, 403);
    });
  }

  it("an SEO manager cannot reach orders or products", async () => {
    assert.equal((await call("GET", "/orders", { role: "SEO_MANAGER" })).status, 403);
    assert.equal((await call("DELETE", "/products/some-id", { role: "SEO_MANAGER" })).status, 403);
  });

  it("a forged token is refused", async () => {
    const forged = jwt.sign({ id: "x", email: "x@x.com", role: "SUPER_ADMIN" }, "wrong-secret");
    const res = await fetch(`${base}/orders`, { headers: { Authorization: `Bearer ${forged}` } });
    assert.equal(res.status, 401);
  });

  it("a token using alg=none is refused", async () => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "none", typ: "JWT" })}.${encode({ id: "x", role: "SUPER_ADMIN" })}.`;
    const res = await fetch(`${base}/orders`, { headers: { Authorization: `Bearer ${unsigned}` } });
    assert.equal(res.status, 401);
  });

  it("every route is explicitly public, role-restricted, or on the signed-in list", () => {
    const SIGNED_IN_ONLY = new Set(["getMe", "resendVerification", "changePassword"]);
    const reflector = app.get(Reflector);
    const unprotected: string[] = [];

    for (const wrapper of app.get(DiscoveryService).getControllers()) {
      const prototype = wrapper.metatype?.prototype;
      if (!prototype) continue;

      for (const name of Object.getOwnPropertyNames(prototype)) {
        const handler = prototype[name];
        if (name === "constructor" || !Reflect.hasMetadata("path", handler)) continue;

        const isPublic = reflector.get(IS_PUBLIC_KEY, handler);
        const roles = reflector.get(ROLES_KEY, handler);
        if (!isPublic && !roles?.length && !SIGNED_IN_ONLY.has(name)) {
          unprotected.push(`${wrapper.name}.${name}`);
        }
      }
    }

    assert.deepEqual(unprotected, []);
  });
});

describe("public input validation", () => {
  it("refuses an order without required fields, before any lookup", async () => {
    const res = await call("POST", "/orders", { body: { customerName: "A" } });
    assert.equal(res.status, 400);
  });

  it("refuses payment methods that are not offered at checkout", async () => {
    const res = await call("POST", "/orders", {
      body: {
        customerName: "Test Customer",
        customerPhone: "01712345678",
        district: "Dhaka",
        area: "Dhanmondi",
        address: "House 1, Road 2",
        paymentMethod: "BANK_EMI",
        items: [{ productId: "x", qty: 1 }],
      },
    });
    assert.equal(res.status, 400);
  });

  it("order tracking needs a mobile number", async () => {
    assert.equal((await call("GET", "/orders/track/SOL-2026-AAAA")).status, 400);
  });

  it("the old endpoint that approved any TrxID is gone", async () => {
    assert.equal((await call("POST", "/bkash/verify-trx", { body: { trxId: "ABCD12345" } })).status, 404);
  });
});

describe("bKash without gateway credentials", () => {
  it("reports the gateway as off and refuses to start or complete a payment", async () => {
    const config = await (await call("GET", "/bkash/config")).json();
    assert.equal(config.data.gatewayEnabled, false);

    assert.equal((await call("POST", "/bkash/create", { body: { invoiceNo: "SOL-1" } })).status, 503);
    assert.equal((await call("POST", "/bkash/execute", { body: { paymentID: "fake" } })).status, 503);
  });
});

describe("CORS", () => {
  it("allows a configured origin and refuses others", async () => {
    const allowed = await call("GET", "/bkash/config", { origin: "http://localhost:3000" });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000");

    const refused = await call("GET", "/bkash/config", { origin: "https://evil.example" });
    assert.equal(refused.headers.get("access-control-allow-origin"), null);
  });
});

describe("rate limiting", () => {
  // Last, because it uses up this IP's allowance on the route.
  it("blocks repeated login attempts", async () => {
    const attempt = () => call("POST", "/auth/login", { body: { email: "not-an-email", password: "x" } });

    for (let i = 0; i < 10; i++) {
      assert.equal((await attempt()).status, 400);
    }

    const blocked = await attempt();
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers.get("retry-after"));
  });
});
