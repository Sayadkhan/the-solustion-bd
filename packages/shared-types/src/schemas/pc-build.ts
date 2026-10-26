import { z } from "zod";

export const SavedPcBuildSchema = z.object({
  id: z.string().uuid().optional(),
  shortCode: z.string().min(3),
  userId: z.string().uuid().nullable().optional(),
  isSimulatorBuild: z.boolean().default(false),
  components: z.record(z.string(), z.string()),
  totalWattage: z.number().int().nonnegative().default(0),
  totalCashPriceBdt: z.number().int().nonnegative().default(0),
  unlockedPromoCode: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
});

export type SavedPcBuildDTO = z.infer<typeof SavedPcBuildSchema>;

export const CreateSavedPcBuildSchema = SavedPcBuildSchema.omit({
  id: true,
  createdAt: true,
});
export type CreateSavedPcBuildDTO = z.infer<typeof CreateSavedPcBuildSchema>;
