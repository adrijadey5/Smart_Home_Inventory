'use client';
import { useState, useEffect, useMemo } from 'react';
import { Home, Package, Plus, Bell } from 'lucide-react';
import { addDays, isBefore } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddItemSheet } from '@/components/add-item-sheet';
import { InventoryTable } from '@/components/inventory-table';
import { Dashboard } from '@/components/dashboard';
import type { InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory } from '@/hooks/use-inventory';
import { useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase/provider';

export default function HomeStockLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | undefined>(undefined);
  
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const {
    inventory,
    isLoaded,
    handleAddItem,
    handleEditItem,
    handleDeleteItem
  } = useInventory(user?.uid);


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

  if (!isLoaded || isUserLoading) {
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
