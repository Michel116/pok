
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Terminal } from '@/lib/types';
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useTerminals } from '@/context/terminals-context';
import { cn } from '@/lib/utils';


interface InitiateShipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  terminals: Terminal[];
  onShip: (terminalId: string, contragent: string) => void;
  contragents: string[];
  addContragent: (name: string) => void;
}

export function InitiateShipmentDialog({
  isOpen,
  onOpenChange,
  terminals,
  onShip,
  contragents,
  addContragent
}: InitiateShipmentDialogProps) {
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [contragent, setContragent] = useState('');
  const [terminalSearch, setTerminalSearch] = useState('');
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isConfirmingExpired, setIsConfirmingExpired] = useState(false);
  const [isContragentPopoverOpen, setContragentPopoverOpen] = useState(false);
  const [newContragentName, setNewContragentName] = useState('');

  const isExpired = selectedTerminal?.status === 'expired';
  
  useEffect(() => {
    if (isOpen) {
      setSelectedTerminal(null);
      setContragent('');
      setTerminalSearch('');
      setShippingError(null);
      setIsConfirmingExpired(false);
      setNewContragentName('');
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (selectedTerminal) {
      if (isExpired) {
          setShippingError(`Срок поверки истёк ${new Date(selectedTerminal.verifiedUntil!).toLocaleDateString('ru-RU')}. Рекомендуется провести поверку.`);
      } else if (selectedTerminal.status === 'not_verified') {
        setShippingError("Терминал не поверен и не может быть отгружен.");
      } else {
        setShippingError(null);
      }
    } else {
      setShippingError(null);
    }
  }, [selectedTerminal, isExpired]);

  useEffect(() => {
    if (terminalSearch) {
      const perfectMatch = terminals.find(t => t.serialNumber === terminalSearch);
      if (perfectMatch) {
        setSelectedTerminal(perfectMatch);
      }
    }
  }, [terminalSearch, terminals]);

  const handleShip = () => {
    if (selectedTerminal && contragent.trim()) {
      if (selectedTerminal.status === 'not_verified' && !isExpired) {
         return; // Should already be blocked by disabled button, but as a safeguard
      }
      if (isExpired) {
        setIsConfirmingExpired(true);
      } else {
        onShip(selectedTerminal.serialNumber, contragent.trim());
      }
    }
  };

  const handleConfirmExpiredShipment = () => {
    if (selectedTerminal && contragent.trim()) {
      onShip(selectedTerminal.serialNumber, contragent.trim());
    }
    setIsConfirmingExpired(false);
  }

  const filteredTerminals = useMemo(() => {
    if (!terminalSearch) return [];
    if (selectedTerminal && terminalSearch === selectedTerminal.serialNumber) return [];
    return terminals.filter(t => t.serialNumber.toLowerCase().includes(terminalSearch.toLowerCase()));
  }, [terminalSearch, terminals, selectedTerminal]);

  const handleTerminalSelect = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
    setTerminalSearch(terminal.serialNumber);
  }

  const canShip = useMemo(() => {
    if (!selectedTerminal || !contragent.trim()) return false;
    // Expired terminals can be shipped (with a warning), but `not_verified` ones from start cannot.
    if (selectedTerminal.status === 'not_verified' && !isExpired) return false;
    return true;
  }, [selectedTerminal, contragent, isExpired]);

   const handleAddNewContragent = (name: string) => {
        const trimmedName = name.trim();
        if (trimmedName && !contragents.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
            addContragent(trimmedName);
            setContragent(trimmedName);
        }
        setNewContragentName('');
        setContragentPopoverOpen(false);
    };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Новая отгрузка</DialogTitle>
            <DialogDescription>
              Выберите терминал и контрагента для отгрузки.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="terminal-search">Терминал</Label>
              <Command className="relative overflow-visible">
                <CommandInput
                  id="terminal-search"
                  placeholder="Начните вводить S/N..."
                  value={terminalSearch}
                  onValueChange={(search) => {
                      setTerminalSearch(search);
                      if (selectedTerminal && search !== selectedTerminal.serialNumber) {
                          setSelectedTerminal(null);
                      }
                  }}
                />
                {terminalSearch.length > 0 && filteredTerminals.length > 0 && (
                  <CommandList className="absolute top-10 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <CommandEmpty>Нет доступных терминалов.</CommandEmpty>
                    <CommandGroup>
                      {filteredTerminals.map(t => (
                        <CommandItem
                          key={t.serialNumber}
                          value={t.serialNumber}
                          onSelect={() => handleTerminalSelect(t)}
                        >
                          {t.serialNumber}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}
              </Command>
            </div>

            {selectedTerminal && (
              <>
                {shippingError && (
                   <Alert variant={isExpired ? "warning" : "destructive"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{isExpired ? "Срок поверки истёк" : "Требуется внимание"}</AlertTitle>
                    <AlertDescription>{shippingError}</AlertDescription>
                  </Alert>
                )}
                {!shippingError && selectedTerminal.status === 'verified' && (
                  <Alert variant="default" className="bg-verified/10 border-verified/50 text-green-900 dark:text-green-200">
                    <CheckCircle className="h-4 w-4 !text-current" />
                    <AlertTitle>Терминал поверен</AlertTitle>
                    <AlertDescription>
                      Готов к отгрузке. Поверен до {new Date(selectedTerminal.verifiedUntil!).toLocaleDateString('ru-RU')}.
                    </AlertDescription>
                  </Alert>
                )}
                {!shippingError && selectedTerminal.status === 'pending' && (
                   <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Терминал ожидает поверки</AlertTitle>
                      <AlertDescription>
                        Отгрузка будет произведена с соответствующей пометкой.
                      </AlertDescription>
                    </Alert>
                )}
              </>
            )}


            {selectedTerminal && (
              <div className="space-y-2">
                <Label htmlFor="contragent">Контрагент</Label>
                <Popover open={isContragentPopoverOpen} onOpenChange={setContragentPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isContragentPopoverOpen}
                      className="w-full justify-between"
                    >
                      <span className="truncate">{contragent || "Выберите или добавьте контрагента..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Поиск или добавление..."
                        value={newContragentName}
                        onValueChange={setNewContragentName}
                       />
                       <CommandList>
                        <CommandEmpty>
                             <div className="p-2 text-sm text-center text-muted-foreground">
                                Не найдено.
                                <Button variant="link" size="sm" className="w-full h-auto p-1" onClick={() => handleAddNewContragent(newContragentName)}>
                                    Добавить "{newContragentName}"
                                </Button>
                             </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {contragents.map((c) => (
                            <CommandItem
                                key={c}
                                value={c}
                                onSelect={(currentValue) => {
                                setContragent(currentValue.toLowerCase() === contragent.toLowerCase() ? "" : currentValue);
                                setNewContragentName('');
                                setContragentPopoverOpen(false);
                                }}
                            >
                                <CheckCircle
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    contragent.toLowerCase() === c.toLowerCase() ? "opacity-100" : "opacity-0"
                                )}
                                />
                                {c}
                            </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button onClick={handleShip} disabled={!canShip}>Отгрузить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmingExpired} onOpenChange={setIsConfirmingExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Срок поверки этого терминала истек. Отгрузка будет отмечена как "с истекшим сроком поверки". Вы хотите продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExpiredShipment}>Продолжить отгрузку</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
