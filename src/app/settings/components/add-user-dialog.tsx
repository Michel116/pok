
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { UserRole } from '@/lib/types';
import { EyeOff, Eye } from 'lucide-react';

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (name: string, pass: string, role: UserRole) => boolean;
}

export function AddUserDialog({ isOpen, onOpenChange, onAddUser }: AddUserDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('User');
  const [showPassword, setShowPassword] = useState(false);

  const handleAdd = () => {
    if (!name.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Логин и пароль не могут быть пустыми.',
      });
      return;
    }
    
    const success = onAddUser(name, password, role);

    if (success) {
      toast({
        title: 'Пользователь добавлен',
        description: `Аккаунт для "${name}" был успешно создан.`,
      });
      onOpenChange(false);
      setName('');
      setPassword('');
      setRole('User');
    } else {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пользователь с таким логином уже существует.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать нового пользователя</DialogTitle>
          <DialogDescription>
            Заполните данные для создания нового аккаунта.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите логин"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer">
                    {showPassword ? <EyeOff /> : <Eye />}
                </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">Пользователь</SelectItem>
                <SelectItem value="Verifier">Поверитель</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleAdd}>Создать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
