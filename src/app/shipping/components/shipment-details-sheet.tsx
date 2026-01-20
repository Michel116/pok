'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Edit, Save, X } from 'lucide-react';
import type { ShipmentWithDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShipmentDetailsSheetProps {
  shipment: ShipmentWithDetails | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateVerification: (terminalId: string, verificationDate: string, verifiedUntil: string) => void;
  onUpdateShipmentDate: (terminalId: string, newShippingDate: string) => void;
}

export function ShipmentDetailsSheet({ shipment, isOpen, onOpenChange, onUpdateVerification, onUpdateShipmentDate }: ShipmentDetailsSheetProps) {
  const [isEditingVerification, setIsEditingVerification] = useState(false);
  const [isEditingShipDate, setIsEditingShipDate] = useState(false);
  
  const [verificationDate, setVerificationDate] = useState<Date | undefined>();
  const [verifiedUntil, setVerifiedUntil] = useState<Date | undefined>();
  const [shippingDate, setShippingDate] = useState<Date | undefined>();
  
  const needsVerification = shipment?.initialStatus === 'pending' && !shipment.lastVerificationDate;

  useEffect(() => {
    if (isOpen && shipment) {
      const canEdit = needsVerification;
      setIsEditingVerification(canEdit);
      setIsEditingShipDate(false);
      
      setShippingDate(new Date(shipment.shippingDate));
      
      if (canEdit) {
        setVerificationDate(undefined);
        setVerifiedUntil(undefined);
      } else {
        setVerificationDate(shipment.lastVerificationDate ? new Date(shipment.lastVerificationDate) : undefined);
        setVerifiedUntil(shipment.verifiedUntil ? new Date(shipment.verifiedUntil) : undefined);
      }
    } else {
      // Reset on close
      setIsEditingVerification(false);
      setIsEditingShipDate(false);
      setVerificationDate(undefined);
      setVerifiedUntil(undefined);
      setShippingDate(undefined);
    }
  }, [shipment, isOpen, needsVerification]);

  useEffect(() => {
    if (isEditingVerification && verificationDate) {
      const nextYear = new Date(verificationDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear.setDate(nextYear.getDate() - 1);
      setVerifiedUntil(nextYear);
    }
  }, [verificationDate, isEditingVerification]);


  if (!shipment) {
    return null;
  }

  const handleSaveVerification = () => {
    if (shipment && verificationDate && verifiedUntil) {
      onUpdateVerification(shipment.serialNumber, verificationDate.toISOString(), verifiedUntil.toISOString());
    }
  };
  
  const handleSaveShipmentDate = () => {
      if (shipment && shippingDate) {
          onUpdateShipmentDate(shipment.serialNumber, shippingDate.toISOString());
          setIsEditingShipDate(false);
      }
  }

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '—';
    return format(new Date(date), "dd.MM.yyyy", { locale: ru });
  }

  const formatHistoryDate = (date: string | undefined | null) => {
      if (!date) return 'нет';
      return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader className="pr-12">
          <SheetTitle>Детали отгрузки</SheetTitle>
          <SheetDescription>
            Подробная информация об отгрузке терминала {shipment.serialNumber}.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="details" className="flex-grow flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="flex-grow flex flex-col space-y-4 py-4">
              <div className="flex-grow space-y-4 overflow-y-auto">
                <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                    <span className="font-semibold text-muted-foreground">Серийный номер:</span>
                    <span>{shipment.serialNumber}</span>
                </div>
                 <div className="grid grid-cols-[140px_1fr] items-center text-sm group">
                  <span className="font-semibold text-muted-foreground">Дата отправки:</span>
                  {isEditingShipDate ? (
                    <div className="flex items-center gap-2">
                       <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            size="sm"
                            className={cn(
                                "w-[150px] justify-start text-left font-normal",
                                !shippingDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {shippingDate ? format(shippingDate, "dd.MM.yyyy", { locale: ru }) : <span>Выберите дату</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            locale={ru}
                            mode="single"
                            selected={shippingDate}
                            onSelect={setShippingDate}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveShipmentDate}><Save className="h-4 w-4 text-green-600"/></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditingShipDate(false)}><X className="h-4 w-4 text-red-600"/></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                        <span>{formatDate(shipment.shippingDate)}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setIsEditingShipDate(true)}>
                            <Edit className="h-4 w-4"/>
                        </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                    <span className="font-semibold text-muted-foreground">Контрагент:</span>
                    <span className="truncate">{shipment.contragent}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Данные о поверке</h3>
                  {needsVerification && !isEditingVerification && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingVerification(true)}>
                      <Edit className="mr-2 h-4 w-4"/>
                      Внести дату
                    </Button>
                  )}
                </div>
                
                {isEditingVerification ? (
                  <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                          <Label htmlFor="verificationDate">Дата поверки</Label>
                          <Popover>
                          <PopoverTrigger asChild>
                              <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !verificationDate && "text-muted-foreground"
                              )}
                              >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {verificationDate ? format(verificationDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar
                              locale={ru}
                              mode="single"
                              selected={verificationDate}
                              onSelect={setVerificationDate}
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromDate={new Date('2023-01-01')}
                              toDate={new Date()}
                              />
                          </PopoverContent>
                          </Popover>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="verifiedUntil">Поверен до</Label>
                          <Input id="verifiedUntil" value={verifiedUntil ? format(verifiedUntil, 'dd.MM.yyyy', { locale: ru }) : '—'} readOnly disabled />
                      </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                          <span className="font-semibold text-muted-foreground">Дата поверки:</span>
                          <span>{formatDate(shipment.lastVerificationDate)}</span>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                          <span className="font-semibold text-muted-foreground">Поверен до:</span>
                          <span>{formatDate(shipment.verifiedUntil)}</span>
                      </div>
                  </div>
                )}
              </div>
            
              {isEditingVerification && (
                  <SheetFooter className="pt-4 mt-auto border-t">
                      <Button variant="ghost" onClick={() => {
                          setIsEditingVerification(false);
                      }}>Отмена</Button>
                      <Button onClick={handleSaveVerification} disabled={!verificationDate || !verifiedUntil}>
                          <Save className="mr-2 h-4 w-4"/>Сохранить
                      </Button>
                  </SheetFooter>
              )}
          </TabsContent>
          <TabsContent value="history" className="flex-grow">
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                  <div className="space-y-6 py-4">
                  {[...(shipment.history || [])].reverse().map((event, index) => {
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
                                  'bg-red-500': isReturned,
                                  'bg-muted-foreground/50': !isVerified && !isRented && !isShipped && !isReturned,
                              })}></span>
                          </div>
                          <div className="absolute left-[5.5px] top-[10px] h-full w-px bg-border"></div>

                          <p className="text-sm font-medium">{event.event}</p>
                          <p className="text-xs text-muted-foreground">
                              {formatHistoryDate(event.date)}
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
        
      </SheetContent>
    </Sheet>
  );
}
