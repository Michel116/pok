
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  Truck,
  Settings,
  ArrowRightLeft,
  Bell,
  ClipboardList,
} from 'lucide-react';
import { useTerminals } from '@/context/terminals-context';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/context/user-context';

const NotificationBell = ({ color, tooltipText }: { color: 'red' | 'blue', tooltipText: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Bell className={cn(
          'h-4 w-4',
          color === 'red' && 'text-destructive',
          color === 'blue' && 'text-blue-500'
        )} />
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { shipments, terminals } = useTerminals();
  const { user, notificationSettings } = useUser();

  const notifications = useMemo(() => {
    const shippingShippedWithoutVerification = notificationSettings.shippingUnverified && shipments.some(s => s.statusBeforeShipment === 'not_verified' || s.statusBeforeShipment === 'pending');
    const shippingShippedExpired = notificationSettings.shippingExpired && shipments.some(s => s.statusBeforeShipment === 'expired');

    const verificationNeeded = notificationSettings.verificationNeeded && terminals.some(t => t.status === 'not_verified');
    const verificationPendingOrExpired = notificationSettings.verificationPending && terminals.some(t => t.status === 'pending' || t.status === 'expired');

    return {
      shipping: {
        red: shippingShippedWithoutVerification,
        blue: shippingShippedExpired,
      },
      verification: {
        red: verificationNeeded,
        blue: verificationPendingOrExpired,
      },
    };
  }, [shipments, terminals, notificationSettings]);

  const navItems = useMemo(() => {
    const allItems = [
      { href: '/dashboard', label: 'Главная', icon: LayoutDashboard, roles: ['Administrator', 'Verifier', 'User'] },
      { href: '/shelves', label: 'Стеллажи', icon: Package, roles: ['Administrator', 'Verifier', 'User'] },
      { href: '/rental', label: 'Аренда', icon: ArrowRightLeft, roles: ['Administrator', 'Verifier', 'User'] },
      { 
        href: '/verification', 
        label: 'Проверка', 
        icon: ShieldCheck,
        roles: ['Administrator', 'Verifier'],
        notifications: [
          { show: notifications.verification.red, color: 'red', tooltip: 'Есть не поверенные' },
          { show: notifications.verification.blue, color: 'blue', tooltip: 'Ожидают/Просрочены' },
        ]
      },
      { 
        href: '/shipping', 
        label: 'Отправка', 
        icon: Truck, 
        roles: ['Administrator', 'Verifier', 'User'],
        notifications: [
          { show: notifications.shipping.red, color: 'red', tooltip: 'Отгружены без поверки' },
          { show: notifications.shipping.blue, color: 'blue', tooltip: 'Отгружены просроченные' },
        ]
      },
      { href: '/requests', label: 'Заявки', icon: ClipboardList, roles: ['Administrator', 'Verifier'] },
      { href: '/settings', label: 'Настройки', icon: Settings, roles: ['Administrator'] },
    ];
    if (!user) return [];
    return allItems.filter(item => item.roles.includes(user.role));
  }, [notifications, user]);

  return (
    <nav
      className={cn("grid gap-2 text-sm font-medium", className)}
      {...props}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            pathname.startsWith(item.href) && item.href !== '/' && "bg-muted text-primary",
            pathname === '/' && item.href === '/dashboard' && "bg-muted text-primary",
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            {item.label}
          </div>
          {item.notifications && (
            <div className="flex items-center gap-1.5">
              {item.notifications.map(n => n.show && (
                <NotificationBell key={n.color} color={n.color as 'red' | 'blue'} tooltipText={n.tooltip} />
              ))}
            </div>
          )}
        </Link>
      ))}
    </nav>
  );
}
