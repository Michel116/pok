
'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
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
import { AlertTriangle, ChevronsUpDown, CheckCircle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ShipTerminalDialogProps {
  terminal: Terminal;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onShip: (terminalId: string, contragent: string) => void;
  contragents: string[];
  addContragent: (name: string) => void;
  dialogType?: 'ship' | 'rent';
}

export function ShipTerminalDialog({
  terminal,
  isOpen,
  onOpenChange,
  onShip,
  contragents,
  addContragent,
  dialogType = 'ship'
}: ShipTerminalDialogProps) {
  const [contragent, setContragent] = useState('');
  const [isConfirmingExpired, setIsConfirmingExpired] = useState(false);
  const [isContragentPopoverOpen, setContragentPopoverOpen] = useState(false);
  const [newContragentName, setNewContragentName] = useState('');
  
  const isExpired = terminal.status === 'expired';
  
  useEffect(() => {
    if (isOpen) {
      setContragent('');
      setIsConfirmingExpired(false);
      setNewContragentName('');
    }
  }, [isOpen]);

  const handleShip = () => {
    if (contragent.trim()) {
       if (isExpired) {
        setIsConfirmingExpired(true);
      } else {
        onShip(terminal.serialNumber, contragent.trim());
      }
    }
  };

  const handleConfirmExpiredShipment = () => {
    onShip(terminal.serialNumber, contragent.trim());
    setIsConfirmingExpired(false);
  }

  const handleAddNewContragent = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName && !contragents.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        addContragent(trimmedName);
        setContragent(trimmedName);
    }
    setNewContragentName('');
    setContragentPopoverOpen(false);
  };

  const dialogTitle = dialogType === 'rent' ? "Сдача в аренду" : "Отгрузка терминала";
  const dialogDescription = dialogType === 'rent' 
    ? `Подтвердите передачу в аренду терминала ${terminal.serialNumber}.`
    : `Подтвердите отгрузку терминала ${terminal.serialNumber}.`;
  const buttonText = dialogType === 'rent' ? "Сдать в аренду" : "Отгрузить";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             {isExpired && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Срок поверки истёк!</AlertTitle>
                  <AlertDescription>
                    Поверка закончилась {new Date(terminal.verifiedUntil!).toLocaleDateString('ru-RU')}. Отгрузка будет с пометкой.
                  </AlertDescription>
                </Alert>
             )}
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
                      <span className="truncate">{contragent || "Выберите или добавьте..."}</span>
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
            <div className="space-y-2">
              <Label>Дата поверки</Label>
              <Input value={terminal.lastVerificationDate ? new Date(terminal.lastVerificationDate).toLocaleDateString('ru-RU') : 'Нет данных'} readOnly disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button onClick={handleShip} disabled={!contragent.trim()}>{buttonText}</Button>
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
