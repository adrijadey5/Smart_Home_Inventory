'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Repeat } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { InventoryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isBefore, isPast } from 'date-fns';

interface InventoryTableProps {
  data: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ data, onEdit, onDelete }: InventoryTableProps) {
    
  const getRowStyle = (item: InventoryItem) => {
    if (item.expiryDate && isPast(item.expiryDate)) {
      return 'bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground';
    }
    if (item.quantity <= item.lowStockThreshold || (item.expiryDate && isBefore(item.expiryDate, new Date(new Date().setDate(new Date().getDate() + 3))))) {
        return 'bg-accent/20 hover:bg-accent/30';
    }
    return '';
  };

  const renderExpiry = (date?: Date) => {
    if (!date) return <span className="text-muted-foreground">N/A</span>;
    if (isPast(date)) return <Badge variant="destructive">Expired</Badge>;
    return `in ${formatDistanceToNow(date, { addSuffix: false })}`;
  };
  
  if (data.length === 0) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium">Your inventory is empty!</h3>
            <p className="text-muted-foreground mt-2">Click "Add Item" to get started.</p>
        </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] md:w-[250px]">Item</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className={cn(getRowStyle(item))}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    {item.name}
                    {item.isRecurring && <Repeat className="h-3 w-3 text-muted-foreground" title={`Recurring ${item.recurringCycle}`}/>}
                </div>
              </TableCell>
              <TableCell>
                {item.quantity <= item.lowStockThreshold && (
                  <Badge variant="outline" className="border-accent text-accent">Low Stock</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell>{renderExpiry(item.expiryDate)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="focus:bg-destructive/80 focus:text-destructive-foreground text-destructive" onClick={() => onDelete(item.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
