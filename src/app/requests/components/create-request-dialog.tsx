
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Terminal } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface CreateRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  terminals: Terminal[];
  onCreate: (terminalIds: string[], customId?: string) => void;
}

export function CreateRequestDialog({
  isOpen,
  onOpenChange,
  terminals,
  onCreate,
}: CreateRequestDialogProps) {
  const [selectedTerminals, setSelectedTerminals] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [customId, setCustomId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedTerminals(new Set());
      setSearchTerm('');
      setCustomId('');
    }
  }, [isOpen]);

  const filteredTerminals = useMemo(() => {
    return terminals.filter(t =>
      t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [terminals, searchTerm]);

  const handleCreate = () => {
    if (selectedTerminals.size === 0) {
      toast({
        variant: "destructive",
        title: "Нет выбранных терминалов",
        description: "Пожалуйста, выберите хотя бы один терминал для создания заявки.",
      });
      return;
    }
    onCreate(Array.from(selectedTerminals), customId.trim());
  };

  const handleSelectAll = () => {
    if (selectedTerminals.size === filteredTerminals.length) {
      setSelectedTerminals(new Set());
    } else {
      setSelectedTerminals(new Set(filteredTerminals.map(t => t.serialNumber)));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Создание заявки на поверку</DialogTitle>
          <DialogDescription>
            Выберите терминалы и при желании укажите номер заявки.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по S/N..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
                 <Input
                    id="custom-id"
                    placeholder="Номер заявки (необязательно)"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                />
            </div>
        </div>


        <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center space-x-2">
                 <Checkbox
                    id="select-all"
                    checked={selectedTerminals.size > 0 && selectedTerminals.size === filteredTerminals.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Выбрать все"
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                    Выбрать все ({selectedTerminals.size} / {filteredTerminals.length})
                </Label>
            </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="space-y-2 py-2 pr-2">
            {filteredTerminals.map(terminal => (
              <div
                key={terminal.serialNumber}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`terminal-${terminal.serialNumber}`}
                    checked={selectedTerminals.has(terminal.serialNumber)}
                    onCheckedChange={(checked) => {
                      setSelectedTerminals(prev => {
                        const newSet = new Set(prev);
                        if (checked) {
                          newSet.add(terminal.serialNumber);
                        } else {
                          newSet.delete(terminal.serialNumber);
                        }
                        return newSet;
                      });
                    }}
                  />
                  <Label htmlFor={`terminal-${terminal.serialNumber}`} className="font-mono text-sm cursor-pointer">
                    {terminal.serialNumber}
                  </Label>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${terminal.status === 'expired' ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}>
                  {terminal.status === 'expired' ? 'Просрочен' : 'Не поверен'}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleCreate} disabled={selectedTerminals.size === 0}>
            Создать заявку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
