
'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TerminalStatus, Terminal } from "@/lib/types";
import { Clock, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { useMemo } from "react";

type VerificationFiltersProps = {
    terminals: Terminal[];
    activeFilter: TerminalStatus | 'all';
    onFilterChange: (filter: TerminalStatus | 'all') => void;
};

export function VerificationFilters({ terminals, activeFilter, onFilterChange }: VerificationFiltersProps) {

    const counts = useMemo(() => ({
        verified: terminals.filter(t => t.status === 'verified').length,
        pending: terminals.filter(t => t.status === 'pending').length,
        expired: terminals.filter(t => t.status === 'expired').length,
        not_verified: terminals.filter(t => t.status === 'not_verified').length
    }), [terminals]);

    const filters = [
        { id: 'all', label: 'Все', activeClassName: 'border-primary text-primary' },
        { id: 'verified', label: 'Поверенные', count: counts.verified, icon: CheckCircle, className: "hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/50 dark:hover:text-green-300", activeClassName: "bg-green-100 text-green-800 border-green-500/50 dark:bg-green-900/50 dark:text-green-300" },
        { id: 'pending', label: 'Ожидают', count: counts.pending, icon: Clock, className: "hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/50 dark:hover:text-yellow-300", activeClassName: "bg-yellow-100 text-yellow-800 border-yellow-500/50 dark:bg-yellow-900/50 dark:text-yellow-300" },
        { id: 'expired', label: 'Просрочены', count: counts.expired, icon: AlertTriangle, className: "hover:bg-indigo-100 hover:text-indigo-800 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300", activeClassName: "bg-indigo-100 text-indigo-800 border-indigo-500/50 dark:bg-indigo-900/50 dark:text-indigo-300" },
        { id: 'not_verified', label: 'Не поверены', count: counts.not_verified, icon: XCircle, className: "hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/50 dark:hover:text-red-300", activeClassName: "bg-red-100 text-red-800 border-red-500/50 dark:bg-red-900/50 dark:text-red-300" }
    ];

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {filters.map(filter => (
                <Button
                    key={filter.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange(filter.id as TerminalStatus | 'all')}
                    className={cn(
                        "transition-all",
                        activeFilter === filter.id 
                            ? filter.activeClassName
                            : 'text-muted-foreground',
                        filter.className,
                        filter.id !== 'all' && 'gap-2'
                    )}
                >
                    {filter.icon && <filter.icon className="h-4 w-4" />}
                    <span className="hidden sm:inline">{filter.label}</span>
                    {filter.count !== undefined && (
                        <Badge variant="secondary" className={cn(
                            "rounded-full px-2",
                             activeFilter === filter.id ? 'bg-background/70 text-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                        )}>
                            {filter.count}
                        </Badge>
                    )}
                </Button>
            ))}
        </div>
    );
}
