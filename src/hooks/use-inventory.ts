'use client';

import { useState, useEffect } from 'react';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import type { InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useInventory(userId?: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();

  const inventoryCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'inventory_items');
  }, [firestore, userId]);
  
  const { data: collectionData, isLoading: isCollectionLoading } = useCollection<Omit<InventoryItem, 'id'>>(inventoryCollectionRef);

  useEffect(() => {
    if (collectionData) {
      const parsedData = collectionData.map(item => {
        const expiryDate = (item.expiryDate as any);
        return {
            ...item,
            id: item.id,
            // Firestore timestamp objects have to be converted to JS Date objects.
            // Firestore returns null for dates that were saved as null.
            expiryDate: expiryDate && expiryDate.seconds ? new Timestamp(expiryDate.seconds, expiryDate.nanoseconds).toDate() : undefined,
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      setInventory(parsedData);
    }
  }, [collectionData]);

  const handleAddItem = (item: Omit<InventoryItem, 'id'>) => {
    if (!inventoryCollectionRef) return;
    
    const dataToSave = {
      ...item,
      expiryDate: item.expiryDate || null,
    };
    
    addDocumentNonBlocking(inventoryCollectionRef, dataToSave);
    toast({ title: "Success", description: `${item.name} added to inventory.` });
  };

  const handleEditItem = (updatedItem: InventoryItem) => {
    if (!firestore || !userId) return;
    const itemRef = doc(firestore, 'users', userId, 'inventory_items', updatedItem.id);
    
    const dataToSave = {
      ...updatedItem,
      expiryDate: updatedItem.expiryDate || null,
    };
    delete (dataToSave as any).id; 
    
    updateDocumentNonBlocking(itemRef, dataToSave);
    toast({ title: "Success", description: `${updatedItem.name} has been updated.` });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!firestore || !userId) return;
    const itemName = inventory.find(i => i.id === itemId)?.name || 'Item';
    const itemRef = doc(firestore, 'users', userId, 'inventory_items', itemId);
    
    deleteDocumentNonBlocking(itemRef);
    toast({
        title: "Item Deleted",
        description: `${itemName} removed from inventory.`,
        variant: "destructive"
    });
  };

  return {
    inventory,
    isLoaded: !isCollectionLoading,
    handleAddItem,
    handleEditItem,
    handleDeleteItem
  };
}
