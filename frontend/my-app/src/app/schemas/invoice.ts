import { z } from "zod";
import { fileSchema } from "@/app/schemas/file";

// All the basic fields are optional.
const baseInvoiceSchema = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  amount: z.number().optional(),
  isPaid: z.boolean().optional(),
  isReviewed: z.boolean().optional(),
});

export const createInvoiceSchema = baseInvoiceSchema.extend({
  invoice: fileSchema,
});

export const editInvoiceSchema = baseInvoiceSchema;

export type BaseInvoiceFormData = z.infer<typeof baseInvoiceSchema>;
export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>;
