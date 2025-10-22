'use client';
import { useState, useEffect, useMemo } from 'react';
import { Home, Package, Plus, Bell } from 'lucide-react';
import { addDays, isBefore, isSameDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddItemSheet } from '@/components/add-item-sheet';
import { InventoryTable } from '@/components/inventory-table';
import { Dashboard } from '@/components/dashboard';
import type { InventoryItem } from '@/lib/types';
import { DEFAULT_INVENTORY } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const STORAGE_KEY = 'homestock-inventory';
const LAST_CHECK_KEY = 'homestock-last-check';

export default function HomeStockLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | undefined>(undefined);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem(STORAGE_KEY);
      if (storedInventory) {
        const parsed = JSON.parse(storedInventory).map((item: any) => ({
          ...item,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        }));
        setInventory(parsed);
      } else {
        setInventory(DEFAULT_INVENTORY);
      }
    } catch (error) {
      console.error("Failed to load inventory from local storage", error);
      setInventory(DEFAULT_INVENTORY);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
      } catch (error) {
        console.error("Failed to save inventory to local storage", error);
      }
    }
  }, [inventory, isLoaded]);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    const lastCheckStr = localStorage.getItem(LAST_CHECK_KEY);
    const today = new Date();
    const lastCheck = lastCheckStr ? new Date(lastCheckStr) : null;
    
    if (!lastCheck || !isSameDay(today, lastCheck)) {
      const recurringItems = inventory.filter(i => i.isRecurring);
      if (recurringItems.length > 0) {
        toast({
          title: "Recurring Items Reminder",
          description: `Remember to check stock for: ${recurringItems.map(i => i.name).slice(0,3).join(', ')}.`,
        });
      }
      localStorage.setItem(LAST_CHECK_KEY, today.toISOString());
    }
  }, [isLoaded, inventory, toast]);

  const handleAddItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    setInventory(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: "Success", description: `${newItem.name} added to inventory.` });
  };

  const handleEditItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: "Success", description: `${updatedItem.name} has been updated.` });
  };
  
  const handleDeleteItem = (itemId: string) => {
    const itemName = inventory.find(i => i.id === itemId)?.name || 'Item';
    setInventory(prev => prev.filter(item => item.id !== itemId));
    toast({
        title: "Item Deleted",
        description: `${itemName} removed from inventory.`,
        variant: "destructive"
    });
  };

  const openEditSheet = (item: InventoryItem) => {
    setItemToEdit(item);
    setSheetOpen(true);
  };
  
  const openAddSheet = () => {
    setItemToEdit(undefined);
    setSheetOpen(true);
  };
  
  const { lowStockItems, expiringSoonItems } = useMemo(() => {
    if (!isLoaded) return { lowStockItems: [], expiringSoonItems: [] };
    const lowStock = inventory.filter(item => item.quantity <= item.lowStockThreshold);
    const soonDate = addDays(new Date(), 7);
    const expiringSoon = inventory.filter(item => 
      item.expiryDate && isBefore(item.expiryDate, soonDate)
    );
    return { lowStockItems: lowStock, expiringSoonItems: expiringSoon };
  }, [inventory, isLoaded]);

  const totalAlerts = useMemo(() => lowStockItems.length + expiringSoonItems.length, [lowStockItems, expiringSoonItems]);

  if (!isLoaded) {
    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-10 w-28" />
            </header>
            <Skeleton className="h-10 w-full md:w-[400px]" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }
  
  return (
    <div className="p-4 md:p-8">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">HomeStock</h1>
        </div>
        <Button onClick={openAddSheet}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </header>
      
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="inventory">
            <Home className="mr-2 h-4 w-4"/>
            Full Inventory
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <Bell className="mr-2 h-4 w-4"/>
            Dashboard
            {totalAlerts > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                {totalAlerts}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inventory" className="mt-6">
          <InventoryTable 
            data={inventory}
            onEdit={openEditSheet}
            onDelete={handleDeleteItem}
          />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-6">
          <Dashboard 
            lowStockItems={lowStockItems}
            expiringSoonItems={expiringSoonItems}
            onEdit={openEditSheet}
          />
        </TabsContent>
      </Tabs>

      <AddItemSheet
        isOpen={sheetOpen}
        setIsOpen={setSheetOpen}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}
