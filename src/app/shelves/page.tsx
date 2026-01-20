
'use client';

import { useState } from 'react';
import { ShelfView } from './components/shelf-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PackagePlus, Search } from 'lucide-react';
import type { TerminalStatus, BoxType } from '@/lib/types';
import { Filters } from './components/filters';
import { useTerminals } from '@/context/terminals-context';
import { useUser } from '@/context/user-context';
import { AddTerminalDialog } from '@/components/shared/add-terminal-dialog';

export default function ShelvesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<TerminalStatus | 'all'>('all');
  const { shelfSections, terminals, addTerminal } = useTerminals();
  const { user } = useUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const canAdd = user?.role === 'Administrator' || user?.role === 'Verifier' || user?.role === 'User';

  const regularTerminals = terminals.filter(t => !t.serialNumber.startsWith('1792'));

  const unplacedTerminals = regularTerminals.filter(t => !t.location && t.status !== 'shipped' && t.status !== 'awaits_verification_after_shipping' && t.status !== 'rented');
  
  const regularShelfSections = shelfSections.filter(s => s.tier !== 'Аренда');

  const handleAddTerminal = (serialNumber: string, boxType: BoxType, sectionId?: string): boolean => {
    return addTerminal(serialNumber, boxType, sectionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Стеллажи на складе</h1>
        </div>
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
          {canAdd && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <PackagePlus className="mr-2 h-4 w-4"/>
              Добавить терминал
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] gap-6">
        <div className="order-2 lg:order-1">
          <ShelfView 
            sections={regularShelfSections} 
            unplacedTerminals={unplacedTerminals}
            searchQuery={searchQuery} 
            filter={filter} 
          />
        </div>
        <div className="order-1 lg:order-2">
           <Filters onFilterChange={setFilter} />
        </div>
      </div>
      {canAdd && (
        <AddTerminalDialog 
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddTerminal={handleAddTerminal}
          dialogType="regular"
        />
      )}
    </div>
  );
}
