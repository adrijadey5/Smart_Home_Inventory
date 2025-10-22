import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  customName: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Quantity must be a non-negative number.'),
  expiryDate: z.date().optional(),
  lowStockThreshold: z.coerce.number().min(0, 'Threshold must be a non-negative number.').default(5),
  isRecurring: z.boolean().default(false),
  recurringCycle: z.enum(['daily', 'weekly', 'monthly']).optional(),
  barcode: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.name === 'other' && (!data.customName || data.customName.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Custom item name is required when "Other" is selected.',
            path: ['customName'],
        });
    }
    if (data.isRecurring && !data.recurringCycle) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Recurring cycle is required for recurring items.',
            path: ['recurringCycle'],
        });
    }
});
