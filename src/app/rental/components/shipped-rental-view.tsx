'use client';

import type { Terminal, TerminalStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { RentalTerminalDetailsSheet } from './rental-terminal-details-sheet';
import { Card } from '@/components/ui/card';
import { ArrowRightLeft } from 'lucide-react';

type ShippedRentalViewProps = {
  terminals: Terminal[];
  searchQuery: string;
};

const statusConfig: { [key in 'rented']: { bg: string; text: string; muted: string; } } = {
  rented: {
    bg: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50',
    text: 'text-blue-900 dark:text-blue-100',
    muted: 'text-blue-800/80 dark:text-blue-200/80',
  },
};


const TerminalCell = ({ terminal, onClick, isHighlighted }: { terminal: Terminal; onClick: (t: Terminal) => void; isHighlighted: boolean; }) => {
  const config = statusConfig.rented;

  const getStatusText = (terminal: Terminal) => {
    const historyEvent = terminal.history.find(h => h.event.includes('аренду'));
    if (!historyEvent) return 'В аренде';
    return historyEvent.event.split(':')[1]?.trim() || 'В аренде';
  }

  return (
    <button
      onClick={() => onClick(terminal)}
      className={cn(
        'relative aspect-[2/1] flex flex-col items-center justify-center rounded-md border p-1 text-center text-[9px] md:text-xs transition-all duration-300',
        config.bg,
        isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <span className={cn('font-bold', config.text)}>{terminal.serialNumber}</span>
      <span className={cn('hidden md:inline', config.muted)}>{getStatusText(terminal)}</span>
    </button>
  );
};


export function ShippedRentalView({ terminals, searchQuery }: ShippedRentalViewProps) {
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  const handleTerminalClick = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedTerminal(null);
    }
  };
  
  const filteredTerminals = terminals.filter(t => t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

  if (filteredTerminals.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Нет терминалов в аренде</h3>
            <p className="text-muted-foreground">Здесь будут отображаться терминалы, переданные в аренду.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredTerminals.map(terminal => {
          const isHighlighted = searchQuery.length > 0 && terminal.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
          return (
            <TerminalCell key={terminal.serialNumber} terminal={terminal} onClick={handleTerminalClick} isHighlighted={isHighlighted} />
          )
        })}
      </div>

      <RentalTerminalDetailsSheet
        terminal={selectedTerminal}
        isOpen={!!selectedTerminal}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
