import type { PredefinedItem, InventoryItem } from '@/lib/types';

export const PREDEFINED_ITEMS: PredefinedItem[] = [
  { value: 'milk', label: 'Milk', barcode: '101', lowStockThreshold: 2 },
  { value: 'eggs', label: 'Eggs', barcode: '102', lowStockThreshold: 6 },
  { value: 'bread', label: 'Bread', barcode: '103', lowStockThreshold: 1 },
  { value: 'butter', label: 'Butter', barcode: '104', lowStockThreshold: 1 },
  { value: 'cheese', label: 'Cheese', barcode: '105' },
  { value: 'sugar', label: 'Sugar', barcode: '201' },
  { value: 'flour', label: 'Flour', barcode: '202' },
  { value: 'coffee', label: 'Coffee', barcode: '203' },
  { value: 'tea', label: 'Tea', barcode: '204' },
  { value: 'toothpaste', label: 'Toothpaste', barcode: '301', lowStockThreshold: 1 },
  { value: 'soap', label: 'Soap', barcode: '302', lowStockThreshold: 1 },
  { value: 'shampoo', label: 'Shampoo', barcode: '303', lowStockThreshold: 1 },
  { value: 'other', label: 'Other...' },
];

export const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Milk',
    quantity: 1,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 2)), // Near expiry
    lowStockThreshold: 2, // Low stock
    isRecurring: true,
    recurringCycle: 'weekly',
    barcode: '101',
  },
  {
    id: '2',
    name: 'Eggs',
    quantity: 12,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    lowStockThreshold: 6,
    isRecurring: false,
    barcode: '102',
  },
  {
    id: '3',
    name: 'Bread',
    quantity: 1,
    expiryDate: new Date(new Date().setDate(new Date().getDate() - 1)), // Expired
    lowStockThreshold: 1,
    isRecurring: true,
    recurringCycle: 'weekly',
    barcode: '103',
  },
];
