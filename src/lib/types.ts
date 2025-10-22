import type { z } from 'zod';
import type { itemSchema } from './validations';

export type InventoryItem = z.infer<typeof itemSchema> & { id: string };

export type PredefinedItem = {
  value: string;
  label: string;
  barcode?: string;
  lowStockThreshold?: number;
};

export type InventoryItemHistory = {
  id: string;
  changeType: 'created' | 'updated' | 'deleted';
  changedFields?: string[];
  oldData?: Partial<InventoryItem>;
  newData?: Partial<InventoryItem>;
  timestamp: Date;
};
