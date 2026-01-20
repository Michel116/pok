
'use client';

import { useState, useMemo } from 'react';
import { ShippedRentalView } from './components/shipped-rental-view';
import { RentalStockView } from './components/rental-stock-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PackagePlus, Search } from 'lucide-react';
import { useTerminals } from '@/context/terminals-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AddTerminalDialog } from '@/components/shared/add-terminal-dialog';
import type { BoxType } from '@/lib/types';

export default function RentalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { terminals, shelfSections, addTerminal } = useTerminals();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const isRental = (serialNumber: string) => serialNumber.startsWith('1792');

  const rentalTerminals = useMemo(() => {
    return terminals.filter(t => isRental(t.serialNumber));
  }, [terminals]);

  const rentedOutTerminals = useMemo(() => {
    return rentalTerminals.filter(t => t.status === 'rented');
  }, [rentalTerminals]);
  
  const rentalStockTerminals = useMemo(() => {
    return rentalTerminals.filter(t => t.status !== 'rented');
  }, [rentalTerminals]);

  const rentalShelfSections = useMemo(() => {
    const rentalSections = shelfSections.filter(s => s.tier === 'Аренда');
    
    const sectionsMap = new Map(rentalSections.map(s => [s.id, {...s, terminals: [] as any[]}]));

    rentalStockTerminals.forEach(t => {
      if (t.location) {
        const section = sectionsMap.get(t.location.sectionId);
        if (section) {
          section.terminals.push(t);
        }
      }
    });

    return Array.from(sectionsMap.values());
  }, [rentalStockTerminals, shelfSections]);

  const unplacedRentalTerminals = useMemo(() => {
    return rentalStockTerminals.filter(t => !t.location);
  }, [rentalStockTerminals]);
  
  const handleAddTerminal = (serialNumber: string, boxType: BoxType, sectionId?: string): boolean => {
    return addTerminal(serialNumber, boxType, sectionId);
  };
  
  const filteredRentedOut = rentedOutTerminals.filter(t => t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));
  const stockHasResults = rentalShelfSections.some(s => s.terminals.some(t => t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))) || unplacedRentalTerminals.some(t => t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

  const noResults = searchQuery && !stockHasResults && filteredRentedOut.length === 0;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Терминалы в аренде</h1>
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow w-full sm:w-auto md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по S/N..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
             <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                <PackagePlus className="mr-2 h-4 w-4"/>
                Добавить арендный терминал
            </Button>
        </div>
      </div>
      
      <RentalStockView
        sections={rentalShelfSections}
        unplacedTerminals={unplacedRentalTerminals}
        searchQuery={searchQuery}
        filter={'all'}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Отгружено</CardTitle>
        </CardHeader>
        <CardContent>
          <ShippedRentalView 
            terminals={rentedOutTerminals}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>
      
       {noResults && (
          <Card className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Терминалы с такими параметрами не найдены.</p>
          </Card>
      )}

      <AddTerminalDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTerminal={handleAddTerminal}
        dialogType="rental"
      />
    </div>
  );
}
