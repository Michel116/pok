
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Bot, ShieldCheck, ArrowRight, Info, Clock, UserCheck, Truck, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Terminal } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useUser } from '@/context/user-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTerminals } from '@/context/terminals-context';
import { useToast } from '@/components/ui/use-toast';
import { ShipTerminalDialog } from '../../shipping/components/ship-terminal-dialog';

interface VerificationDetailsSheetProps {
  terminal: Terminal | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVerify: (terminalId: string, status: 'verified' | 'pending' | 'not_verified', verificationDate?: string, verifiedUntil?: string) => void;
  initialTab?: 'details' | 'history';
}

type VerificationStep = 'info' | 'arshin' | 'date_entry' | 'pending_action';
type InfoTab = 'details' | 'history';

export function VerificationDetailsSheet({ terminal, isOpen, onOpenChange, onVerify, initialTab = 'details' }: VerificationDetailsSheetProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { shipTerminal, contragents } = useTerminals();
  const [step, setStep] = useState<VerificationStep>('info');
  const [infoTab, setInfoTab] = useState<InfoTab>(initialTab);
  const [verificationDate, setVerificationDate] = useState<Date | undefined>();
  const [verifiedUntil, setVerifiedUntil] = useState<Date | undefined>();
  const [arshinVisited, setArshinVisited] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);

  const isExpired = useMemo(() => terminal?.status === 'expired', [terminal]);
  
  const canVerify = useMemo(() => terminal && 
    (terminal.status === 'not_verified' || terminal.status === 'expired') &&
    user?.role === 'Verifier', [terminal, user.role]);
    
  const isPendingForVerifier = useMemo(() => terminal &&
    terminal.status === 'pending' &&
    user?.role === 'Verifier', [terminal, user.role]);
  
  const isActionableByAdmin = useMemo(() => terminal &&
    (terminal.status === 'pending' || terminal.status === 'not_verified' || terminal.status === 'expired') &&
    user?.role === 'Administrator', [terminal, user.role]);

  const arshinUrl = terminal 
    ? `https://fgis.gost.ru/fundmetrology/cm/results?search=${terminal.serialNumber}`
    : '#';

  useEffect(() => {
    if (isOpen && terminal) {
      if (canVerify) {
        setStep('arshin');
      } else if (isPendingForVerifier) {
        setStep('pending_action');
      } else {
        setStep('info');
      }
      setInfoTab(initialTab);
      setVerificationDate(undefined);
      setVerifiedUntil(undefined);
      setArshinVisited(false);
      setIsShipDialogOpen(false);
    }
  }, [terminal, isOpen, canVerify, isPendingForVerifier, initialTab]);
  
  useEffect(() => {
    if (isOpen) {
        setInfoTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (step === 'date_entry' && verificationDate) {
      const nextYear = new Date(verificationDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear.setDate(nextYear.getDate() - 1);
      setVerifiedUntil(nextYear);
    }
  }, [verificationDate, step]);


  if (!terminal) {
    return null;
  }

  const handleConfirmVerification = () => {
    if (terminal && verificationDate && verifiedUntil) {
      onVerify(terminal.serialNumber, 'verified', verificationDate.toISOString(), verifiedUntil.toISOString());
    }
  };
  
  const handleSetToPending = () => {
      if (terminal) {
          onVerify(terminal.serialNumber, 'pending');
      }
  }
  
  const handleClearStatus = () => {
      if (terminal) {
          onVerify(terminal.serialNumber, 'not_verified');
      }
  }

  const handleShipClick = () => {
    if (terminal.status === 'not_verified' && !isExpired) {
        toast({
            variant: "destructive",
            title: "Отгрузка невозможна",
            description: "Терминал не поверен и не может быть отгружен."
        });
    } else {
        setIsShipDialogOpen(true);
    }
  }

  const handleShipConfirm = (terminalId: string, contragent: string) => {
    shipTerminal(terminalId, contragent);
    toast({
        title: "Терминал отгружен",
        description: `Терминал ${terminalId} был успешно отгружен для ${contragent}.`
    });
    setIsShipDialogOpen(false);
    onOpenChange(false); // Close details sheet
  }

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '—';
    return format(new Date(date), "dd.MM.yyyy", { locale: ru });
  }

  const formatHistoryDate = (date: string | undefined | null) => {
      if (!date) return 'нет';
      return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const localizedStatus = {
    "pending": "Ожидание",
    "verified": "Поверен",
    "not_verified": "Не поверен",
    "shipped": "Отправлен",
    "awaits_verification_after_shipping": "Отгружен (ожидает поверки)",
    "expired": "Просрочен"
  }[terminal.status] || terminal.status;

  const renderContent = () => {
    switch (step) {
      case 'pending_action':
        return (
             <div className="flex flex-col h-full">
                <div className="flex-grow space-y-4">
                     <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Терминал в ожидании</AlertTitle>
                        <AlertDescription>
                            Терминал уже проверен (по нему подали список), но в Аршин он еще не попал. Вы можете проверить его нажав на кнопку «Проверить в Аршин».
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Button className="w-full" onClick={() => setStep('date_entry')}>
                            <ShieldCheck className="mr-2 h-4 w-4"/>
                            Перевести в статус "Поверен"
                        </Button>
                         <Button asChild variant="outline" className="w-full">
                            <a href={arshinUrl} target="_blank" rel="noopener noreferrer">
                                <Bot className="mr-2 h-4 w-4" />
                                Проверить в Аршин
                            </a>
                        </Button>
                    </div>
                </div>
                <SheetFooter className="pt-4 mt-auto border-t">
                  <Button variant="destructive" className="w-full" onClick={handleClearStatus}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Сбросить статус
                  </Button>
                </SheetFooter>
          </div>
        );
      case 'arshin':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
                 <Alert>
                    <AlertTitle>Шаг 1: Проверка в Аршин</AlertTitle>
                    <AlertDescription>
                        Пожалуйста, убедитесь, что информация о поверке терминала присутствует в системе ФГИС "Аршин".
                    </AlertDescription>
                </Alert>
                 <Button asChild variant="outline" className="w-full" onClick={() => setArshinVisited(true)}>
                    <a href={arshinUrl} target="_blank" rel="noopener noreferrer">
                        <Bot className="mr-2 h-4 w-4" />
                        Проверить в Аршин
                    </a>
                </Button>
            </div>
            <SheetFooter className="pt-4 mt-auto border-t">
              <Button className="w-full" onClick={() => setStep('date_entry')} disabled={!arshinVisited}>
                Продолжить <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SheetFooter>
          </div>
        );
      case 'date_entry':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
               <Alert>
                  <AlertTitle>Шаг 2: Ввод данных</AlertTitle>
                  <AlertDescription>
                      Укажите дату поверки или переведите терминал в статус "Ожидание".
                  </AlertDescription>
              </Alert>
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
                  <Input id="verifiedUntil" value={verifiedUntil ? formatDate(verifiedUntil) : '—'} readOnly disabled />
              </div>
            </div>
            <SheetFooter className="pt-4 mt-auto border-t flex flex-col sm:flex-row gap-2">
               <Button variant="ghost" onClick={() => terminal?.status === 'pending' ? setStep('pending_action') : setStep('arshin')}>Назад</Button>
               <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button onClick={handleSetToPending} variant="outline" className="w-full">
                        <Clock className="mr-2 h-4 w-4"/>
                        В ожидание
                    </Button>
                    <Button onClick={handleConfirmVerification} disabled={!verificationDate || !verifiedUntil} className="w-full">
                        <ShieldCheck className="mr-2 h-4 w-4"/>Подтвердить
                    </Button>
               </div>
            </SheetFooter>
          </div>
        );
      case 'info':
      default:
        return (
            <div className="flex flex-col h-full">
             <Tabs value={infoTab} onValueChange={(value) => setInfoTab(value as InfoTab)} className="flex-grow flex flex-col mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Детали</TabsTrigger>
                    <TabsTrigger value="history">История</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="flex-grow space-y-3 py-4 text-sm">
                    {isActionableByAdmin && (
                        <Alert>
                            <UserCheck className="h-4 w-4" />
                            <AlertTitle>Требуется действие</AlertTitle>
                            <AlertDescription>
                                Для поверки этого терминала, пожалуйста, переключитесь на роль «Проверяющий» на странице Настроек.
                            </AlertDescription>
                        </Alert>
                    )}
                    {terminal.status === 'verified' && !isExpired && (
                        <Alert variant="default" className="bg-verified/10 border-verified/50 text-green-900 dark:text-green-200">
                            <Info className="h-4 w-4 !text-current" />
                            <AlertTitle>Терминал поверен</AlertTitle>
                            <AlertDescription>
                                Новая поверка не требуется.
                            </AlertDescription>
                        </Alert>
                    )}
                    {isExpired && (
                        <Alert variant="warning">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Срок поверки истёк</AlertTitle>
                            <AlertDescription>
                                Поверка закончилась {formatDate(terminal.verifiedUntil)}. Требуется новая поверка.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Серийный номер:</span>
                        <span>{terminal.serialNumber}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Статус:</span>
                        <span>{localizedStatus}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Расположение:</span>
                        <span>{terminal.location ? `Стеллаж ${terminal.location.sectionId}` : 'Не размещен'}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Дата поверки:</span>
                        <span>{formatDate(terminal.lastVerificationDate)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center">
                        <span className="font-semibold text-muted-foreground">Поверен до:</span>
                        <span>{formatDate(terminal.verifiedUntil)}</span>
                    </div>
                </TabsContent>
                <TabsContent value="history" className="flex-grow">
                     <ScrollArea className="h-[calc(100vh-300px)] pr-4">
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
             {(terminal.status === 'verified' || isExpired) && (
                <SheetFooter className="pt-4 mt-auto border-t">
                    <Button className="w-full" onClick={handleShipClick} disabled={terminal.status === 'shipped' || terminal.status === 'awaits_verification_after_shipping'}>
                        <Truck className="mr-2 h-4 w-4" />
                        Отгрузить
                    </Button>
                </SheetFooter>
            )}
            </div>
        );
    }
  };


  return (
    <>
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col sm:max-w-md">
                <SheetHeader>
                <SheetTitle>Детали терминала</SheetTitle>
                <SheetDescription>
                    Просмотр и управление поверкой терминала {terminal.serialNumber}.
                </SheetDescription>
                </SheetHeader>
                {renderContent()}
            </SheetContent>
        </Sheet>
        {isShipDialogOpen && terminal && (
            <ShipTerminalDialog
                terminal={terminal}
                isOpen={isShipDialogOpen}
                onOpenChange={setIsShipDialogOpen}
                onShip={handleShipConfirm}
                contragents={contragents}
            />
        )}
    </>
  );
}
