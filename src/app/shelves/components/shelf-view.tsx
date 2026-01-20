
'use client';

import type { ShelfSection, Terminal, BoxType, TerminalStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TerminalDetailsSheet } from './terminal-details-sheet';
import { Ban } from 'lucide-react';

type ShelfViewProps = {
  sections: ShelfSection[];
  unplacedTerminals: Terminal[];
  searchQuery: string;
  filter: TerminalStatus | 'all';
};

const statusConfig: { [key in 'verified' | 'pending' | 'not_verified' | 'expired']: { bg: string; text: string; muted: string; } } = {
  verified: {
    bg: 'bg-verified/20 hover:bg-verified/30 border-verified/50',
    text: 'text-green-900 dark:text-green-100',
    muted: 'text-green-800/80 dark:text-green-200/80',
  },
  pending: {
    bg: 'bg-pending/20 hover:bg-pending/30 border-pending/50',
    text: 'text-yellow-900 dark:text-yellow-100',
    muted: 'text-yellow-800/80 dark:text-yellow-200/80',
  },
  not_verified: {
    bg: 'bg-destructive/20 hover:bg-destructive/30 border-destructive/50',
    text: 'text-red-900 dark:text-red-100',
    muted: 'text-red-800/80 dark:text-red-200/80',
  },
  expired: {
    bg: 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/50',
    text: 'text-indigo-900 dark:text-indigo-100',
    muted: 'text-indigo-800/80 dark:text-indigo-200/80',
  },
};


const TerminalCell = ({ terminal, onClick, isHighlighted }: { terminal: Terminal; onClick: (t: Terminal) => void; isHighlighted: boolean; }) => {
  const statusKey = terminal.status as keyof typeof statusConfig;
  const config = statusConfig[statusKey];

  if (!config) {
    return null;
  }
  
  const getStatusText = (terminal: Terminal) => {
    switch (terminal.status) {
      case 'verified':
        if (!terminal.verifiedUntil) return 'Поверен';
        return `до ${new Date(terminal.verifiedUntil).toLocaleDateString('ru-RU')}`;
      case 'pending':
        return 'Ожидание';
      case 'not_verified':
        return 'Не поверен';
      case 'expired':
        return 'Просрочен';
      default:
        return '';
    }
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

const EmptyCell = () => (
  <div className={cn('aspect-[2/1] rounded-md bg-muted/50 border border-dashed flex items-center justify-center')}>
     <Ban className="h-4 w-4 text-muted-foreground/50"/>
  </div>
);

const SectionGrid = ({ section, onTerminalClick, searchQuery, filter }: { section: ShelfSection; onTerminalClick: (t: Terminal) => void; searchQuery: string; filter: TerminalStatus | 'all' }) => {
    const boxType = section.currentBoxType;
    if (!boxType) {
        return (
            <div className="grid grid-cols-5 grid-rows-2 gap-1 p-1">
                {Array.from({ length: 10 }).map((_, i) => (
                    <EmptyCell key={i} />
                ))}
            </div>
        );
    }
    
    const { rows, cols } = section.capacity[boxType];
    const totalCells = rows * cols;
    
    const isFiltered = searchQuery.length > 0 || filter !== 'all';

    const cells = Array.from({ length: totalCells }).map((_, i) => {
        const terminal = section.terminals.find((t) => t.position === i);
        
        if (terminal) {
            const searchMatch = terminal.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const filterMatch = filter === 'all' || terminal.status === filter;
            const notShipped = terminal.status !== 'shipped' && terminal.status !== 'awaits_verification_after_shipping' && terminal.status !== 'rented';
            
            if (searchMatch && filterMatch && notShipped) {
                const isHighlighted = searchQuery.length > 0 && searchMatch;
                return (
                    <TerminalCell key={terminal.serialNumber} terminal={terminal} onClick={onTerminalClick} isHighlighted={isHighlighted} />
                );
            }
        }
        
        // If filtering/searching and no terminal matches, show empty cell
        return <EmptyCell key={`empty-${i}`} />;
    });

    const hasVisibleTerminals = cells.some(cell => cell.type !== EmptyCell);

    if (isFiltered && !hasVisibleTerminals) {
       return null;
    }

    return (
        <div
            className="grid gap-1 p-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
            {cells}
        </div>
    );
};


export function ShelfView({ sections, unplacedTerminals, searchQuery, filter }: ShelfViewProps) {
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  const handleTerminalClick = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedTerminal(null);
    }
  };
  
  const isFiltered = searchQuery.length > 0 || filter !== 'all';

  let hasAnyResults = false;
  
  const upperTierSections = sections.filter((s) => s.tier === 'Верхний');
  const lowerTierSections = sections.filter((s) => s.tier === 'Нижний');

  const renderedTiers = [
    { title: 'Верхний стеллаж', sections: upperTierSections },
    { title: 'Нижний стеллаж', sections: lowerTierSections }
  ].map(tier => {
      const renderedSections = tier.sections.map(section => {
        const sectionHasContent = section.terminals.some(t => {
            const searchMatch = t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const filterMatch = filter === 'all' || t.status === filter;
            return searchMatch && filterMatch && t.status !== 'shipped' && t.status !== 'awaits_verification_after_shipping' && t.status !== 'rented';
        }) || (!isFiltered);
        
        if (isFiltered && !sectionHasContent) {
            return null;
        }
        
        hasAnyResults = hasAnyResults || sectionHasContent;
        
        return (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="p-2 pb-0"><CardTitle className="text-sm text-center font-medium text-muted-foreground">{section.id}</CardTitle></CardHeader>
            <CardContent className="p-2">
                <SectionGrid section={section} onTerminalClick={handleTerminalClick} searchQuery={searchQuery} filter={filter} />
            </CardContent>
          </Card>
        );
      }).filter(Boolean);

      if (renderedSections.length === 0) return null;

      return (
        <Card key={tier.title}>
            <CardHeader><CardTitle>{tier.title}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderedSections}
            </CardContent>
        </Card>
      );
  }).filter(Boolean);
  
  if (isFiltered && renderedTiers.length === 0) {
      hasAnyResults = false;
  } else if (!isFiltered) {
      hasAnyResults = true;
  }

  const filteredUnplaced = unplacedTerminals.filter(t => {
    const searchMatch = t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const filterMatch = filter === 'all' || t.status === filter;
    return searchMatch && filterMatch;
  });

  const unplacedSection = (
    <Card>
      <CardHeader>
        <CardTitle>Не размещено</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredUnplaced.map(terminal => {
          const isHighlighted = searchQuery.length > 0 && terminal.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
          return (
            <TerminalCell key={terminal.serialNumber} terminal={terminal} onClick={handleTerminalClick} isHighlighted={isHighlighted} />
          )
        })}
      </CardContent>
    </Card>
  );

  if (filteredUnplaced.length > 0) {
    hasAnyResults = true;
  }


  return (
    <div className="space-y-6">
      {renderedTiers.length > 0 ? renderedTiers : null}
      
      {filteredUnplaced.length > 0 && unplacedSection}

      {isFiltered && !hasAnyResults && (
          <Card className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Терминалы с такими параметрами не найдены.</p>
          </Card>
      )}

      <TerminalDetailsSheet
        terminal={selectedTerminal}
        isOpen={!!selectedTerminal}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
