import { BadRequestException, Injectable } from "@nestjs/common";
import { db, siteSettings, contactInquiries, desc, eq } from "@solusation/database";
import { normalizeBdPhone, UserRole } from "@solusation/shared-types";
import { redis } from "../../config/redis";
import { emailService } from "../../services/emailService";

const SETTINGS_CACHE_KEY = "cache:settings:global";

const SEO_FIELDS = [
  "gtmId",
  "gaMeasurementId",
  "googleSearchConsoleCode",
  "facebookPixelId",
  "defaultMetaTitle",
  "defaultMetaDescription",
  "defaultMetaKeywords",
  "robotsTxt",
] as const;

const BUSINESS_FIELDS = [
  "logoLightUrl",
  "logoDarkUrl",
  "contactEmail",
  "whatsappNumber",
  "hotlineNumber",
  "secondaryPhone",
  "landlinePhone",
  "ceoName",
  "ceoDesignation",
  "ceoPhone",
  "gulshanAddress",
  "idbAddress",
  "websiteUrl",
  "headerNoticeText",
  "usdToBdtRate",
] as const;

// Raw scripts run on every storefront page, so only full admins may set them.
const ADMIN_ONLY_FIELDS = ["customHeadScript", "customBodyScript"] as const;

// These values are placed inside inline scripts on the storefront.
const TRACKING_ID_FORMATS: Record<string, RegExp> = {
  gtmId: /^GTM-[A-Z0-9]+$/,
  gaMeasurementId: /^(G|UA)-[A-Z0-9-]+$/,
  facebookPixelId: /^[0-9]+$/,
};

@Injectable()
export class SettingsService {
  async getSiteSettings() {
    try {
      const cached = await redis.get(SETTINGS_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Continue
    }

    let record = await db.query.siteSettings.findFirst();
    if (!record) {
      const [created] = await db.insert(siteSettings).values({}).returning();
      record = created;
    }

    try {
      await redis.set(SETTINGS_CACHE_KEY, JSON.stringify(record), "EX", 3600);
    } catch {
      // Continue
    }

    return record;
  }

  async updateSiteSettings(data: Record<string, unknown>, role: UserRole) {
    const isFullAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    const allowedFields: readonly string[] = isFullAdmin
      ? [...SEO_FIELDS, ...BUSINESS_FIELDS, ...ADMIN_ONLY_FIELDS]
      : SEO_FIELDS;

    const allowedData = Object.fromEntries(
      Object.entries(data || {}).filter(([key]) => allowedFields.includes(key))
    );

    for (const [field, format] of Object.entries(TRACKING_ID_FORMATS)) {
      const value = allowedData[field];
      if (value && (typeof value !== "string" || !format.test(value))) {
        throw new BadRequestException(`Invalid format for ${field}.`);
      }
    }

    const existing = await db.query.siteSettings.findFirst();
    let updated;

    if (existing) {
      const [res] = await db
        .update(siteSettings)
        .set({ ...allowedData, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
      updated = res;
    } else {
      const [res] = await db.insert(siteSettings).values(allowedData).returning();
      updated = res;
    }

    try {
      await redis.del(SETTINGS_CACHE_KEY);
    } catch {
      // Continue
    }

    return updated;
  }

  async submitContactInquiry(data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    companyName?: string;
  }) {
    const normalizedPhone = normalizeBdPhone(data.phone) || data.phone;

    const [inquiry] = await db
      .insert(contactInquiries)
      .values({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: normalizedPhone,
        subject: data.subject.trim(),
        message: data.message.trim(),
        companyName: data.companyName ? data.companyName.trim() : null,
        status: "PENDING",
      })
      .returning();

    // Notify admin
    emailService
      .sendContactInquiryNotification({
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        subject: inquiry.subject,
        message: inquiry.message,
        companyName: inquiry.companyName,
      })
      .catch((err) => {
        console.warn("[CONTACT INQUIRY EMAIL ERROR]:", err.message);
      });

    return inquiry;
  }

  async getContactInquiries(limit = 20, page = 1) {
    return db.query.contactInquiries.findMany({
      orderBy: [desc(contactInquiries.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });
  }

  async updateInquiryStatus(id: string, status: "PENDING" | "CONTACTED" | "RESOLVED") {
    const [updated] = await db
      .update(contactInquiries)
      .set({ status })
      .where(eq(contactInquiries.id, id))
      .returning();
    return updated;
  }
}

