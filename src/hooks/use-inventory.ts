'use client';

import { useState, useEffect } from 'react';
import { collection, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { useCollection, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import type { InventoryItem, InventoryItemHistory } from '@/lib/types';
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
    if (!firestore || !userId) return;

    try {
        const batch = writeBatch(firestore);
        
        const newItemRef = doc(inventoryCollectionRef!);
        
        const dataToSave = {
          ...item,
          expiryDate: item.expiryDate || null,
          recurringCycle: item.recurringCycle || null,
        };
        batch.set(newItemRef, dataToSave);

        const historyRef = doc(collection(firestore, 'users', userId, 'inventory_items', newItemRef.id, 'history'));
        const historyEntry: Omit<InventoryItemHistory, 'id' | 'timestamp'> = {
            changeType: 'created',
            changedFields: Object.keys(dataToSave),
            newData: dataToSave,
        };
        batch.set(historyRef, historyEntry);

        batch.commit();
        toast({ title: "Success", description: `${item.name} added to inventory.` });
    } catch (error) {
        console.error("Error adding item with history:", error);
        toast({ title: "Error", description: "Could not add item.", variant: "destructive" });
    }
  };

  const handleEditItem = (updatedItem: InventoryItem) => {
    if (!firestore || !userId) return;

    const originalItem = inventory.find(i => i.id === updatedItem.id);
    if (!originalItem) return;

    try {
        const batch = writeBatch(firestore);
        const itemRef = doc(firestore, 'users', userId, 'inventory_items', updatedItem.id);
        
        const dataToSave = {
        ...updatedItem,
        expiryDate: updatedItem.expiryDate || null,
        recurringCycle: updatedItem.recurringCycle || null,
        };
        delete (dataToSave as any).id;
        
        batch.update(itemRef, dataToSave);

        const historyRef = doc(collection(firestore, 'users', userId, 'inventory_items', updatedItem.id, 'history'));
        const changedFields: string[] = [];
        const oldData: Partial<InventoryItem> = {};
        const newData: Partial<InventoryItem> = {};

        for (const key in dataToSave) {
            if (dataToSave.hasOwnProperty(key)) {
                const typedKey = key as keyof typeof dataToSave;
                if (JSON.stringify(originalItem[typedKey]) !== JSON.stringify(dataToSave[typedKey])) {
                    changedFields.push(key);
                    (oldData as any)[typedKey] = originalItem[typedKey];
                    (newData as any)[typedKey] = dataToSave[typedKey];
                }
            }
        }
        
        if (changedFields.length > 0) {
            const historyEntry: Omit<InventoryItemHistory, 'id' | 'timestamp'> = {
                changeType: 'updated',
                changedFields,
                oldData,
                newData,
            };
            batch.set(historyRef, historyEntry);
        }

        batch.commit();
        toast({ title: "Success", description: `${updatedItem.name} has been updated.` });
    } catch (error) {
        console.error("Error updating item with history:", error);
        toast({ title: "Error", description: "Could not update item.", variant: "destructive" });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!firestore || !userId) return;
    const itemToDelete = inventory.find(i => i.id === itemId);
    if (!itemToDelete) return;

    try {
        const batch = writeBatch(firestore);
        const itemRef = doc(firestore, 'users', userId, 'inventory_items', itemId);
        
        batch.delete(itemRef);

        const historyRef = doc(collection(firestore, 'users', userId, 'inventory_items', itemId, 'history'));
        const historyEntry: Omit<InventoryItemHistory, 'id' | 'timestamp'> = {
            changeType: 'deleted',
            oldData: itemToDelete,
        };
        batch.set(historyRef, historyEntry);
        
        batch.commit();

        toast({
            title: "Item Deleted",
            description: `${itemToDelete.name} removed from inventory.`,
            variant: "destructive"
        });
    } catch (error) {
        console.error("Error deleting item with history:", error);
        toast({ title: "Error", description: "Could not delete item.", variant: "destructive" });
    }
  };

  return {
    inventory,
    isLoaded: !isCollectionLoading,
    handleAddItem,
    handleEditItem,
    handleDeleteItem
  };
}
