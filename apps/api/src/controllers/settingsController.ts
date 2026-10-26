import { Request, Response } from "express";
import { db, siteSettings, contactInquiries, desc, eq } from "@solusation/database";
import { normalizeBdPhone } from "@solusation/shared-types";
import { redis } from "../config/redis";
import { emailService } from "../services/emailService";

const SETTINGS_CACHE_KEY = "cache:settings:global";

export const getSiteSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Try Redis cache
    try {
      const cached = await redis.get(SETTINGS_CACHE_KEY);
      if (cached) {
        res.json({ success: true, source: "cache", data: JSON.parse(cached) });
        return;
      }
    } catch {
      // Degraded cache fallback
    }

    // 2. Fetch or create default from PostgreSQL via Drizzle
    let record = await db.query.siteSettings.findFirst();

    if (!record) {
      const [created] = await db
        .insert(siteSettings)
        .values({})
        .returning();
      record = created;
    }

    // 3. Cache in Redis for 1 hour
    try {
      await redis.set(SETTINGS_CACHE_KEY, JSON.stringify(record), "EX", 3600);
    } catch {
      // Continue
    }

    res.json({ success: true, source: "db", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateSiteSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await db.query.siteSettings.findFirst();
    let updated;

    if (existing) {
      const [res] = await db
        .update(siteSettings)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, existing.id))
        .returning();
      updated = res;
    } else {
      const [res] = await db
        .insert(siteSettings)
        .values(req.body)
        .returning();
      updated = res;
    }

    // Invalidate Redis cache
    try {
      await redis.del(SETTINGS_CACHE_KEY);
    } catch {
      // Continue
    }

    res.json({
      success: true,
      message: "Site settings updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const submitContactInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, message, companyName } = req.body;
    const normalizedPhone = normalizeBdPhone(phone) || phone;

    // 1. Log submission to PostgreSQL
    const [inquiry] = await db
      .insert(contactInquiries)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        subject: subject.trim(),
        message: message.trim(),
        companyName: companyName ? companyName.trim() : null,
        status: "PENDING",
      })
      .returning();

    // 2. Forward to configured Admin email via Nodemailer asynchronously
    emailService.sendContactInquiryNotification({
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      subject: inquiry.subject,
      message: inquiry.message,
      companyName: inquiry.companyName,
    }).catch((err) => {
      console.warn("[CONTACT INQUIRY EMAIL ERROR]:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Thank you for reaching out! Our team has received your message and will contact you shortly.",
      inquiryId: inquiry.id,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const getContactInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const l = parseInt(limit as string, 10);
    const p = parseInt(page as string, 10);

    const inquiries = await db.query.contactInquiries.findMany({
      orderBy: [desc(contactInquiries.createdAt)],
      limit: l,
      offset: (p - 1) * l,
    });

    res.json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
