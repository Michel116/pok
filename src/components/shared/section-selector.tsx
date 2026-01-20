
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { BoxType, ShelfSection } from '@/lib/types';
import { Box, CheckCircle } from 'lucide-react';
import React, { useMemo } from 'react';

interface SectionSelectorProps {
  availableSections: ShelfSection[];
  selectedSectionId?: string;
  onSelectSection: (id: string) => void;
  boxType: BoxType;
}

export function SectionSelector({
  availableSections,
  selectedSectionId,
  onSelectSection,
  boxType,
}: SectionSelectorProps) {
  
  const groupedSections = useMemo(() => {
    return availableSections.reduce((acc, section) => {
      const tier = section.tier && ['Верхний', 'Нижний', 'Аренда'].includes(section.tier) ? section.tier : 'Uncategorized';
      if (!acc[tier]) {
        acc[tier] = [];
      }
      acc[tier].push(section);
      return acc;
    }, {} as Record<string, ShelfSection[]>);
  }, [availableSections]);

  const tiers = ['Верхний', 'Нижний', 'Аренда'].filter(tier => groupedSections[tier] && groupedSections[tier].length > 0);


  if (availableSections.length === 0) {
    return (
      <Card className="flex items-center justify-center p-6 bg-muted/50 border-dashed">
        <div className="text-center text-muted-foreground">
          <Box className="mx-auto h-10 w-10 mb-2" />
          <p className="font-semibold">Нет доступных секций</p>
          <p className="text-sm">Нет свободных мест для коробок типа "{boxType === 'type_A' ? 'A' : 'B'}".</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Выберите секцию для размещения терминала с коробкой типа "{boxType === 'type_A' ? 'Маленькая' : 'Большая'}".</p>
      <ScrollArea className="h-48 w-full pr-3">
        <div className="space-y-4">
          {tiers.map(tier => (
            <div key={tier}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{tier} стеллаж</h4>
              <div className="grid grid-cols-2 gap-2">
                {groupedSections[tier].map(section => {
                  const isSelected = section.id === selectedSectionId;
                  
                  const boxTypeForCapacity = section.currentBoxType || boxType;
                  const capacity = section.capacity[boxTypeForCapacity];
                  const totalCells = capacity ? capacity.rows * capacity.cols : 0;
                  const freeCells = totalCells - section.terminals.length;

                  const displayBoxType = section.currentBoxType || '(пусто)';

                  return (
                    <button
                      key={section.id}
                      onClick={() => onSelectSection(section.id)}
                      className={cn(
                        'relative rounded-lg border p-3 text-left transition-all hover:border-primary/80',
                        isSelected ? 'border-primary ring-2 ring-primary/50' : 'bg-card'
                      )}
                    >
                      {isSelected && (
                         <CheckCircle className="absolute -top-2 -right-2 h-5 w-5 text-primary bg-background rounded-full" />
                      )}
                      <p className="font-bold">Секция {section.id}</p>
                      <p className="text-xs text-muted-foreground">
                        Свободно: {freeCells} из {totalCells}
                      </p>
                       <div className="mt-2 text-xs flex items-center gap-1 text-muted-foreground">
                         <Box className="h-3 w-3"/> Тип {displayBoxType === 'type_A' ? 'A' : displayBoxType === 'type_B' ? 'B' : displayBoxType}
                       </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
