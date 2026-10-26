import { z } from "zod";

export const SiteSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  logoLightUrl: z.string().default("/logo.png"),
  logoDarkUrl: z.string().default("/logo.png"),
  contactEmail: z.string().default("thesolutionsbd@gmail.com"),
  whatsappNumber: z.string().default("01922-730343"),
  hotlineNumber: z.string().default("01711-319090"),
  secondaryPhone: z.string().default("01711-319090").optional(),
  landlinePhone: z.string().default("9183295").optional(),
  ceoName: z.string().default("Md. Raihan Kabir").optional(),
  ceoDesignation: z.string().default("CEO, BSC. Eng (Hons.) in CSE").optional(),
  ceoPhone: z.string().default("01922-730343").optional(),
  gulshanAddress: z
    .string()
    .default("House- NWH- 12, Road- 53, Circle- 2, Gulshan Avenue, Dhaka- 1212")
    .optional(),
  idbAddress: z
    .string()
    .default("SR- 140, BCS Computer City, IDB Bhaban (1st Floor), Agargaon, Dhaka- 1207")
    .optional(),
  websiteUrl: z.string().default("https://thesolutionsbd.com").optional(),
  headerNoticeText: z
    .string()
    .default(
      "⚡ Special Flash Sale: Get instant cash discount on selected Intel 14th Gen & AMD Ryzen 9000 Processors!"
    ),
  usdToBdtRate: z.number().positive().default(122.5),
  updatedAt: z.date().or(z.string()).optional(),
});

export type SiteSettingsDTO = z.infer<typeof SiteSettingsSchema>;
