import type { z } from 'zod';
import type { itemSchema } from './validations';

export type InventoryItem = z.infer<typeof itemSchema> & { id: string };

export type PredefinedItem = {
  value: string;
  label: string;
  barcode?: string;
  lowStockThreshold?: number;
};
