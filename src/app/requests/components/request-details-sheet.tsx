
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Edit, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import type { VerificationRequest, Terminal } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';


interface RequestDetailsSheetProps {
  request: VerificationRequest | null;
  terminals: Terminal[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProcess: (requestId: string) => void;
  onUpdateDetails: (requestId: string, newId: string, newDate: string) => void;
}

export function RequestDetailsSheet({
  request,
  terminals,
  isOpen,
  onOpenChange,
  onProcess,
  onUpdateDetails,
}: RequestDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedId, setEditedId] = useState('');
  const [editedDate, setEditedDate] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (request) {
      setEditedId(request.id);
      setEditedDate(new Date(request.createdAt));
      setIsEditing(false);
    }
  }, [request]);

  if (!request) return null;

  const isPending = request.status === 'pending';
  
  const handleProcessRequest = () => {
      onProcess(request.id);
      onOpenChange(false);
  }

  const handleSave = () => {
    if (!editedId.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Номер заявки не может быть пустым.",
      });
      return;
    }
    if (editedId.trim() !== request.id || (editedDate && format(editedDate, 'yyyy-MM-dd') !== format(new Date(request.createdAt), 'yyyy-MM-dd'))) {
      onUpdateDetails(request.id, editedId.trim(), editedDate!.toISOString());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedId(request.id);
    setEditedDate(new Date(request.createdAt));
    setIsEditing(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          {isEditing ? (
             <div className="space-y-2">
                <Input value={editedId} onChange={e => setEditedId(e.target.value)} className="text-lg font-semibold h-9" />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs text-muted-foreground font-normal">
                             <CalendarIcon className="mr-2 h-4 w-4"/>
                             {format(editedDate || new Date(), 'dd.MM.yyyy', { locale: ru })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            locale={ru}
                            mode="single"
                            selected={editedDate}
                            onSelect={setEditedDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
             </div>
          ) : (
             <div className="flex items-start justify-between pr-8">
                <div>
                  <SheetTitle>{request.id}</SheetTitle>
                  <SheetDescription>
                    Заявка от {format(new Date(request.createdAt), 'dd.MM.yyyy', { locale: ru })}.
                  </SheetDescription>
                </div>
                {isPending && <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4"/></Button>}
             </div>
          )}
        </SheetHeader>
        <div className="flex-grow py-4 space-y-4">
            {isEditing && (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Сохранить</Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>Отмена</Button>
              </div>
            )}
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Статус:</span>
                 <Badge variant={isPending ? "warning" : "success"}>
                    {isPending ? <Clock className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                    {isPending ? 'Ожидание' : 'Обработан'}
                </Badge>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Создал:</span>
                <span className="text-sm font-medium">{request.createdBy}</span>
            </div>
            <Separator />
            <p className="text-sm font-medium">Терминалы в заявке ({terminals.length}):</p>
            <ScrollArea className="h-full max-h-[calc(100vh-350px)] pr-3">
                <div className="space-y-2">
                    {terminals.map(terminal => (
                        <div key={terminal.serialNumber} className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="font-mono text-sm">{terminal.serialNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${terminal.status === 'expired' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {terminal.status === 'expired' ? 'Просрочен' : 'Ожидает'}
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
        {isPending && !isEditing && (
          <SheetFooter className="border-t pt-4">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" variant="default">
                        <Check className="mr-2 h-4 w-4" />
                        Отметить как "Обработано"
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердить обработку заявки?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие изменит статус заявки на "Обработан". Отменить это действие будет невозможно.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleProcessRequest}>Подтвердить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
