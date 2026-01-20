'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Terminal, ShelfSection } from '@/lib/types';
import { useTerminals } from '@/context/terminals-context';

interface MoveTerminalDialogProps {
  terminal: Terminal;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMove: (terminal: Terminal, newSectionId: string) => void;
  shelfSections: ShelfSection[];
}

export function MoveTerminalDialog({
  terminal,
  isOpen,
  onOpenChange,
  onMove,
  shelfSections: sectionsProp,
}: MoveTerminalDialogProps) {
  const [targetSectionId, setTargetSectionId] = useState<string | undefined>();
  const { shelfSections } = useTerminals(); // Use full sections from context to check capacity

  const filteredShelfSections = useMemo(() => {
    // This prop can be pre-filtered (e.g., for rental)
    return sectionsProp.filter(s => {
        const fullSection = shelfSections.find(fs => fs.id === s.id);
        if (!fullSection) return false;

        // Allow moving if the target section matches the terminal's box type
        if (s.currentBoxType === terminal.boxType) return true;
        
        // Allow moving if the target section is empty (currentBoxType is null)
        if (s.currentBoxType === null) return true;

        // If the section's box type is different, check if it's actually empty
        if (s.currentBoxType !== terminal.boxType) {
            return fullSection.terminals.length === 0;
        }

        return false;
    });
  }, [sectionsProp, shelfSections, terminal.boxType]);

  const hasAvailableSpace = useMemo(() => {
    if (!targetSectionId) return false;

    const section = shelfSections.find(s => s.id === targetSectionId);
    if (!section) return false;
    
    // If the section's box type doesn't match and it's not empty, no space.
    if (section.currentBoxType && section.currentBoxType !== terminal.boxType && section.terminals.length > 0) return false;

    const boxTypeForCapacity = section.currentBoxType || terminal.boxType;
    const capacity = section.capacity[boxTypeForCapacity];
    const totalCells = capacity.rows * capacity.cols;
    
    return section.terminals.length < totalCells;
  }, [targetSectionId, shelfSections, terminal.boxType]);

  useEffect(() => {
    if(!isOpen) {
        setTargetSectionId(undefined);
    }
  }, [isOpen]);

  const handleMove = () => {
    if (targetSectionId && hasAvailableSpace) {
      onMove(terminal, targetSectionId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Перемещение терминала</DialogTitle>
          <DialogDescription>
            Переместить терминал {terminal.serialNumber} на новое место.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section">Новая секция стеллажа</Label>
            <Select value={targetSectionId} onValueChange={setTargetSectionId}>
              <SelectTrigger id="section">
                <SelectValue placeholder="Выберите секцию" />
              </SelectTrigger>
              <SelectContent>
                 {filteredShelfSections.length > 0 ? (
                    filteredShelfSections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                            Секция {section.id} ({section.tier})
                        </SelectItem>
                    ))
                 ) : (
                    <SelectItem value="no-sections" disabled>
                        Нет подходящих секций
                    </SelectItem>
                 )}
              </SelectContent>
            </Select>
          </div>
           {targetSectionId && !hasAvailableSpace && (
                <p className="text-sm text-destructive">В этой секции нет свободных мест для данного типа коробки.</p>
           )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleMove} disabled={!targetSectionId || !hasAvailableSpace}>Переместить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
