
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface ManageContragentsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contragents: string[];
  onAddContragent: (name: string) => boolean;
  onDeleteContragent: (name: string) => void;
}

type LegalForm = 'ООО' | 'АО' | 'ИП';

export function ManageContragentsDialog({
  isOpen,
  onOpenChange,
  contragents,
  onAddContragent,
  onDeleteContragent,
}: ManageContragentsDialogProps) {
  const { toast } = useToast();
  const [newContragentName, setNewContragentName] = useState('');
  const [legalForm, setLegalForm] = useState<LegalForm>('ООО');

  const handleAdd = () => {
    if (!newContragentName.trim()) return;

    const fullName = `${legalForm} "${newContragentName.trim()}"`;

    const success = onAddContragent(fullName);
    if (success) {
      toast({
        title: 'Контрагент добавлен',
        description: `"${fullName}" успешно добавлен.`,
      });
      setNewContragentName('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Такой контрагент уже существует.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col">
        <DialogHeader>
          <DialogTitle>Контрагенты</DialogTitle>
          <DialogDescription>
            Добавляйте, просматривайте и удаляйте контрагентов.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow space-y-4 overflow-hidden pt-4">
          <div className="space-y-2">
            <Label>Добавить нового контрагента</Label>
            <div className="flex items-center gap-2">
                <Select value={legalForm} onValueChange={(value: LegalForm) => setLegalForm(value)}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ООО">ООО</SelectItem>
                        <SelectItem value="АО">АО</SelectItem>
                        <SelectItem value="ИП">ИП</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    id="new-contragent"
                    value={newContragentName}
                    onChange={(e) => setNewContragentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Название компании"
                    className="flex-1"
                />
            </div>
             <Button onClick={handleAdd} disabled={!newContragentName.trim()} className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
          </div>

          <div className="space-y-2">
            <Label>Текущие контрагенты</Label>
            <ScrollArea className="h-48 w-full rounded-md border">
                <div className="p-2 sm:p-4 space-y-2">
                {contragents.length > 0 ? (
                    contragents.sort().map(c => (
                        <div key={c} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                            <span className="text-sm truncate">{c}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                                onClick={() => onDeleteContragent(c)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">Список пуст.</p>
                )}
                </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
