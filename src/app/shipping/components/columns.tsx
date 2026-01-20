"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, Eye, History, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShipmentWithDetails } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ColumnsOptions = {
    onView: (shipment: ShipmentWithDetails) => void;
}

export const getColumns = ({ onView }: ColumnsOptions): ColumnDef<ShipmentWithDetails>[] => [
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
    accessorKey: "contragent",
    header: "Контрагент",
  },
  {
    accessorKey: "shippingDate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Дата отправки
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const date = row.getValue("shippingDate") as string;
        const statusBefore = row.original.initialStatus;
        const needsVerification = statusBefore === 'pending' && !row.original.lastVerificationDate;
        const wasExpired = statusBefore === 'expired';

        const needsWarning = needsVerification || wasExpired;

        return (
          <Badge variant={needsWarning ? "warning" : "outline"} className={cn("font-normal", !needsWarning && "border-transparent bg-transparent")}>
            {needsWarning && <AlertTriangle className="mr-2 h-4 w-4" />}
            <span>{new Date(date).toLocaleDateString('ru-RU')}</span>
          </Badge>
        )
    }
  },
  {
    accessorKey: 'lastVerificationDate',
    header: 'Дата поверки',
    cell: ({ row }) => {
        const date = row.original.lastVerificationDate;
        return date ? new Date(date).toLocaleDateString('ru-RU') : '—';
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const shipment = row.original;
      return (
        <div className="flex items-center justify-end gap-2 pr-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(shipment); }}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Просмотр</span>
          </Button>
        </div>
      );
    },
  },
];
