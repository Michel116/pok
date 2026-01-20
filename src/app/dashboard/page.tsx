
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  ShieldAlert,
  CheckCircle,
  XCircle,
  CalendarClock,
  PackagePlus,
  Search,
  Archive,
  AlertCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useTerminals } from '@/context/terminals-context';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddTerminalDialog } from '@/components/shared/add-terminal-dialog';
import type { BoxType, TerminalStatus } from '@/lib/types';
import { TerminalDetailsSheet } from '../shelves/components/terminal-details-sheet';
import type { Terminal } from '@/lib/types';
import { cn } from '@/lib/utils';


const statusConfig = {
  verified: {
    label: 'Поверен',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  pending: {
    label: 'Ожидает',
    icon: ShieldAlert,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  not_verified: {
    label: 'Не поверен',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
  expired: {
    label: 'Просрочен',
    icon: CalendarClock,
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  },
   shipped: {
    label: 'Отгружен',
    icon: Package,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  },
  awaits_verification_after_shipping: {
    label: 'Отгружен (ждет поверки)',
    icon: Package,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  },
  rented: {
    label: 'В аренде',
    icon: Package,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  }
};


export default function DashboardPage() {
  const { terminals, addTerminal } = useTerminals();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [activeFilter, setActiveFilter] = useState<TerminalStatus | 'all'>('all');

  const stats = useMemo(() => {
    const onStock = terminals.filter(
      (t) => t.status !== 'shipped' && t.status !== 'rented' && t.status !== 'awaits_verification_after_shipping'
    );
    return {
      totalOnStock: onStock.length,
      pending: onStock.filter((t) => t.status === 'pending').length,
      verified: onStock.filter((t) => t.status === 'verified').length,
      notVerified: onStock.filter((t) => t.status === 'not_verified').length,
      expired: onStock.filter((t) => t.status === 'expired').length,
    };
  }, [terminals]);

  const filteredTerminals = useMemo(() => {
    const onStockTerminals = terminals.filter(
        (t) => t.status !== 'shipped' && t.status !== 'rented' && t.status !== 'awaits_verification_after_shipping'
    );

    let filtered = onStockTerminals;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(terminal => terminal.status === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((terminal) =>
        terminal.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;

  }, [terminals, searchQuery, activeFilter]);
  
  const handleAddTerminal = (serialNumber: string, boxType: BoxType, sectionId?: string): boolean => {
    return addTerminal(serialNumber, boxType, sectionId);
  };
  
  const handleTerminalClick = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
  };
  
  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedTerminal(null);
    }
  };
  
  const handleFilterClick = (filter: TerminalStatus | 'all') => {
    setActiveFilter(filter);
  };

  const statCards: {id: TerminalStatus | 'all', title: string, count: number, icon: React.ElementType, gradient: string, ringColor: string}[] = [
    { id: 'all', title: 'Всего на складе', count: stats.totalOnStock, icon: Archive, gradient: 'bg-gradient-to-br from-blue-500 to-cyan-400', ringColor: 'ring-blue-500' },
    { id: 'pending', title: 'Ожидают поверки', count: stats.pending, icon: Clock, gradient: 'bg-gradient-to-br from-yellow-500 to-amber-400', ringColor: 'ring-yellow-500' },
    { id: 'verified', title: 'Поверено', count: stats.verified, icon: ShieldCheck, gradient: 'bg-gradient-to-br from-green-500 to-lime-400', ringColor: 'ring-green-500' },
    { id: 'not_verified', title: 'Не поверено', count: stats.notVerified, icon: AlertCircle, gradient: 'bg-gradient-to-br from-red-500 to-pink-400', ringColor: 'ring-red-500' },
    { id: 'expired', title: 'Просрочено', count: stats.expired, icon: CalendarClock, gradient: 'bg-gradient-to-br from-indigo-500 to-purple-400', ringColor: 'ring-indigo-500' },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Главная страница</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow w-full sm:w-auto md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по S/N..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <PackagePlus className="mr-2 h-4 w-4" />
            Добавить терминал
          </Button>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map(card => (
          <button key={card.id} onClick={() => handleFilterClick(card.id)} className="w-full text-left rounded-lg">
            <Card className={cn(
              "text-white shadow-lg transition-all duration-300 ease-in-out overflow-hidden relative",
              card.gradient,
              activeFilter === card.id 
                ? `ring-2 ring-offset-2 ${card.ringColor}` 
                : 'hover:scale-105 hover:shadow-2xl'
            )}>
              <div className="absolute -right-6 -bottom-6 opacity-15 transform-gpu rotate-[-20deg]">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V8L12 3L3 8V16L12 21L21 16Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3.27 8L12 12.5L20.73 8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 21V12.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
               <div className="absolute top-2 left-2 opacity-10">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 8.5L12 3.5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 15.5L12 20.5L3 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3.5V20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-white/90">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-white/90" />
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-4xl font-bold">{card.count}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {activeFilter === 'all' ? 'Все терминалы на складе' : `Терминалы в статусе: ${statusConfig[activeFilter as TerminalStatus]?.label || ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Расположение</TableHead>
                  <TableHead>Поверен до</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerminals.map((terminal) => {
                    const statusInfo = statusConfig[terminal.status as TerminalStatus];
                    if (!statusInfo) return null;
                    return (
                      <TableRow key={terminal.serialNumber} onClick={() => handleTerminalClick(terminal)} className="cursor-pointer">
                        <TableCell className="font-medium">
                          {terminal.serialNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("whitespace-nowrap", statusInfo.className)}
                          >
                            <statusInfo.icon className="mr-2 h-4 w-4" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {terminal.location
                            ? `Стеллаж ${terminal.location.sectionId}`
                            : 'Не размещен'}
                        </TableCell>
                        <TableCell>
                          {terminal.verifiedUntil
                            ? new Date(terminal.verifiedUntil).toLocaleDateString('ru-RU')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <AddTerminalDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTerminal={handleAddTerminal}
        dialogType="regular"
      />
      <TerminalDetailsSheet
        terminal={selectedTerminal}
        isOpen={!!selectedTerminal}
        onOpenChange={handleSheetOpenChange}
      />
    </>
  );
}
