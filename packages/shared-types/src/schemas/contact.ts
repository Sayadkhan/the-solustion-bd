import { z } from "zod";
import { BD_PHONE_REGEX } from "../phone";
import { INQUIRY_STATUSES } from "../constants";

export const ContactInquirySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi phone number"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  companyName: z.string().optional().or(z.literal("")),
  status: z.enum(INQUIRY_STATUSES).default("PENDING"),
  createdAt: z.date().or(z.string()).optional(),
});
export type ContactInquiryDTO = z.infer<typeof ContactInquirySchema>;

export const CreateContactInquirySchema = ContactInquirySchema.omit({
  id: true,
  status: true,
  createdAt: true,
});
export type CreateContactInquiryInput = z.infer<typeof CreateContactInquirySchema>;
