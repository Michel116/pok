
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Terminal } from '@/lib/types';
import { Undo2, Truck, Move, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTerminals } from '@/context/terminals-context';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ShipTerminalDialog } from '../../shipping/components/ship-terminal-dialog';
import { MoveTerminalDialog } from '../../shelves/components/move-terminal-dialog';

interface RentalTerminalDetailsSheetProps {
  terminal: Terminal | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RentalTerminalDetailsSheet({ terminal, isOpen, onOpenChange }: RentalTerminalDetailsSheetProps) {
  const { toast } = useToast();
  const { returnTerminal, rentTerminal, contragents, moveTerminal, shelfSections, addContragent } = useTerminals();
  const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isExpired = useMemo(() => terminal?.status === 'expired', [terminal]);

  useEffect(() => {
    if (!isOpen) {
      setActionError(null);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (terminal) {
      if (isExpired) {
        setActionError(`Срок поверки истёк. Рекомендуется провести поверку.`);
      } else if (terminal.status === 'not_verified') {
        setActionError("Терминал не поверен и не может быть сдан в аренду.");
      } else {
        setActionError(null);
      }
    }
  }, [terminal, isExpired]);


  if (!terminal) {
    return null;
  }
  
  const handleReturn = () => {
    if (terminal && terminal.status === 'rented') {
        returnTerminal(terminal.serialNumber);
        toast({
            title: "Терминал возвращен",
            description: `Терминал ${terminal.serialNumber} был возвращен на склад.`,
        });
        onOpenChange(false);
    }
  }

  const handleRentClick = () => {
    if (terminal.status === 'not_verified' && !isExpired) {
      // Error is already set in useEffect
    } else {
        setIsRentDialogOpen(true);
    }
  }
  
  const handleRentConfirm = (terminalId: string, contragent: string) => {
    rentTerminal(terminalId, contragent);
    toast({
        title: "Терминал сдан в аренду",
        description: `Терминал ${terminalId} был успешно передан в аренду для ${contragent}.`
    });
    setIsRentDialogOpen(false);
    onOpenChange(false); // Close details sheet
  }

  const handleMoveConfirm = (terminalToMove: Terminal, newSectionId: string) => {
    moveTerminal(terminalToMove, newSectionId);
    toast({
        title: "Терминал перемещен",
        description: `Терминал ${terminalToMove.serialNumber} был успешно перемещен.`
    });
    setIsMoveDialogOpen(false);
    onOpenChange(false);
  }


  const localizedStatus = {
    "pending": "Ожидание",
    "verified": "Поверен",
    "not_verified": "Не поверен",
    "shipped": "Отправлен",
    "awaits_verification_after_shipping": "Отгружен (ожидает поверки)",
    "rented": "В аренде",
    "expired": "Просрочен"
  }[terminal.status] || terminal.status;

  const boxTypeLabel = {
    'type_A': 'Маленькая',
    'type_B': 'Большая'
  }[terminal.boxType];

  const formatDate = (date: string | undefined | null) => {
      if (!date) return 'нет';
      return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  
  const rentalContragent = terminal.history.slice().reverse().find(h => h.event.includes('Передан в аренду контрагенту:'))?.event.split(': ')[1] || 'Неизвестно';


  return (
    <>
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-md">
            <SheetHeader>
            <SheetTitle>Терминал {terminal.serialNumber}</SheetTitle>
            <SheetDescription>
                Подробная информация и история арендного терминала.
            </SheetDescription>
            </SheetHeader>
            
            <Tabs defaultValue="details" className="flex-grow flex flex-col mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Детали</TabsTrigger>
                    <TabsTrigger value="history">История</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="flex-grow space-y-3 py-4 text-sm">
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Серийный номер:</span>
                        <span>{terminal.serialNumber}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Статус:</span>
                        <span>{localizedStatus}</span>
                    </div>
                    {terminal.status === 'rented' && (
                        <div className="grid grid-cols-[120px_1fr] items-center">
                            <span className="font-semibold text-muted-foreground">Контрагент:</span>
                            <span>{rentalContragent}</span>
                        </div>
                    )}
                    {terminal.location && (
                         <div className="grid grid-cols-[120px_1fr] items-center">
                            <span className="font-semibold text-muted-foreground">Расположение:</span>
                             <span>{`Стеллаж ${terminal.location.sectionId}`}</span>
                        </div>
                    )}
                     {!terminal.location && terminal.status !== 'rented' && (
                         <div className="grid grid-cols-[120px_1fr] items-center">
                            <span className="font-semibold text-muted-foreground">Расположение:</span>
                             <span>Не размещен</span>
                        </div>
                    )}
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Поверен до:</span>
                        <span>{terminal.verifiedUntil ? new Date(terminal.verifiedUntil).toLocaleDateString('ru-RU') : 'нет'}</span>
                    </div>
                </TabsContent>
                <TabsContent value="history" className="flex-grow">
                     <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                         <div className="space-y-6 py-4">
                            {[...(terminal.history || [])].reverse().map((event, index) => {
                                const eventText = event.event.toLowerCase();
                                const isVerified = eventText.includes('поверен');
                                const isRented = eventText.includes('аренду');
                                const isShipped = eventText.includes('отгружен');
                                const isReturned = eventText.includes('возвращен');

                                return (
                                <div key={index} className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 flex h-3 w-3 items-center justify-center">
                                        <span className={cn('h-2 w-2 rounded-full', {
                                            'bg-green-500': isVerified,
                                            'bg-blue-500': isRented,
                                            'bg-yellow-500': isShipped,
                                            'bg-red-500': isReturned || eventText.includes('просрочен'),
                                            'bg-muted-foreground/50': !isVerified && !isRented && !isShipped && !isReturned,
                                        })}></span>
                                    </div>
                                    <div className="absolute left-[5.5px] top-[10px] h-full w-px bg-border"></div>

                                    <p className="text-sm font-medium">{event.event}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(event.date)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Кто добавил: {event.responsible}
                                    </p>
                                </div>
                            )})}
                         </div>
                     </ScrollArea>
                </TabsContent>
            </Tabs>
             <div className="min-h-[40px] flex items-center">
              {actionError && (
                <div className={cn("flex items-center gap-2 text-sm", isExpired ? "text-indigo-600" : "text-destructive")}>
                  <AlertCircle className="h-4 w-4" />
                  <p>{actionError}</p>
                </div>
              )}
            </div>

            <Separator />
            <SheetFooter className="pt-4 grid grid-cols-2 gap-2">
                {terminal.status === 'rented' ? (
                     <Button className="w-full col-span-2" variant="outline" onClick={handleReturn}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Вернуть на склад
                    </Button>
                ) : (
                    <>
                        <Button className="w-full" variant="outline" onClick={() => setIsMoveDialogOpen(true)}>
                            <Move className="mr-2 h-4 w-4" />
                            Переместить
                        </Button>
                         <Button className="w-full" variant="secondary" onClick={handleRentClick} disabled={terminal.status === 'not_verified' && !isExpired}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Сдать в аренду
                        </Button>
                    </>
                )}
            </SheetFooter>
        </SheetContent>
        </Sheet>
        {terminal && isRentDialogOpen && (
            <ShipTerminalDialog
                terminal={terminal}
                isOpen={isRentDialogOpen}
                onOpenChange={setIsRentDialogOpen}
                onShip={handleRentConfirm}
                contragents={contragents}
                dialogType="rent"
                addContragent={addContragent}
            />
        )}
        {terminal && isMoveDialogOpen && (
            <MoveTerminalDialog
                terminal={terminal}
                isOpen={isMoveDialogOpen}
                onOpenChange={setIsMoveDialogOpen}
                onMove={handleMoveConfirm}
                shelfSections={shelfSections.filter(s => s.tier === 'Аренда')}
            />
        )}
    </>
  );
}
