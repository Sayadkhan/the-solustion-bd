import { z } from "zod";

export const SiteSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  logoLightUrl: z.string().default("/images/logo-light.png"),
  logoDarkUrl: z.string().default("/images/logo-dark.png"),
  contactEmail: z.string().email().default("support@thesolusationbd.com"),
  whatsappNumber: z.string().default("+8801700000000"),
  hotlineNumber: z.string().default("+8801700000000"),
  headerNoticeText: z
    .string()
    .default(
      "⚡ Special Flash Sale: Get instant cash discount on selected Intel 14th Gen & AMD Ryzen 9000 Processors!"
    ),
  usdToBdtRate: z.number().positive().default(122.5),
  updatedAt: z.date().or(z.string()).optional(),
});

export type SiteSettingsDTO = z.infer<typeof SiteSettingsSchema>;
