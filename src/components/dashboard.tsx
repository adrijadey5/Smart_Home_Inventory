'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Edit } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';
import { formatDistanceToNow, isPast } from 'date-fns';

interface DashboardProps {
  lowStockItems: InventoryItem[];
  expiringSoonItems: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
}

const ItemListCard = ({ title, description, icon, items, onEdit, emptyText }: { title: string, description: string, icon: React.ReactNode, items: InventoryItem[], onEdit: (item: InventoryItem) => void, emptyText: string }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            {items.length > 0 && <span className="font-bold text-2xl text-accent">{items.length}</span>}
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
            <ul className="space-y-3">
            {items.map(item => (
                <li key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50">
                <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {title === 'Low Stock' 
                            ? `Qty: ${item.quantity} (Threshold: ${item.lowStockThreshold})`
                            : item.expiryDate ? (isPast(item.expiryDate) ? <span className="text-destructive font-semibold">Expired</span> : `Expires in ${formatDistanceToNow(item.expiryDate, { addSuffix: false })}`) : ''
                        }
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Item</span>
                </Button>
                </li>
            ))}
            </ul>
        ) : (
            <p className="text-muted-foreground text-sm">{emptyText}</p>
        )}
      </CardContent>
    </Card>
);

export function Dashboard({ lowStockItems, expiringSoonItems, onEdit }: DashboardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
        <ItemListCard 
            title="Low Stock"
            description="Items that are running low and need restocking."
            icon={<AlertTriangle className="h-5 w-5 text-accent" />}
            items={lowStockItems}
            onEdit={onEdit}
            emptyText="No items are running low. Great job!"
        />
        <ItemListCard 
            title="Expiring Soon"
            description="Items that are nearing their expiration date."
            icon={<Clock className="h-5 w-5 text-accent" />}
            items={expiringSoonItems}
            onEdit={onEdit}
            emptyText="No items are expiring soon. All fresh!"
        />
    </div>
  );
}
