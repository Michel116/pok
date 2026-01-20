
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, Users, Bell, User as UserIcon, Shield, LayoutGrid, AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import type { User, UserRole } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { AddUserDialog } from "./components/add-user-dialog";
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

export default function SettingsPage() {
  const { user, roles, setUserRole, notificationSettings, setNotificationSettings, users, addUser, deleteUser } = useUser();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  if (!user) return null; // Or a loading spinner

  const roleNames: { [key in UserRole]: string } = {
    'Administrator': 'Администратор',
    'Verifier': 'Поверитель',
    'User': 'Пользователь'
  }
  
  const handleAddUser = (name: string, pass: string, role: UserRole): boolean => {
    return addUser(name, pass, role);
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col items-start justify-start">
          <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground">Управляйте своим профилем, безопасностью и настройками интерфейса.</p>
        </div>

        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="space-y-8">
          <AccordionItem value="item-1" className="border-0">
            <Card>
              <AccordionTrigger className="w-full p-4 md:p-6 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                      <UserIcon className="h-6 w-6" />
                      <div className="flex flex-col items-start">
                          <CardTitle className="text-lg md:text-xl">Редактирование профиля</CardTitle>
                          <CardDescription className="text-sm">Здесь вы можете изменить свои контактные данные.</CardDescription>
                      </div>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                  <CardContent className="px-4 md:px-6">
                      <form className="space-y-6">
                          <div className="space-y-2">
                          <Label htmlFor="fullName">ФИО</Label>
                          <Input id="fullName" defaultValue={user.name} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <Label htmlFor="login">Логин</Label>
                              <Input id="login" defaultValue={user.name} readOnly className="cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 bg-slate-100 dark:bg-slate-800" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="role">Роль</Label>
                              <Input id="role" defaultValue={roleNames[user.role]} readOnly className="cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 bg-slate-100 dark:bg-slate-800" />
                          </div>
                          </div>
                      </form>
                  </CardContent>
                  <CardFooter className="px-4 md:px-6">
                      <Button>
                          <Save className="mr-2 h-4 w-4" />
                          Сохранить изменения
                      </Button>
                  </CardFooter>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-0">
            <Card>
              <AccordionTrigger className="w-full p-4 md:p-6 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                      <Shield className="h-6 w-6" />
                      <div className="flex flex-col items-start">
                          <CardTitle className="text-lg md:text-xl">Безопасность</CardTitle>
                          <CardDescription>Управление доступом и безопасностью вашей учетной записи.</CardDescription>
                      </div>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                  <CardContent className="space-y-6 px-4 md:px-6">
                      <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" defaultValue={user.email} readOnly className="cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <Label htmlFor="newPassword">Новый пароль</Label>
                              <Input id="newPassword" type="password" placeholder="••••••••" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                              <Input id="confirmPassword" type="password" placeholder="••••••••" />
                          </div>
                      </div>
                      <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Функционал в разработке</AlertTitle>
                          <AlertDescription>
                              Смена пароля и восстановление доступа будут доступны в следующих версиях.
                          </AlertDescription>
                      </Alert>
                  </CardContent>
                  <CardFooter className="px-4 md:px-6">
                      <Button disabled>
                          <Save className="mr-2 h-4 w-4" />
                          Обновить пароль
                      </Button>
                  </CardFooter>
              </AccordionContent>
            </Card>
          </AccordionItem>
          
          <AccordionItem value="item-3" className="border-0">
              <Card>
              <AccordionTrigger className="w-full p-4 md:p-6 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                      <LayoutGrid className="h-6 w-6" />
                      <div className="flex flex-col items-start">
                          <CardTitle className="text-lg md:text-xl">Интерфейс</CardTitle>
                          <CardDescription>Настройте уведомления и другие элементы интерфейса.</CardDescription>
                      </div>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                  <CardContent className="space-y-8 px-4 md:px-6">
                      <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2 text-base"><Bell className="h-5 w-5" /> Уведомления в меню</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                          Настройте, какие индикаторы-уведомления будут отображаться в боковом меню.
                      </p>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="shippingUnverified" className="text-sm">Отправленные без поверки</Label>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <Bell className="h-3 w-3 text-destructive" />
                                      Красный индикатор (Отправка)
                                  </p>
                              </div>
                              <Switch
                                  id="shippingUnverified"
                                  checked={notificationSettings.shippingUnverified}
                                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, shippingUnverified: checked }))}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="shippingExpired" className="text-sm">Отправленные с истекшим сроком</Label>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <Bell className="h-3 w-3 text-blue-500" />
                                      Синий индикатор (Отправка)
                                  </p>
                              </div>
                              <Switch
                                  id="shippingExpired"
                                  checked={notificationSettings.shippingExpired}
                                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, shippingExpired: checked }))}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="verificationNeeded" className="text-sm">Требуют поверки</Label>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <Bell className="h-3 w-3 text-destructive" />
                                      Красный индикатор (Проверка)
                                  </p>
                              </div>
                              <Switch
                                  id="verificationNeeded"
                                  checked={notificationSettings.verificationNeeded}
                                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, verificationNeeded: checked }))}
                              />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <Label htmlFor="verificationPending" className="text-sm">Просрочены</Label>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <Bell className="h-3 w-3 text-blue-500" />
                                      Синий индикатор (Проверка)
                                  </p>
                              </div>
                              <Switch
                                  id="verificationPending"
                                  checked={notificationSettings.verificationPending}
                                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, verificationPending: checked }))}
                              />
                          </div>
                          </div>
                      </div>
                      <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2 text-base"><Users className="h-5 w-5" /> Смена роли</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                              Это демонстрационная функция для переключения между ролями. 
                              Выберите роль, чтобы увидеть, как меняется интерфейс приложения.
                      </p>
                      <div className="flex flex-wrap gap-2">
                          {roles.map((role) => (
                              <Button 
                                  key={role}
                                  variant={user.role === role ? 'default' : 'outline'}
                                  onClick={() => setUserRole(role as UserRole)}
                              >
                                  {roleNames[role]}
                              </Button>
                          ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                          Текущая роль: <span className="font-semibold text-foreground">{roleNames[user.role]}</span>
                      </p>
                      </div>
                  </CardContent>
              </AccordionContent>
              </Card>
          </AccordionItem>
          
          {user.role === 'Administrator' && (
             <AccordionItem value="item-4" className="border-0">
                <Card>
                <AccordionTrigger className="w-full p-4 md:p-6 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                        <Users className="h-6 w-6" />
                        <div className="flex flex-col items-start">
                            <CardTitle className="text-lg md:text-xl">Управление пользователями</CardTitle>
                            <CardDescription>Добавление, удаление и редактирование учетных записей.</CardDescription>
                        </div>
                    </div>
                </AccordionTrigger>
                <CardContent className="px-4 md:px-6">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsAddUserDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Добавить пользователя
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="font-semibold">{u.name}</p>
                                    <p className="text-sm text-muted-foreground">{roleNames[u.role]}</p>
                                </div>
                                {u.role !== 'Administrator' && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                              <Trash2 className="h-4 w-4"/>
                                           </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Это действие приведет к удалению пользователя <span className="font-bold">{u.name}</span>. Отменить это действие будет невозможно.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Удалить</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
                </Card>
             </AccordionItem>
          )}

        </Accordion>
      </div>

      <AddUserDialog 
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onAddUser={handleAddUser}
      />
    </>
  );
}
