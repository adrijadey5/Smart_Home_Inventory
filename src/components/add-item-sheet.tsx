'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/types';
import { PREDEFINED_ITEMS } from '@/lib/data';
import { itemSchema } from '@/lib/validations';

type ItemFormValues = z.infer<typeof itemSchema>;

interface AddItemSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onEditItem: (item: InventoryItem) => void;
  itemToEdit?: InventoryItem;
}

export function AddItemSheet({ isOpen, setIsOpen, onAddItem, onEditItem, itemToEdit }: AddItemSheetProps) {
  const isEditMode = !!itemToEdit;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      customName: '',
      quantity: 1,
      lowStockThreshold: 5,
      isRecurring: false,
      barcode: '',
      expiryDate: undefined,
      recurringCycle: undefined,
    },
  });
  
  const watchedName = form.watch('name');
  const watchedIsRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (isOpen) {
        if (itemToEdit) {
            const predefined = PREDEFINED_ITEMS.find(p => p.label === itemToEdit.name);
            form.reset({
                name: predefined ? predefined.value : 'other',
                customName: predefined ? '' : itemToEdit.name,
                quantity: itemToEdit.quantity,
                expiryDate: itemToEdit.expiryDate,
                lowStockThreshold: itemToEdit.lowStockThreshold,
                isRecurring: itemToEdit.isRecurring,
                recurringCycle: itemToEdit.recurringCycle,
                barcode: itemToEdit.barcode,
            });
        } else {
            form.reset({
                name: '',
                customName: '',
                quantity: 1,
                lowStockThreshold: 5,
                isRecurring: false,
                barcode: '',
                expiryDate: undefined,
                recurringCycle: undefined,
            });
        }
    }
  }, [itemToEdit, isOpen, form]);
  
  const handlePredefinedChange = (value: string) => {
    form.setValue('name', value);
    if(value !== 'other') {
      const selected = PREDEFINED_ITEMS.find(p => p.value === value);
      if(selected) {
        form.setValue('barcode', selected.barcode || '');
        form.setValue('lowStockThreshold', selected.lowStockThreshold || 5);
      }
    }
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const barcode = e.target.value;
    form.setValue('barcode', barcode);
    const item = PREDEFINED_ITEMS.find(p => p.barcode === barcode);
    if(item) {
        form.setValue('name', item.value);
        form.setValue('lowStockThreshold', item.lowStockThreshold || 5);
    }
  }

  const adjustQuantity = (amount: number) => {
    const current = form.getValues('quantity');
    form.setValue('quantity', Math.max(0, current + amount));
  };
  
  function onSubmit(data: ItemFormValues) {
    const finalName = data.name === 'other' ? data.customName! : PREDEFINED_ITEMS.find(p => p.value === data.name)!.label;
    const submissionData: Omit<InventoryItem, 'id'> = { ...data, name: finalName };
    
    if (isEditMode) {
      onEditItem({ ...submissionData, id: itemToEdit.id });
    } else {
      onAddItem(submissionData);
    }
    setIsOpen(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit Item' : 'Add a New Item'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Update the details of your inventory item.' : 'Fill in the details to add a new item to your stock.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
             <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode (Simulated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 101 for Milk" {...field} onChange={handleBarcodeChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={handlePredefinedChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a common item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PREDEFINED_ITEMS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedName === 'other' && (
              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Almond Flour" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="outline" onClick={() => adjustQuantity(-1)} disabled={field.value <= 0}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <FormControl>
                      <Input type="number" className="text-center" {...field} />
                    </FormControl>
                     <Button type="button" size="icon" variant="outline" onClick={() => adjustQuantity(1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => form.setValue('quantity', 1)}>1 unit</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => form.setValue('quantity', 5)}>5 units</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => form.setValue('quantity', 10)}>10 units</Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Item</FormLabel>
                    <FormDescription>Mark if you buy this item regularly.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {watchedIsRecurring && (
              <FormField
                control={form.control}
                name="recurringCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <SheetFooter className="pt-6">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Item'}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
