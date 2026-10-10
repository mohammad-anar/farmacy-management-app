import { z } from 'zod';

export const medicineFormSchema = z.object({
  // === 3 MANDATORY FIELDS ===
  name: z.string().min(1, 'Medicine name is required').trim(),
  sellingPrice: z
    .string()
    .min(1, 'Selling price is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Selling price must be a valid non-negative number',
    }),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Quantity must be a valid non-negative number',
    }),

  // === OPTIONAL FIELDS ===
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  manufacturer: z.string().optional(),
  strength: z.string().optional(),
  dosageForm: z.string().optional(),
  category: z.string().optional(),
  barcode: z.string().optional(),
  purchasePrice: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: 'Purchase price must be a valid non-negative number',
    }),
  minimumStock: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: 'Minimum stock must be a valid non-negative number',
    }),
  rackLocation: z.string().optional(),
  supplierName: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  onlinePurchaseUrl: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'Must be a valid web URL starting with http:// or https://',
    }),
});

export type MedicineFormData = z.infer<typeof medicineFormSchema>;
