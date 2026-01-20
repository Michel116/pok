
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, History, Clock, AlertTriangle, XCircle, CheckCircle, Bot, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Terminal } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('ru-RU');
  } catch (e) {
    return '—';
  }
};

type ColumnsOptions = {
    onView: (terminal: Terminal) => void;
    onHistory: (terminal: Terminal) => void;
    onBot: (terminal: Terminal) => void;
    loadingTerminals: Set<string>;
    resultTerminals: Map<string, 'idle' | 'searching' | 'success' | 'error'>;
}

export const getColumns = ({ onView, onHistory, onBot, loadingTerminals, resultTerminals }: ColumnsOptions): ColumnDef<Terminal>[] => [
  {
    accessorKey: "serialNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Серийный номер
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="pl-4">{row.getValue("serialNumber")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Статус
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      const statusConfig = {
        pending: { label: "Ожидает", icon: Clock, variant: "warning" },
        verified: { label: "Поверен", icon: CheckCircle, variant: "success" },
        not_verified: { label: "Не поверен", icon: XCircle, variant: "destructive" },
        expired: { label: "Просрочен", icon: AlertTriangle, variant: "indigo" }
      }[status] || { label: status, icon: null, variant: "default" };

      return (
        <Badge variant={statusConfig.variant as any} className="font-normal">
          {statusConfig.icon && <statusConfig.icon className="mr-2 h-4 w-4" />}
          {statusConfig.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lastVerificationDate",
    header: "Дата поверки",
    cell: ({ row }) => formatDate(row.getValue("lastVerificationDate"))
  },
  {
    accessorKey: "verifiedUntil",
    header: "Поверен до",
    cell: ({ row }) => {
        const date = row.getValue("verifiedUntil") as string | undefined;
        const status = row.original.status;
        const isExpired = status === 'expired';
        const dateFormatted = formatDate(date);

        if (isExpired && date) {
            return <span className="text-indigo-600 dark:text-indigo-400 font-medium">{dateFormatted}</span>;
        }
        return dateFormatted;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const terminal = row.original;
      const status = resultTerminals.get(terminal.serialNumber) || 'idle';

      if (status === 'searching') {
        return (
          <div className="flex items-center justify-end gap-2 pr-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Search className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Поиск..</span>
            </div>
          </div>
        );
      }

      if (status === 'success') {
        return (
          <div className="flex items-center justify-end gap-2 pr-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Успешно</span>
            </div>
          </div>
        );
      }

      if (status === 'error') {
        return (
          <div className="flex items-center justify-end gap-2 pr-4">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Ошибка</span>
            </div>
          </div>
        );
      }

      // idle: show buttons
      return (
        <div className="flex items-center justify-end gap-2 pr-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onBot(terminal); }}>
                  <Bot className="h-4 w-4" />
                  <span className="sr-only">Автоматическая проверка в Аршин</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Автоматическая проверка в Аршин</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(terminal); }}>
                  <Edit className="h-4 w-4" />
                   <span className="sr-only">Редактировать</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Назначить/изменить поверку</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onHistory(terminal); }}>
                        <History className="h-4 w-4" />
                        <span className="sr-only">История поверок</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>История поверок</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
